from pydantic import BaseModel
from typing import Optional, List

class QualityReportOut(BaseModel):
    id: str
    master_task_id: str
    task_title: Optional[str] = None
    overall_score: float
    clear_title_score: Optional[float] = None
    reproduction_steps_score: Optional[float] = None
    error_logs_score: Optional[float] = None
    environment_score: Optional[float] = None
    expected_behavior_score: Optional[float] = None
    severity_score: Optional[float] = None
    assignee_score: Optional[float] = None
    missing_info: Optional[List[str]] = None
    clarification_questions: Optional[List[str]] = None
    actionability: Optional[str] = None

class QualityResponse(BaseModel):
    total_evaluated: int
    actionable: int
    needs_info: int
    avg_score: float
    reports: List[QualityReportOut]