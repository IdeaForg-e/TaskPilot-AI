from sqlalchemy import Column, String, Text, JSON, DateTime
from app.database import Base
import uuid
from datetime import datetime

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, default="running")    # running/completed/failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    agents_completed = Column(JSON, default=list)
    current_agent = Column(String)
    error_log = Column(Text)