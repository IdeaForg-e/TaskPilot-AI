from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.quality_service import QualityService

router = APIRouter(prefix="/api/v1", tags=["quality"])

@router.post("/quality/evaluate", response_model=APIResponse)
async def evaluate_quality(db: Session = Depends(get_db)):
    service = QualityService(db)
    result = service.evaluate_all()
    return APIResponse(success=True, data=result, message="Quality evaluation completed")

@router.get("/quality/reports", response_model=APIResponse)
async def get_quality_reports(db: Session = Depends(get_db)):
    service = QualityService(db)
    result = service.get_reports()
    return APIResponse(success=True, data=result, message="OK")