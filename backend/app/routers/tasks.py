from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.models.task import MasterTask
from app.models.quality_report import QualityReport
from app.models.priority_score import PriorityScore
from app.models.task import TaskContextLink
from app.models.source_event import SourceEvent

router = APIRouter(prefix="/api/v1", tags=["tasks"])

@router.get("/tasks", response_model=APIResponse)
async def get_tasks(
    status: str = Query(None),
    assignee: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MasterTask)
    if status:
        query = query.filter(MasterTask.status == status)
    if assignee:
        query = query.filter(MasterTask.assignee == assignee)
    tasks = query.all()
    result = [
        {
            "id": t.id, "title": t.title, "description": t.description,
            "task_type": t.task_type, "status": t.status, "assignee": t.assignee,
            "deadline": t.deadline, "urgency": t.urgency, "source_count": t.source_count
        }
        for t in tasks
    ]
    return APIResponse(success=True, data={"total": len(result), "tasks": result}, message="OK")

@router.get("/tasks/{task_id}", response_model=APIResponse)
async def get_task_detail(task_id: str, db: Session = Depends(get_db)):
    task = db.query(MasterTask).filter(MasterTask.id == task_id).first()
    if not task:
        return APIResponse(success=False, message="Task not found")
    
    quality = db.query(QualityReport).filter(QualityReport.master_task_id == task_id).first()
    priority = db.query(PriorityScore).filter(PriorityScore.master_task_id == task_id).first()
    links = db.query(TaskContextLink).filter(TaskContextLink.master_task_id == task_id).all()
    
    context = []
    for link in links:
        event = db.query(SourceEvent).filter(SourceEvent.id == link.source_event_id).first()
        if event:
            context.append({
                "source": event.source, "title": event.title,
                "content": event.content[:200] if event.content else None,
                "link_type": link.link_type
            })
    
    result = {
        "task": {
            "id": task.id, "title": task.title, "description": task.description,
            "task_type": task.task_type, "status": task.status, "assignee": task.assignee,
            "deadline": task.deadline, "urgency": task.urgency, "source_count": task.source_count
        },
        "quality": {
            "overall_score": quality.overall_score,
            "actionability": quality.actionability,
            "missing_info": quality.missing_info,
            "clarification_questions": quality.clarification_questions
        } if quality else None,
        "priority": {
            "overall_score": priority.overall_score,
            "rank": priority.rank,
            "explanation": priority.explanation
        } if priority else None,
        "context_links": context
    }
    return APIResponse(success=True, data=result, message="OK")