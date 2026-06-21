from pydantic import BaseModel
from typing import Optional, List

class TaskCandidateOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = None
    is_hidden: bool = False
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    urgency: Optional[str] = None
    confidence: Optional[float] = None
    source_event_id: Optional[str] = None

class MasterTaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = None
    status: str = "open"
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    urgency: Optional[str] = None
    source_count: int = 1

class ExtractRequest(BaseModel):
    include_hidden: bool = True
    min_confidence: float = 0.5

class ExtractResponse(BaseModel):
    total_tasks: int
    explicit_tasks: int
    hidden_tasks: int
    tasks: List[TaskCandidateOut]

class FuseResponse(BaseModel):
    input_candidates: int
    master_tasks: int
    duplicates_merged: int