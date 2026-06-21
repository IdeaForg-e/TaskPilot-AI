from pydantic import BaseModel
from typing import Optional, List, Dict

class TimeSlotOut(BaseModel):
    start_time: str
    end_time: str
    slot_type: str
    priority_level: Optional[str] = None
    title: str
    task_id: Optional[str] = None

class DailyPlanRequest(BaseModel):
    user_id: str = "user-001"
    date: str = "2026-06-18"
    buffer_hours: float = 1.0

class DailyPlanOut(BaseModel):
    id: str
    plan_date: str
    available_hours: float
    planned_hours: float
    buffer_hours: float
    load_status: str
    time_slots: List[TimeSlotOut]
    recommendations: Optional[List[str]] = None
    overflow_tasks: Optional[List[dict]] = None

class PlanResponse(BaseModel):
    plan: DailyPlanOut

class CalendarTaskOut(BaseModel):
    id: str
    title: str
    priority: Optional[float] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class CalendarResponse(BaseModel):
    calendar: Dict[str, List[CalendarTaskOut]]

class DayTaskOut(BaseModel):
    title: str
    priority: Optional[float] = None

class ScheduledBlockOut(BaseModel):
    task_id: str
    title: str
    hours: float
    overflow: Optional[bool] = False

class ScheduleResponse(BaseModel):
    schedule: Dict[str, List[ScheduledBlockOut]]
