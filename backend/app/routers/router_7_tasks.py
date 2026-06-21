import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
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
    source: str = Query(None, description="Comma-separated source filter, e.g. source=jira,github"),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(MasterTask)
        if status:
            query = query.filter(MasterTask.status == status)
        if assignee:
            query = query.filter(MasterTask.assignee == assignee)
        tasks = query.all()

        # Single bulk join instead of one query per task (N+1 fix).
        source_map = _bulk_source_platforms(db)
        context_counts = _bulk_context_counts(db)

        requested_sources = None
        if source:
            requested_sources = {s.strip().lower() for s in source.split(",") if s.strip()}

        result = []
        for t in tasks:
            platforms = source_map.get(t.id, [])
            if requested_sources is not None:
                if not requested_sources & {p.lower() for p in platforms}:
                    continue
            result.append({
                "id": t.id, "title": t.title, "description": t.description,
                "task_type": t.task_type, "type": t.task_type, "status": t.status, "assignee": t.assignee,
                "deadline": t.deadline, "urgency": t.urgency, "source_count": t.source_count,
                "estimated_hours": t.estimated_hours,
                "is_hidden": any(p in ("slack", "email", "meeting") for p in platforms),
                "sources": platforms,
                "source_platforms": platforms,
                "context_count": context_counts.get(t.id, 0),
                "agent_summary": _agent_summary(t.source_count, platforms),
            })
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

        platforms = _source_platforms(db, task.id)
        result = {
            "task": {
                "id": task.id, "title": task.title, "description": task.description,
                "task_type": task.task_type, "type": task.task_type, "status": task.status, "assignee": task.assignee,
                "deadline": task.deadline, "urgency": task.urgency, "source_count": task.source_count,
                "estimated_hours": task.estimated_hours,
                "is_hidden": any(p in ("slack", "email", "meeting") for p in platforms),
                "sources": platforms,
                "source_platforms": platforms,
                "context_count": _context_count(db, task.id),
                "agent_summary": _agent_summary(task.source_count, platforms),
            },
            "quality": {
                "overall_score": quality.overall_score,
                "actionability": quality.actionability,
                "missing_info": quality.missing_info,
                "clarification_questions": quality.clarification_questions,
                "clear_title_score": quality.clear_title_score,
                "reproduction_steps_score": quality.reproduction_steps_score,
                "error_logs_score": quality.error_logs_score,
                "environment_score": quality.environment_score,
                "expected_behavior_score": quality.expected_behavior_score,
                "severity_score": quality.severity_score,
                "assignee_score": quality.assignee_score
            } if quality else None,
            "priority": {
                "overall_score": priority.overall_score,
                "rank": priority.rank,
                "explanation": priority.explanation,
                "priority_reason": priority.priority_reason or [],
                "severity_score": priority.severity_score,
                "deadline_score": priority.deadline_score,
                "production_impact_score": priority.production_impact_score,
                "customer_impact_score": priority.customer_impact_score,
                "dependency_score": priority.dependency_score,
                "blocker_score": priority.blocker_score,
                "business_impact_score": priority.business_impact_score,
                "quality_factor_score": priority.quality_factor_score
            } if priority else None,
            "context_links": context
        }
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Task detail fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()}, message=str(exc))


def _bulk_source_platforms(db: Session) -> dict[str, list[str]]:
    rows = (
        db.query(TaskContextLink.master_task_id, SourceEvent.source)
        .join(SourceEvent, SourceEvent.id == TaskContextLink.source_event_id)
        .all()
    )
    mapping: dict[str, list[str]] = {}
    for master_task_id, src in rows:
        bucket = mapping.setdefault(master_task_id, [])
        if src not in bucket:
            bucket.append(src)
    return mapping


def _bulk_context_counts(db: Session) -> dict[str, int]:
    rows = (
        db.query(TaskContextLink.master_task_id, func.count(TaskContextLink.id))
        .group_by(TaskContextLink.master_task_id)
        .all()
    )
    return {tid: count for tid, count in rows}


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


def _agent_summary(source_count: int | None, platforms: list[str]) -> str:
    hidden = any(p in ("slack", "email", "meeting") for p in platforms)
    source_text = ", ".join(platforms) if platforms else "manual"
    if source_count and source_count > 1:
        return f"Fusion agent merged {source_count} related signals from {source_text}."
    if hidden:
        return f"Extraction agent found this as hidden work from {source_text}."
    return f"Extraction agent normalized this explicit task from {source_text}."


@router.post("/tasks/{task_id}/status", response_model=APIResponse)
def update_task_status(task_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        task = db.query(MasterTask).filter(MasterTask.id == task_id).first()
        if not task:
            return APIResponse(success=False, message="Task not found")
        new_status = payload.get("status", "done")
        task.status = new_status
        db.commit()
        logger.info(f"Updated status of task {task_id} to {new_status}")
        return APIResponse(success=True, data={"task_id": task_id, "status": new_status}, message=f"Task status updated to {new_status}")
    except Exception as exc:
        logger.error(f"Task status update failed: {exc}")
        return APIResponse(success=False, message=str(exc))
