from sqlalchemy import Column, String, Float, Text, JSON, DateTime
from app.database import Base
import uuid
from datetime import datetime

class QualityReport(Base):
    __tablename__ = "quality_reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    clear_title_score = Column(Float)
    reproduction_steps_score = Column(Float)
    error_logs_score = Column(Float)
    environment_score = Column(Float)
    expected_behavior_score = Column(Float)
    severity_score = Column(Float)
    assignee_score = Column(Float)
    missing_info = Column(JSON)
    clarification_questions = Column(JSON)
    actionability = Column(String)       # actionable/needs_info/blocked
    created_at = Column(DateTime, default=datetime.utcnow)