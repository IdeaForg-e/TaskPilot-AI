import uuid

from agents.agent_3_fusion_agent import FusionAgent
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.source_event import SourceEvent
from app.models.task import MasterTask, TaskCandidate, TaskContextLink


class FusionService:
    def __init__(self, db):
        self.db = db
        self.agent = FusionAgent()

    def fuse_all(self):
        self.db.query(PriorityScore).delete()
        self.db.query(QualityReport).delete()
        self.db.query(TaskContextLink).delete()
        self.db.query(MasterTask).delete()

        candidates = self.db.query(TaskCandidate).all()
        events = self.db.query(SourceEvent).all()
        event_map = {e.id: e for e in events}

        clusters = []
        merged_count = 0

        for candidate in candidates:
            cand_source = event_map.get(candidate.source_event_id).source if (candidate.source_event_id and candidate.source_event_id in event_map) else None
            target = None

            for cluster in clusters:
                threshold = 0.65

                cand_assignee = candidate.assignee
                clust_assignee = cluster.get("assignee")
                if cand_assignee and clust_assignee and cand_assignee.strip().lower() != clust_assignee.strip().lower():
                    threshold += 0.15

                clust_sources = {event_map.get(c.source_event_id).source for c in cluster["candidates"] if c.source_event_id and c.source_event_id in event_map}
                if cand_source and clust_sources and cand_source not in clust_sources:
                    threshold += 0.05

                cand_deadline = candidate.deadline
                clust_deadline = cluster.get("deadline")
                if cand_deadline and clust_deadline and cand_deadline != clust_deadline:
                    threshold += 0.10

                result = self.agent.check_duplicate(
                    self._candidate_dict(candidate, cand_source),
                    self._cluster_dict(cluster),
                )
                if result.get("is_duplicate") and result.get("confidence", 0) > threshold:
                    target = cluster
                    cluster["title"] = result.get("merged_title") or cluster["title"]
                    
                    orig_desc = cluster["description"] or ""
                    new_desc = candidate.description or ""
                    if orig_desc and new_desc and new_desc not in orig_desc:
                        if not orig_desc.startswith("Original:"):
                            orig_desc = f"Original: {orig_desc}"
                        cluster["description"] = f"{orig_desc}. Fused Signal details: {new_desc}"
                    elif not orig_desc:
                        cluster["description"] = new_desc

                    merged_count += 1
                    break

            if target is None:
                target = {
                    "title": candidate.title,
                    "description": candidate.description,
                    "task_type": candidate.task_type,
                    "assignee": candidate.assignee,
                    "deadline": candidate.deadline,
                    "urgency": candidate.urgency,
                    "source_platform": cand_source,
                    "candidates": [],
                }
                clusters.append(target)
            target["candidates"].append(candidate)
            target["urgency"] = self._max_urgency(target.get("urgency"), candidate.urgency)
            target["assignee"] = target.get("assignee") or candidate.assignee
            target["deadline"] = target.get("deadline") or candidate.deadline

        for cluster in clusters:
            master = MasterTask(
                id=str(uuid.uuid4()),
                title=cluster["title"],
                description=cluster["description"],
                task_type=cluster["task_type"],
                status="open",
                assignee=cluster["assignee"],
                deadline=cluster["deadline"],
                urgency=cluster["urgency"],
                source_count=len(cluster["candidates"]),
                fusion_run_id="demo",
            )
            self.db.add(master)
            self.db.flush()
            for candidate in cluster["candidates"]:
                if candidate.source_event_id:
                    self.db.add(
                        TaskContextLink(
                            id=str(uuid.uuid4()),
                            master_task_id=master.id,
                            source_event_id=candidate.source_event_id,
                            link_type="origin" if len(cluster["candidates"]) == 1 else "related",
                            similarity_score=1.0,
                        )
                    )

        self.db.commit()
        return {
            "input_candidates": len(candidates),
            "master_tasks": len(clusters),
            "duplicates_merged": merged_count,
        }

    def _candidate_dict(self, candidate, source_platform=None):
        return {
            "title": candidate.title,
            "description": candidate.description or "",
            "assignee": candidate.assignee,
            "source_platform": source_platform,
            "deadline": candidate.deadline,
        }

    def _cluster_dict(self, cluster):
        return {
            "title": cluster["title"],
            "description": cluster.get("description") or "",
            "assignee": cluster.get("assignee"),
            "source_platform": cluster.get("source_platform"),
            "deadline": cluster.get("deadline"),
        }

    def _max_urgency(self, current, new):
        order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return new if order.get(new or "medium", 2) > order.get(current or "medium", 2) else current
