import json
import os
import uuid
from datetime import datetime, timedelta

from agents.agent_6_planning_agent import PlanningAgent
from app.config import settings
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.priority_score import PriorityScore
from app.models.task import MasterTask

WORKING_HOURS_PER_DAY = 8.0


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
            return {"message": f"No plan found for date {date}", "time_slots": [], "plan_date": date, "not_found": True}
        return self._plan_out(plan)

    # ------------------------------------------------------------------ #
    # Module 2 — Calendar API
    # ------------------------------------------------------------------ #
    def get_calendar(self) -> dict:
        """Group all tasks with a deadline by date (YYYY-MM-DD) -> [task summary]."""
        tasks = self.db.query(MasterTask).filter(MasterTask.deadline.isnot(None)).all()
        priorities = self._priority_map()

        calendar: dict[str, list] = {}
        for task in tasks:
            date_key = self._normalize_date(task.deadline)
            if not date_key:
                continue
            calendar.setdefault(date_key, []).append({
                "id": task.id,
                "title": task.title,
                "priority": priorities.get(task.id),
                "deadline": task.deadline,
                "status": task.status,
            })

        for date_key in calendar:
            calendar[date_key].sort(key=lambda t: t["priority"] or 0, reverse=True)
        return calendar

    # ------------------------------------------------------------------ #
    # Module 2 — Day Details API
    # ------------------------------------------------------------------ #
    def get_day_details(self, date: str) -> list:
        """Tasks due on a specific date, sorted by priority descending."""
        tasks = self.db.query(MasterTask).all()
        priorities = self._priority_map()

        day_tasks = [
            {"title": t.title, "priority": priorities.get(t.id, 0.0)}
            for t in tasks
            if self._normalize_date(t.deadline) == date
        ]
        day_tasks.sort(key=lambda t: t["priority"] or 0, reverse=True)
        return day_tasks

    # ------------------------------------------------------------------ #
    # Module 2 — Scheduling Logic
    # ------------------------------------------------------------------ #
    def schedule_unplanned_tasks(self, start_date: str, working_hours_per_day: float = WORKING_HOURS_PER_DAY) -> dict:
        """
        Greedy day-by-day scheduler. Distributes each task's estimated_hours
        across days between start_date and its deadline, respecting daily
        capacity and load already allocated to earlier tasks in this run.
        Higher-priority tasks and tighter deadlines are scheduled first.

        Returns: {date: [{task_id, title, hours, overflow?}]}

        Extension points: per-day capacity overrides, weekend/holiday
        exclusion, per-assignee calendars — all can be added without
        changing the call signature.
        """
        tasks = (
            self.db.query(MasterTask)
            .filter(MasterTask.status != "done")
            .all()
        )
        priorities = self._priority_map()

        def sort_key(task):
            deadline = self._normalize_date(task.deadline) or "9999-12-31"
            priority = priorities.get(task.id, 0.0)
            return (deadline, -priority)

        tasks.sort(key=sort_key)

        schedule: dict[str, list] = {}
        day_load: dict[str, float] = {}
        today = datetime.utcnow().strftime("%Y-%m-%d")
        run_start = max(start_date, today)

        for task in tasks:
            hours_remaining = task.estimated_hours or 1.0
            deadline = self._normalize_date(task.deadline) or run_start
            cursor_date = datetime.strptime(run_start, "%Y-%m-%d")
            deadline_date = datetime.strptime(deadline, "%Y-%m-%d")
            if deadline_date < cursor_date:
                deadline_date = cursor_date  # overdue tasks get scheduled today, flagged via overflow if no room

            while hours_remaining > 0 and cursor_date <= deadline_date:
                day_key = cursor_date.strftime("%Y-%m-%d")
                used = day_load.get(day_key, 0.0)
                available = working_hours_per_day - used
                if available > 0:
                    allocated = round(min(available, hours_remaining), 2)
                    schedule.setdefault(day_key, []).append({
                        "task_id": task.id,
                        "title": task.title,
                        "hours": allocated,
                    })
                    day_load[day_key] = used + allocated
                    hours_remaining = round(hours_remaining - allocated, 2)
                cursor_date += timedelta(days=1)

            if hours_remaining > 0:
                schedule.setdefault(deadline, []).append({
                    "task_id": task.id,
                    "title": task.title,
                    "hours": hours_remaining,
                    "overflow": True,
                })

        return schedule

    # ------------------------------------------------------------------ #
    # Shared helpers
    # ------------------------------------------------------------------ #
    def _priority_map(self) -> dict[str, float]:
        return {
            p.master_task_id: p.overall_score
            for p in self.db.query(PriorityScore).all()
        }

    def _normalize_date(self, value) -> str | None:
        if not value:
            return None
        return value[:10]  # handles both "YYYY-MM-DD" and full ISO datetime strings

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
