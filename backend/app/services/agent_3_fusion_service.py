import uuid

from agents.agent_3_fusion_agent import FusionAgent
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
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
        clusters = []
        merged_count = 0

        for candidate in candidates:
            target = None
            for cluster in clusters:
                result = self.agent.check_duplicate(
                    self._candidate_dict(candidate),
                    self._cluster_dict(cluster),
                )
                if result.get("is_duplicate") and result.get("confidence", 0) > 0.65:
                    target = cluster
                    cluster["title"] = result.get("merged_title") or cluster["title"]
                    cluster["description"] = result.get("merged_description") or cluster["description"]
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

    def _candidate_dict(self, candidate):
        return {"title": candidate.title, "description": candidate.description or ""}

    def _cluster_dict(self, cluster):
        return {"title": cluster["title"], "description": cluster.get("description") or ""}

    def _max_urgency(self, current, new):
        order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return new if order.get(new or "medium", 2) > order.get(current or "medium", 2) else current
