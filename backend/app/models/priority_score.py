from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON
from app.database import Base
import uuid
from datetime import datetime

class PriorityScore(Base):
    __tablename__ = "priority_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    severity_score = Column(Float)
    deadline_score = Column(Float)
    production_impact_score = Column(Float)
    customer_impact_score = Column(Float)
    dependency_score = Column(Float)
    blocker_score = Column(Float)
    business_impact_score = Column(Float)
    quality_factor_score = Column(Float)
    rank = Column(Integer)
    explanation = Column(Text)
    priority_reason = Column(JSON)  # list[str], generated dynamically from scoring inputs
    created_at = Column(DateTime, default=datetime.utcnow)
