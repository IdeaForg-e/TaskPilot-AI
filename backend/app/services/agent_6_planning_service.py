import json
import os
import uuid
from datetime import datetime

from agents.agent_6_planning_agent import PlanningAgent
from app.config import settings
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.priority_score import PriorityScore
from app.models.task import MasterTask


class PlanningService:
    def __init__(self, db):
        self.db = db
        self.agent = PlanningAgent()

    def generate_plan(self, user_id, date, buffer_hours=1.0):
        old_plan_ids = [
            plan.id
            for plan in self.db.query(DailyPlan)
            .filter(DailyPlan.user_id == user_id, DailyPlan.plan_date == date)
            .all()
        ]
        if old_plan_ids:
            self.db.query(TimeSlot).filter(TimeSlot.daily_plan_id.in_(old_plan_ids)).delete(synchronize_session=False)
            self.db.query(DailyPlan).filter(DailyPlan.id.in_(old_plan_ids)).delete(synchronize_session=False)
        meetings = self._meetings_for(date, user_id)
        available = max(0, 8.0 - self._meeting_hours(meetings) - buffer_hours)
        ranked = self._ranked_tasks()
        result = self.agent.generate_plan(date, available, meetings, ranked, buffer_hours)

        plan = DailyPlan(
            id=str(uuid.uuid4()),
            user_id=user_id,
            plan_date=date,
            available_hours=result.get("available_hours", available),
            planned_hours=result.get("planned_hours", 0),
            buffer_hours=buffer_hours,
            load_status=result.get("load_status", "healthy"),
            recommendations=result.get("recommendations", []),
            overflow_tasks=result.get("overflow_tasks", []),
        )
        self.db.add(plan)
        self.db.flush()

        for slot in result.get("time_slots", []):
            self.db.add(
                TimeSlot(
                    id=str(uuid.uuid4()),
                    daily_plan_id=plan.id,
                    master_task_id=slot.get("task_id"),
                    start_time=slot.get("start_time", ""),
                    end_time=slot.get("end_time", ""),
                    slot_type=slot.get("slot_type", "task"),
                    priority_level=slot.get("priority_level", "normal"),
                    title=slot.get("title", ""),
                )
            )

        self.db.commit()
        return self._plan_out(plan)

    def get_plan(self, date):
        plan = self.db.query(DailyPlan).filter(DailyPlan.plan_date == date).first()
        if not plan:
            plan = self.db.query(DailyPlan).order_by(DailyPlan.plan_date.desc()).first()
        if not plan:
            return {"message": "No plan found for this date", "time_slots": []}
        return self._plan_out(plan)

    def _meetings_for(self, date, user_id):
        path = os.path.join(settings.DATA_DIR, "calendar.json")
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as handle:
            events = json.load(handle)
        return [
            {
                "title": event["title"],
                "start_time": event["start_time"],
                "end_time": event["end_time"],
            }
            for event in events
            if event.get("date") == date and user_id in event.get("attendees", [])
        ]

    def _meeting_hours(self, meetings):
        total = 0
        for meeting in meetings:
            start = datetime.strptime(meeting["start_time"], "%H:%M")
            end = datetime.strptime(meeting["end_time"], "%H:%M")
            total += (end - start).seconds / 3600
        return total

    def _ranked_tasks(self):
        tasks = {task.id: task for task in self.db.query(MasterTask).all()}
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        return [
            {
                "task_id": score.master_task_id,
                "title": tasks[score.master_task_id].title,
                "score": score.overall_score,
                "rank": score.rank,
            }
            for score in scores
            if score.master_task_id in tasks
        ]

    def _plan_out(self, plan):
        slots = self.db.query(TimeSlot).filter(TimeSlot.daily_plan_id == plan.id).all()
        ranked_tasks = self._ranked_tasks()
        time_slots = [
            {
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "slot_type": slot.slot_type,
                "priority_level": slot.priority_level,
                "title": slot.title,
                "task_id": slot.master_task_id,
                "agent_reason": self._slot_reason(slot, ranked_tasks),
            }
            for slot in slots
        ]
        scheduled_ids = {slot["task_id"] for slot in time_slots if slot.get("task_id")}
        top_tasks = [
            {
                "id": task["task_id"],
                "title": task["title"],
                "priority_score": task["score"],
                "rank": task["rank"],
            }
            for task in ranked_tasks[:3]
        ]
        remaining_tasks = [
            {
                "id": task["task_id"],
                "title": task["title"],
                "priority_score": task["score"],
                "rank": task["rank"],
            }
            for task in ranked_tasks
            if task["task_id"] not in scheduled_ids
        ][:12]
        return {
            "id": plan.id,
            "plan_date": plan.plan_date,
            "available_hours": plan.available_hours,
            "planned_hours": plan.planned_hours,
            "buffer_hours": plan.buffer_hours,
            "load_status": plan.load_status,
            "time_slots": time_slots,
            "time_blocks": time_slots,
            "schedule": time_slots,
            "top_priority_tasks": top_tasks,
            "remaining_tasks": remaining_tasks,
            "recommendations": plan.recommendations or [],
            "overflow_tasks": plan.overflow_tasks or [],
        }

    def _slot_reason(self, slot, ranked_tasks):
        if slot.slot_type == "meeting":
            return "Calendar signal: fixed meeting, so the planner protects this time from task work."
        if slot.slot_type == "buffer":
            return "Capacity signal: reserved buffer for interrupts, incidents, and follow-ups."

        ranked = next((task for task in ranked_tasks if task["task_id"] == slot.master_task_id), None)
        if ranked:
            return (
                f"Priority signal: rank #{ranked['rank']} with score {ranked['score']}; "
                "scheduled into the earliest available focus block without meeting overlap."
            )
        return "Planner signal: scheduled into an available focus block after fixed calendar commitments."
