from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.plan import DailyPlanRequest
from app.services.planning_service import PlanningService

router = APIRouter(prefix="/api/v1", tags=["planning"])

@router.post("/daily-plan", response_model=APIResponse)
async def generate_plan(request: DailyPlanRequest, db: Session = Depends(get_db)):
    service = PlanningService(db)
    result = service.generate_plan(request.user_id, request.date, request.buffer_hours)
    return APIResponse(success=True, data=result, message="Daily plan generated")

@router.get("/daily-plan/{date}", response_model=APIResponse)
async def get_plan(date: str, db: Session = Depends(get_db)):
    service = PlanningService(db)
    result = service.get_plan(date)
    return APIResponse(success=True, data=result, message="OK")