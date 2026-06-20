from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.prioritization_service import PrioritizationService

router = APIRouter(prefix="/api/v1", tags=["prioritization"])

@router.post("/prioritize", response_model=APIResponse)
async def prioritize_tasks(db: Session = Depends(get_db)):
    service = PrioritizationService(db)
    result = service.prioritize_all()
    return APIResponse(success=True, data=result, message="Prioritization completed")

@router.get("/tasks/ranked", response_model=APIResponse)
async def get_ranked_tasks(db: Session = Depends(get_db)):
    service = PrioritizationService(db)
    result = service.get_ranked()
    return APIResponse(success=True, data=result, message="OK")