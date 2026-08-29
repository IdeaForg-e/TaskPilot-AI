from pydantic import BaseModel
from typing import Optional, List

class IngestRequest(BaseModel):
    sources: List[str] = ["github", "slack", "email", "calendar", "meetings"]

class IngestResponse(BaseModel):
    total_events: int
    per_source: dict
    new_events: int