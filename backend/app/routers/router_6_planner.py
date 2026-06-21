import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.plan import DailyPlanRequest
from app.services.agent_6_planning_service import PlanningService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["planning"])
logger = logging.getLogger("taskpilot.api")

@router.post("/daily-plan", response_model=APIResponse)
async def generate_plan(request: DailyPlanRequest, db: Session = Depends(get_db)):
    try:
        service = PlanningService(db)
        result = service.generate_plan(request.user_id, request.date, request.buffer_hours)
        return APIResponse(success=True, data=result, message="Daily plan generated")
    except Exception as exc:
        logger.error(f"Plan generation failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Daily plan generation failed: {exc}",
        )

from app.models.daily_plan import DailyPlan

@router.get("/daily-plan/{date}", response_model=APIResponse)
async def get_plan(date: str, db: Session = Depends(get_db)):
    try:
        service = PlanningService(db)
        result = service.get_plan(date)
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Plan fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))

@router.get("/daily-plans", response_model=APIResponse)
async def list_plans(db: Session = Depends(get_db)):
    try:
        plans = db.query(DailyPlan).all()
        dates = [p.plan_date for p in plans]
        return APIResponse(success=True, data=dates, message="OK")
    except Exception as exc:
        logger.error(f"Plans list failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))


@router.get("/planner/calendar", response_model=APIResponse)
async def get_calendar(db: Session = Depends(get_db)):
    try:
        service = PlanningService(db)
        result = service.get_calendar()
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Calendar fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))


@router.get("/planner/day/{date}", response_model=APIResponse)
async def get_day(date: str, db: Session = Depends(get_db)):
    try:
        service = PlanningService(db)
        result = service.get_day_details(date)
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Day detail fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))


@router.post("/planner/schedule", response_model=APIResponse)
async def schedule_tasks(
    start_date: str = Query(..., description="YYYY-MM-DD, scheduling window start"),
    db: Session = Depends(get_db),
):
    try:
        service = PlanningService(db)
        result = service.schedule_unplanned_tasks(start_date)
        return APIResponse(success=True, data=result, message="Schedule generated")
    except Exception as exc:
        logger.error(f"Scheduling failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
