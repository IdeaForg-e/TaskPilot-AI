from datetime import datetime, timedelta
import logging
 
from agents.llm_client import LLMClient
from agents.prompts.agent_6_planning_prompts import PLANNING_PROMPT
 
logger = logging.getLogger("taskpilot.planning_agent")
 
 
class PlanningAgent:
    def __init__(self):
        self.reasoning_llm = LLMClient(reasoning=True)
 
    def generate_plan(self, date, available_hours, meetings, ranked_tasks, buffer_hours=1.0) -> dict:
        import json
        logger.info(f"PlanningAgent: Generating fallback deterministic plan first for date={date}")
        fallback = self._fallback(date, available_hours, meetings, ranked_tasks, buffer_hours)
        prompt = PLANNING_PROMPT.format(
            date=date,
            available_hours=available_hours,
            meetings=json.dumps(meetings, indent=2, ensure_ascii=False),
            ranked_tasks=json.dumps(ranked_tasks[:12], indent=2, ensure_ascii=False),
        )
        logger.info("PlanningAgent: Invoking LLM service for optimal schedule blocks...")
        result = self.reasoning_llm.complete_json(prompt, fallback=fallback, temperature=0.2)
        if result == fallback:
            logger.warning("PlanningAgent: LLM call failed or timed out. Deterministic fallback plan will be returned.")
        else:
            logger.info("PlanningAgent: Successfully generated plan from LLM.")
        return result if isinstance(result, dict) else fallback
 
    def _fallback(self, date, available_hours, meetings, ranked_tasks, buffer_hours) -> dict:
        slots = []
        for meeting in meetings:
            slots.append(
                {
                    "start_time": meeting["start_time"],
                    "end_time": meeting["end_time"],
                    "slot_type": "meeting",
                    "priority_level": "neutral",
                    "title": meeting["title"],
                    "task_id": None,
                    "agent_reason": "Fixed calendar commitment; protected from task scheduling overlap.",
                }
            )
 
        busy = [(m["start_time"], m["end_time"]) for m in meetings]
        cursor = datetime.strptime("09:00", "%H:%M")
        day_end = datetime.strptime("18:00", "%H:%M")
        planned = 0.0
        overflow = []
        rest_breaks_count = 0
 
        for task in ranked_tasks:
            duration = 1.0 if task.get("score", 0) >= 8 else 0.75
            slot = self._find_free_slot(cursor, day_end, duration, busy)
            if slot is None or planned + duration > available_hours:
                overflow.append(
                    {
                        "task_id": task.get("task_id"),
                        "title": task.get("title"),
                        "reason": "Not enough focus time today",
                    }
                )
                continue
            start, end = slot
            slots.append(
                {
                    "start_time": start.strftime("%H:%M"),
                    "end_time": end.strftime("%H:%M"),
                    "slot_type": "task",
                    "priority_level": "critical" if task.get("score", 0) >= 8 else "normal",
                    "title": task.get("title"),
                    "task_id": task.get("task_id"),
                    "agent_reason": (
                        "Scheduled from the priority leaderboard into the earliest available focus block."
                    ),
                }
            )
            planned += duration
            
            if rest_breaks_count < 2:
                break_duration = timedelta(minutes=15)
                break_end = end + break_duration
                if break_end <= day_end and not self._overlaps_busy(end, break_end, busy):
                    slots.append(
                        {
                            "start_time": end.strftime("%H:%M"),
                            "end_time": break_end.strftime("%H:%M"),
                            "slot_type": "buffer",
                            "priority_level": "neutral",
                            "title": "Rest Break / Buffer",
                            "task_id": None,
                            "agent_reason": "Automated rest break to avoid fatigue and maintain high cognitive performance.",
                        }
                    )
                    busy.append((end.strftime("%H:%M"), break_end.strftime("%H:%M")))
                    cursor = break_end
                    rest_breaks_count += 1
                else:
                    cursor = end
            else:
                cursor = end
 
        slots.sort(key=lambda s: s["start_time"])
        load_status = "healthy"
        if overflow:
            load_status = "overloaded"
        elif planned > available_hours * 0.75:
            load_status = "moderate"
        return {
            "available_hours": available_hours,
            "planned_hours": round(planned, 1),
            "buffer_hours": buffer_hours,
            "load_status": load_status,
            "time_slots": slots,
            "recommendations": self._build_recommendations(slots, overflow),
            "overflow_tasks": overflow,
        }
 
    def _build_recommendations(self, slots, overflow):
        critical = [s for s in slots if s["slot_type"] == "task" and s["priority_level"] == "critical"]
        recs = []
        if critical:
            recs.append(
                f"Lead with '{critical[0]['title']}' — top-ranked critical work, protect this block first."
            )
        else:
            recs.append("No critical-priority work queued today; use the time to clear routine backlog.")
        if overflow:
            names = ", ".join(t["title"] for t in overflow[:2] if t.get("title"))
            recs.append(
                f"{len(overflow)} task(s) overflowed ({names}); escalate or free up capacity tomorrow."
            )
        else:
            recs.append("Full backlog fits today; keep buffer reserved for incident follow-ups.")
        return recs
 
    def _find_free_slot(self, cursor, day_end, duration_hours, busy):
        duration = timedelta(hours=duration_hours)
        step = timedelta(minutes=15)
        candidate = cursor
        while candidate + duration <= day_end:
            end = candidate + duration
            if not self._overlaps_busy(candidate, end, busy):
                return candidate, end
            candidate += step
        return None
 
    def _overlaps_busy(self, start_dt, end_dt, busy):
        for start, end in busy:
            busy_start = datetime.strptime(start, "%H:%M")
            busy_end = datetime.strptime(end, "%H:%M")
            if start_dt < busy_end and end_dt > busy_start:
                return True
        return False
