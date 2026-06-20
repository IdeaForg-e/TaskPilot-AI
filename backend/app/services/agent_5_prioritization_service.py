import uuid

from agents.agent_5_prioritization_agent import PrioritizationAgent
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.task import MasterTask


class PrioritizationService:
    def __init__(self, db):
        self.db = db
        self.agent = PrioritizationAgent()

    def prioritize_all(self):
        self.db.query(PriorityScore).delete()
        quality_by_task = {
            report.master_task_id: report.overall_score
            for report in self.db.query(QualityReport).all()
        }
        
        tasks = self.db.query(MasterTask).all()
        tasks_list = [self._task_dict(task) for task in tasks]
        
        # Invoke LLM prioritization in batches of 20 tasks
        batch_results = self.agent.score_batch(tasks_list, quality_by_task)
        
        scored = []
        for task in tasks:
            result = batch_results.get(task.id, {})
            score = PriorityScore(
                id=str(uuid.uuid4()),
                master_task_id=task.id,
                overall_score=result.get("overall_score", 5.0),
                severity_score=result.get("severity_score"),
                deadline_score=result.get("deadline_score"),
                production_impact_score=result.get("production_impact_score"),
                customer_impact_score=result.get("customer_impact_score"),
                dependency_score=result.get("dependency_score"),
                blocker_score=result.get("blocker_score"),
                business_impact_score=result.get("business_impact_score"),
                quality_factor_score=result.get("quality_factor_score"),
                explanation=result.get("explanation", ""),
            )
            self.db.add(score)
            scored.append((task, score))

        scored.sort(key=lambda pair: pair[1].overall_score or 0, reverse=True)
        ranked = []
        for rank, (task, score) in enumerate(scored, start=1):
            score.rank = rank
            ranked.append(self._score_out(score, task))

        self.db.commit()
        return {"total_ranked": len(ranked), "ranked_tasks": ranked}

    def get_ranked(self):
        tasks = {task.id: task for task in self.db.query(MasterTask).all()}
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        return [self._score_out(score, tasks.get(score.master_task_id)) for score in scores]

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

    def _score_out(self, score, task):
        task_title = task.title if task else ""
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
            "agent_summary": (
                f"Priority agent scored this from {task.source_count if task else 0} fused signal(s), "
                "balancing impact, deadline, blockers, and issue quality."
            ),
        }
