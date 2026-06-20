from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database import Base
import uuid
from datetime import datetime

class SourceEvent(Base):
    __tablename__ = "source_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)        # jira/github/slack/email/calendar/meeting/incident
    source_id = Column(String)                     # original ID in source system
    event_type = Column(String, nullable=False)     # ticket/pr/issue/message/email/event/note/incident
    title = Column(String)
    content = Column(Text)
    author = Column(String)
    timestamp = Column(DateTime)
    metadata_json = Column(JSON)
    ingestion_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)