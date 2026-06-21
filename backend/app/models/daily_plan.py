from sqlalchemy import Column, String, Float, Text, JSON, DateTime, Date
from app.database import Base
import uuid
from datetime import datetime

class DailyPlan(Base):
    __tablename__ = "daily_plans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String)
    plan_date = Column(String, nullable=False)
    available_hours = Column(Float)
    planned_hours = Column(Float)
    buffer_hours = Column(Float)
    load_status = Column(String)        # healthy/moderate/overloaded
    recommendations = Column(JSON)
    overflow_tasks = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class TimeSlot(Base):
    __tablename__ = "time_slots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    daily_plan_id = Column(String, nullable=False)
    master_task_id = Column(String)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    slot_type = Column(String)          # task/meeting/buffer/break
    priority_level = Column(String)     # critical/high/normal/buffer
    title = Column(String)