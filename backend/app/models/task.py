from sqlalchemy import Column, String, Text, DateTime, Float, Boolean, Integer, JSON
from app.database import Base
import uuid
from datetime import datetime

class TaskCandidate(Base):
    __tablename__ = "task_candidates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    source_event_id = Column(String)
    task_type = Column(String)          # bug/feature/review/incident/meeting_action/request
    is_hidden = Column(Boolean, default=False)
    assignee = Column(String)
    deadline = Column(String)
    urgency = Column(String)            # low/medium/high/critical
    confidence = Column(Float)
    extraction_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class MasterTask(Base):
    __tablename__ = "master_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    task_type = Column(String)
    status = Column(String, default="open")
    assignee = Column(String)
    deadline = Column(String)
    urgency = Column(String)
    source_count = Column(Integer, default=1)
    is_duplicate_of = Column(String)
    fusion_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class TaskContextLink(Base):
    __tablename__ = "task_context_links"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    source_event_id = Column(String, nullable=False)
    link_type = Column(String)          # origin/related/duplicate
    similarity_score = Column(Float)