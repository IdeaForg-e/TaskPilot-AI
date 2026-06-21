import uuid

from agents.agent_2_extraction_agent import ExtractionAgent
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.source_event import SourceEvent
from app.models.task import MasterTask, TaskCandidate, TaskContextLink


class ExtractionService:
    def __init__(self, db):
        self.db = db
        self.agent = ExtractionAgent()

    def extract_all(self, include_hidden=True, min_confidence=0.5):
        self.db.query(TimeSlot).delete()
        self.db.query(DailyPlan).delete()
        self.db.query(PriorityScore).delete()
        self.db.query(QualityReport).delete()
        self.db.query(TaskContextLink).delete()
        self.db.query(MasterTask).delete()
        self.db.query(TaskCandidate).delete()
        events = self.db.query(SourceEvent).all()
        explicit_count = 0
        hidden_count = 0
        tasks = []

        from concurrent.futures import ThreadPoolExecutor

        hidden_events = []
        for event in events:
            item = event.metadata_json or {}
            if event.source in ("jira", "github", "incident"):
                result = self.agent.extract_explicit_task(event.source, item)
                candidate = self._create_candidate(event, result, is_hidden=False)
                self.db.add(candidate)
                explicit_count += 1
                tasks.append(candidate)
            elif event.source in ("slack", "email", "meeting") and include_hidden:
                hidden_events.append(event)

        def process_hidden(event):
            item = event.metadata_json or {}
            res = self.agent.extract_hidden_tasks(event.source, item)
            return event, res

        if hidden_events:
            with ThreadPoolExecutor(max_workers=4) as executor:
                hidden_results = list(executor.map(process_hidden, hidden_events))
            
            for event, results in hidden_results:
                for hidden in results:
                    confidence = float(hidden.get("confidence", 0.7) or 0.7)
                    if confidence < min_confidence:
                        continue
                    candidate = self._create_candidate(event, hidden, is_hidden=True, confidence=confidence)
                    self.db.add(candidate)
                    hidden_count += 1
                    tasks.append(candidate)

        self.db.commit()
        return {
            "total_tasks": explicit_count + hidden_count,
            "explicit_tasks": explicit_count,
            "hidden_tasks": hidden_count,
            "tasks": [self._candidate_out(task) for task in tasks],
        }

    def get_results(self):
        candidates = self.db.query(TaskCandidate).all()
        return {
            "total": len(candidates),
            "explicit": len([c for c in candidates if not c.is_hidden]),
            "hidden": len([c for c in candidates if c.is_hidden]),
            "tasks": [self._candidate_out(c) for c in candidates],
        }

    def _create_candidate(self, event, data, is_hidden, confidence=1.0):
        return TaskCandidate(
            id=str(uuid.uuid4()),
            title=data.get("title") or event.title or "Untitled task",
            description=data.get("description") or event.content or "",
            source_event_id=event.id,
            task_type=data.get("task_type") or ("request" if is_hidden else event.event_type),
            is_hidden=is_hidden,
            assignee=data.get("assignee"),
            deadline=data.get("deadline"),
            urgency=data.get("urgency", "medium"),
            confidence=confidence,
            extraction_run_id="demo",
        )

    def _candidate_out(self, candidate):
        return {
            "id": candidate.id,
            "title": candidate.title,
            "description": candidate.description,
            "task_type": candidate.task_type,
            "is_hidden": candidate.is_hidden,
            "assignee": candidate.assignee,
            "deadline": candidate.deadline,
            "urgency": candidate.urgency,
            "confidence": candidate.confidence,
            "source_event_id": candidate.source_event_id,
        }
