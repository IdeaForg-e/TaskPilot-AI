from sqlalchemy.orm import Session
from datetime import datetime
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.task import MasterTask
from app.services.prioritization_service import PrioritizationService
from app.services.daily_planner import build_daily_plan

class PlanningService:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_plan(self, user_id: str, date_str: str, buffer_hours: float = 1.0) -> dict:
        # 1. Run prioritization logic to get current ranked list
        prioritize_svc = PrioritizationService(self.db)
        prioritized = prioritize_svc.prioritize_all()

        # Parse date_str to Date object
        try:
            plan_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
        except Exception:
            plan_date = datetime.today().date()

        # 2. Build the daily plan via the daily_planner engine
        plan_output = build_daily_plan(
            prioritized,
            plan_date=plan_date,
            max_tasks=8
        )

        # Clear any existing plan for this date to avoid duplicate slots
        existing_plan = self.db.query(DailyPlan).filter(
            DailyPlan.user_id == user_id, 
            DailyPlan.plan_date == date_str
        ).first()
        if existing_plan:
            self.db.query(TimeSlot).filter(TimeSlot.daily_plan_id == existing_plan.id).delete()
            self.db.delete(existing_plan)

        # 3. Create DailyPlan database record
        total_scheduled = plan_output["summary"]["total_tasks_scheduled"]
        load_status = "healthy"
        if total_scheduled > 6:
            load_status = "overloaded"
        elif total_scheduled > 4:
            load_status = "moderate"

        db_plan = DailyPlan(
            user_id=user_id,
            plan_date=date_str,
            available_hours=float(8.0 - buffer_hours),
            planned_hours=float(total_scheduled * 1.0), # Assuming 1hr blocks
            buffer_hours=float(buffer_hours),
            load_status=load_status,
            recommendations=plan_output.get("low_confidence_warnings", []),
            overflow_tasks=plan_output.get("backlog", [])
        )
        self.db.add(db_plan)
        self.db.flush() # get db_plan.id

        # 4. Save TimeSlot records
        for band, items in plan_output.get("schedule", {}).items():
            priority_level = "normal"
            if "Critical" in band:
                priority_level = "critical"
            elif "Important" in band:
                priority_level = "high"

            for item in items:
                slot = TimeSlot(
                    daily_plan_id=db_plan.id,
                    master_task_id=item["task_id"],
                    start_time=item["suggested_start"],
                    end_time=item["suggested_end"],
                    slot_type="task",
                    priority_level=priority_level,
                    title=item["title"]
                )
                self.db.add(slot)
        
        self.db.commit()
        return plan_output
    
    def get_plan(self, date_str: str) -> dict:
        plan = self.db.query(DailyPlan).filter(DailyPlan.plan_date == date_str).first()
        if not plan:
            # If no plan exists, generate one automatically for user-01 to support demo UI
            return self.generate_plan("user-01", date_str)

        slots = self.db.query(TimeSlot).filter(TimeSlot.daily_plan_id == plan.id).all()
        
        # Format the slots back into the structured daily plan format
        schedule = {
            "Critical / Do First": [],
            "Important / Do Today": [],
            "If Time Allows": []
        }

        for s in slots:
            band = "If Time Allows"
            if s.priority_level == "critical":
                band = "Critical / Do First"
            elif s.priority_level == "high":
                band = "Important / Do Today"

            schedule[band].append({
                "task_id": s.master_task_id,
                "title": s.title,
                "suggested_start": s.start_time,
                "suggested_end": s.end_time,
                "flagged_low_confidence": False,
                "priority_score": 0.0, # placeholder
                "rationale": "",
                "confidence_label": ""
            })

        return {
            "plan_date": plan.plan_date,
            "schedule": schedule,
            "backlog": plan.overflow_tasks or [],
            "low_confidence_warnings": plan.recommendations or [],
            "summary": {
                "total_tasks_scheduled": len(slots),
                "total_tasks_in_backlog": len(plan.overflow_tasks or []),
                "critical_count": len(schedule["Critical / Do First"])
            }
        }