from sqlalchemy.orm import Session
from datetime import datetime
from app.models.task import MasterTask, TaskContextLink
from app.models.priority_score import PriorityScore
from app.services.prioritization_engine import RawTask, prioritize

class PrioritizationService:
    def __init__(self, db: Session):
        self.db = db
    
    def prioritize_all(self) -> dict:
        # Fetch all master tasks
        tasks = self.db.query(MasterTask).all()
        if not tasks:
            return {"ranked_tasks": [], "message": "No tasks in database to prioritize"}

        raw_tasks = []
        for t in tasks:
            # Parse due_date from deadline string (assuming YYYY-MM-DD)
            due_date = None
            if t.deadline:
                try:
                    due_date = datetime.strptime(t.deadline.strip(), "%Y-%m-%d").date()
                except Exception:
                    # If date parsing fails, leave as None (degrades to fallback)
                    pass

            # Fetch source references to satisfy traceability constraint
            links = self.db.query(TaskContextLink).filter(TaskContextLink.master_task_id == t.id).all()
            source_refs = [lk.source_event_id for lk in links] if links else [f"manual:{t.id}"]

            # Construct RawTask for the engine
            raw_tasks.append(RawTask(
                task_id=t.id,
                title=t.title,
                source_refs=source_refs,
                severity=t.urgency,
                due_date=due_date,
                blocking_count=t.source_count - 1 if t.source_count else 0, # block count placeholder based on sources
                description=t.description or ""
            ))

        # Run prioritization engine calculation
        result = prioritize(raw_tasks)

        # Clear existing priority scores to prevent duplicates
        self.db.query(PriorityScore).delete()
        self.db.db_committed = False # reset session flag if applicable

        # Save computed priority scores to database
        for item in result.get("ranked_tasks", []):
            score_entry = PriorityScore(
                master_task_id=item["task_id"],
                overall_score=item["priority_score"],
                severity_score=item["component_scores"].get("severity", 0.0),
                deadline_score=item["component_scores"].get("deadline", 0.0),
                dependency_score=item["component_scores"].get("dependency", 0.0),
                rank=item["rank"],
                explanation=item["rationale"]
            )
            self.db.add(score_entry)
        
        self.db.commit()
        return result
    
    def get_ranked(self) -> dict:
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        task_map = {t.id: t for t in self.db.query(MasterTask).all()}

        ranked_tasks = []
        for s in scores:
            task = task_map.get(s.master_task_id)
            if task:
                ranked_tasks.append({
                    "rank": s.rank,
                    "task_id": s.master_task_id,
                    "title": task.title,
                    "priority_score": s.overall_score,
                    "rationale": s.explanation,
                    "task_type": task.task_type,
                    "urgency": task.urgency,
                    "deadline": task.deadline,
                    "status": task.status
                })

        return {
            "ranked_tasks": ranked_tasks,
            "total": len(ranked_tasks)
        }