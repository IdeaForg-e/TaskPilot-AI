import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.models.task import MasterTask
from app.models.quality_report import QualityReport
from app.models.priority_score import PriorityScore
from app.models.task import TaskContextLink
from app.models.source_event import SourceEvent
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["tasks"])
logger = logging.getLogger("taskpilot.api")

@router.get("/tasks", response_model=APIResponse)
async def get_tasks(
    status: str = Query(None),
    assignee: str = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(MasterTask)
        if status:
            query = query.filter(MasterTask.status == status)
        if assignee:
            query = query.filter(MasterTask.assignee == assignee)
        tasks = query.all()
        result = [
            {
                "id": t.id, "title": t.title, "description": t.description,
                "task_type": t.task_type, "type": t.task_type, "status": t.status, "assignee": t.assignee,
                "deadline": t.deadline, "urgency": t.urgency, "source_count": t.source_count,
                "is_hidden": _has_hidden_context(db, t.id),
                "source_platforms": _source_platforms(db, t.id),
                "context_count": _context_count(db, t.id),
                "agent_summary": _agent_summary(db, t.id, t.source_count),
            }
            for t in tasks
        ]
        return APIResponse(success=True, data={"total": len(result), "tasks": result}, message="OK")
    except Exception as exc:
        logger.error(f"Tasks fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()}, message=str(exc))

@router.get("/tasks/{task_id}", response_model=APIResponse)
async def get_task_detail(task_id: str, db: Session = Depends(get_db)):
    try:
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
                "task_type": task.task_type, "type": task.task_type, "status": task.status, "assignee": task.assignee,
                "deadline": task.deadline, "urgency": task.urgency, "source_count": task.source_count,
                "is_hidden": _has_hidden_context(db, task.id),
                "source_platforms": _source_platforms(db, task.id),
                "context_count": _context_count(db, task.id),
                "agent_summary": _agent_summary(db, task.id, task.source_count),
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
    except Exception as exc:
        logger.error(f"Task detail fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()}, message=str(exc))


def _has_hidden_context(db: Session, task_id: str) -> bool:
    links = db.query(TaskContextLink).filter(TaskContextLink.master_task_id == task_id).all()
    for link in links:
        event = db.query(SourceEvent).filter(SourceEvent.id == link.source_event_id).first()
        if event and event.source in ("slack", "email", "meeting"):
            return True
    return False


def _source_platforms(db: Session, task_id: str) -> list[str]:
    links = db.query(TaskContextLink).filter(TaskContextLink.master_task_id == task_id).all()
    platforms = []
    for link in links:
        event = db.query(SourceEvent).filter(SourceEvent.id == link.source_event_id).first()
        if event and event.source not in platforms:
            platforms.append(event.source)
    return platforms


def _context_count(db: Session, task_id: str) -> int:
    return db.query(TaskContextLink).filter(TaskContextLink.master_task_id == task_id).count()


def _agent_summary(db: Session, task_id: str, source_count: int | None) -> str:
    platforms = _source_platforms(db, task_id)
    hidden = any(source in ("slack", "email", "meeting") for source in platforms)
    source_text = ", ".join(platforms) if platforms else "manual"
    if source_count and source_count > 1:
        return f"Fusion agent merged {source_count} related signals from {source_text}."
    if hidden:
        return f"Extraction agent found this as hidden work from {source_text}."
    return f"Extraction agent normalized this explicit task from {source_text}."
