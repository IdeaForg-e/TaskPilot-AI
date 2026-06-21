from pydantic import BaseModel
from typing import Optional, List

class IngestRequest(BaseModel):
    sources: List[str] = ["jira", "github", "slack", "email", "calendar", "meetings", "incidents"]

class IngestResponse(BaseModel):
    total_events: int
    per_source: dict
    new_events: int