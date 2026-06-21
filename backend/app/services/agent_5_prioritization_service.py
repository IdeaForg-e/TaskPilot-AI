import uuid
import logging

from agents.agent_5_prioritization_agent import PrioritizationAgent
from agents.llm_client import LLMClient
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.task import MasterTask


class PrioritizationService:
    def __init__(self, db):
        self.db = db
        self.agent = PrioritizationAgent()

    def prioritize_all(self):
        logger = logging.getLogger("taskpilot.prioritization_service")
        self.db.query(PriorityScore).delete()
        quality_by_task = {
            report.master_task_id: report.overall_score
            for report in self.db.query(QualityReport).all()
        }
        
        tasks = self.db.query(MasterTask).all()
        tasks_list = [self._task_dict(task) for task in tasks]
        
        # Invoke LLM prioritization in batches of 20 tasks
        batch_results = self.agent.score_batch(tasks_list, quality_by_task)
        
        # Developer workload check
        workload = {}
        for task in tasks:
            if task.assignee:
                workload[task.assignee] = workload.get(task.assignee, 0) + 1

        for assignee, count in workload.items():
            if count > 3:
                warning_msg = f"Developer '{assignee}' has an overloaded queue with {count} active tasks."
                logger.warning(warning_msg)
                LLMClient._add_diagnostic("warning", warning_msg)

        blocker_keywords = ["blocks", "dependent on", "blocker for", "blocking"]
        scored = []
        for task in tasks:
            result = batch_results.get(task.id, {})
            
            desc_lower = (task.description or "").lower()
            title_lower = (task.title or "").lower()
            is_blocker = any(kw in desc_lower or kw in title_lower for kw in blocker_keywords)

            overall_score = result.get("overall_score", 5.0)
            blocker_score = result.get("blocker_score", 3.0)
            explanation = result.get("explanation", "")

            if is_blocker:
                overall_score = min(10.0, overall_score + 2.0)
                blocker_score = 10.0
                explanation = f"[Blocker Boost] {explanation}"

            score = PriorityScore(
                id=str(uuid.uuid4()),
                master_task_id=task.id,
                overall_score=overall_score,
                severity_score=result.get("severity_score"),
                deadline_score=result.get("deadline_score"),
                production_impact_score=result.get("production_impact_score"),
                customer_impact_score=result.get("customer_impact_score"),
                dependency_score=result.get("dependency_score"),
                blocker_score=blocker_score,
                business_impact_score=result.get("business_impact_score"),
                quality_factor_score=result.get("quality_factor_score"),
                explanation=explanation,
            )
            self.db.add(score)
            scored.append((task, score))

        from app.models.task import TaskContextLink
        from app.models.source_event import SourceEvent
        links = self.db.query(TaskContextLink.master_task_id, SourceEvent.source).\
            join(SourceEvent, SourceEvent.id == TaskContextLink.source_event_id).all()
        task_sources = {}
        for master_task_id, source in links:
            if master_task_id not in task_sources:
                task_sources[master_task_id] = set()
            task_sources[master_task_id].add(source)

        scored.sort(key=lambda pair: pair[1].overall_score or 0, reverse=True)
        ranked = []
        for rank, (task, score) in enumerate(scored, start=1):
            score.rank = rank
            ranked.append(self._score_out(score, task, task_sources.get(task.id, set())))

        self.db.commit()
        return {"total_ranked": len(ranked), "ranked_tasks": ranked}

    def get_ranked(self):
        from app.models.task import TaskContextLink
        from app.models.source_event import SourceEvent
        
        tasks = {task.id: task for task in self.db.query(MasterTask).all()}
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        
        links = self.db.query(TaskContextLink.master_task_id, SourceEvent.source).\
            join(SourceEvent, SourceEvent.id == TaskContextLink.source_event_id).all()
        task_sources = {}
        for master_task_id, source in links:
            if master_task_id not in task_sources:
                task_sources[master_task_id] = set()
            task_sources[master_task_id].add(source)
            
        return [self._score_out(score, tasks.get(score.master_task_id), task_sources.get(score.master_task_id, set())) for score in scores]

    def _task_dict(self, task):
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "task_type": task.task_type,
            "urgency": task.urgency,
            "deadline": task.deadline,
            "source_count": task.source_count,
        }

    def _score_out(self, score, task, sources=None):
        task_title = task.title if task else ""
        if sources is None and task:
            from app.models.task import TaskContextLink
            from app.models.source_event import SourceEvent
            sources = [
                s[0] for s in self.db.query(SourceEvent.source).\
                    join(TaskContextLink, TaskContextLink.source_event_id == SourceEvent.id).\
                    filter(TaskContextLink.master_task_id == task.id).distinct().all()
            ]
        elif sources is None:
            sources = []

        return {
            "id": score.id,
            "rank": score.rank,
            "master_task_id": score.master_task_id,
            "task_id": score.master_task_id,
            "task_title": task_title,
            "title": task_title,
            "overall_score": score.overall_score,
            "score": score.overall_score,
            "priority_score": score.overall_score,
            "explanation": score.explanation,
            "severity_score": score.severity_score,
            "deadline_score": score.deadline_score,
            "production_impact_score": score.production_impact_score,
            "customer_impact_score": score.customer_impact_score,
            "dependency_score": score.dependency_score,
            "blocker_score": score.blocker_score,
            "business_impact_score": score.business_impact_score,
            "quality_factor_score": score.quality_factor_score,
            "urgency": task.urgency if task else None,
            "task_type": task.task_type if task else None,
            "assignee": task.assignee if task else None,
            "source_count": task.source_count if task else 0,
            "platforms": sorted(list(sources)),
            "agent_summary": (
                f"Priority agent scored this from {task.source_count if task else 0} fused signal(s), "
                "balancing impact, deadline, blockers, and issue quality."
            ),
        }
