from pydantic import BaseModel
from typing import Optional, List

class PriorityScoreOut(BaseModel):
    id: str
    master_task_id: str
    task_title: Optional[str] = None
    overall_score: float
    rank: Optional[int] = None
    explanation: Optional[str] = None
    priority_reason: Optional[List[str]] = None
    severity_score: Optional[float] = None
    deadline_score: Optional[float] = None
    production_impact_score: Optional[float] = None
    customer_impact_score: Optional[float] = None

class PriorityResponse(BaseModel):
    total_ranked: int
    ranked_tasks: List[PriorityScoreOut]
