import json
import os
import uuid
from datetime import datetime

from app.config import settings
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.source_event import SourceEvent
from app.models.task import MasterTask, TaskCandidate, TaskContextLink


SOURCE_FILES = {
    "github": "github_data.json",
    "slack": "slack_data.json",
    "email": "emails.json",
    "calendar": "calendar.json",
    "meetings": "meeting_notes.json",
    "meeting": "meeting_notes.json",
}


class IngestionService:
    def __init__(self, db):
        self.db = db

    def ingest_all(self, sources, clear=True):
        selected_sources = sources or list(SOURCE_FILES.keys())
        if clear:
            self._clear_pipeline_data()
        # In incremental mode, skip events that were already ingested
        existing_keys = set()
        if not clear:
            for src, sid in self.db.query(SourceEvent.source, SourceEvent.source_id).all():
                existing_keys.add((src, str(sid)))

        per_source = {}
        total = 0
        skipped = 0

        for source in selected_sources:
            filename = SOURCE_FILES.get(source)
            if not filename:
                continue
            path = os.path.join(settings.DATA_DIR, filename)
            if not os.path.exists(path):
                continue

            with open(path, "r", encoding="utf-8") as handle:
                items = json.load(handle)

            normalized_source = "meeting" if source == "meetings" else source
            added = 0
            for item in items:
                event_key = (normalized_source, str(item.get("id") or item.get("key") or item.get("number")))
                if not clear and event_key in existing_keys:
                    skipped += 1
                    continue
                self.db.add(self._to_event(normalized_source, item))
                added += 1

            per_source[normalized_source] = added
            total += added

        self.db.commit()
        return {
            "total_events": total,
            "per_source": per_source,
            "new_events": total,
            "skipped_existing": skipped,
            "incremental": not clear,
        }

    def get_event_count(self):
        return self.db.query(SourceEvent).count()

    def _clear_pipeline_data(self):
        self.db.query(TimeSlot).delete()
        self.db.query(DailyPlan).delete()
        self.db.query(PriorityScore).delete()
        self.db.query(QualityReport).delete()
        self.db.query(TaskContextLink).delete()
        self.db.query(MasterTask).delete()
        self.db.query(TaskCandidate).delete()
        self.db.query(SourceEvent).delete()

    def _to_event(self, source, item):
        timestamp = (
            item.get("timestamp")
            or item.get("updated_at")
            or item.get("created_at")
            or item.get("date")
        )
        return SourceEvent(
            id=str(uuid.uuid4()),
            source=source,
            source_id=item.get("id") or item.get("key") or item.get("number"),
            event_type=self._event_type(source, item),
            title=item.get("title") or item.get("subject") or item.get("key"),
            content=self._content_for(source, item),
            author=item.get("author") or item.get("reporter") or item.get("from") or item.get("organizer"),
            timestamp=self._parse_timestamp(timestamp),
            metadata_json=item,
            ingestion_run_id="demo",
        )

    def _event_type(self, source, item):
        if source == "github":
            return "pull_request" if item.get("type") == "Pull Request" else "issue"
        if source == "jira":
            return "ticket"
        if source == "slack":
            return "message"
        if source == "email":
            return "email"
        return source

    def _content_for(self, source, item):
        if source == "slack":
            return item.get("content", "")
        if source == "email":
            return f"{item.get('subject', '')}\n\n{item.get('body', '')}"
        if source == "meeting":
            return json.dumps(
                {
                    "summary": item.get("summary"),
                    "discussion_points": item.get("discussion_points"),
                    "action_items": item.get("action_items"),
                    "decisions": item.get("decisions"),
                },
                ensure_ascii=False,
            )
        if source == "incident":
            return f"{item.get('title', '')}\n{item.get('description', '')}\nRoot cause: {item.get('root_cause', '')}\nResolution: {item.get('resolution', '')}"
        return item.get("description") or item.get("body") or json.dumps(item, ensure_ascii=False)

    def _parse_timestamp(self, value):
        if not value:
            return None
        if len(value) == 10:
            value = f"{value}T00:00:00"
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
