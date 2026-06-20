import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.agent_4_quality_service import QualityService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["quality"])
logger = logging.getLogger("taskpilot.api")

@router.post("/quality/evaluate", response_model=APIResponse)
async def evaluate_quality(db: Session = Depends(get_db)):
    try:
        service = QualityService(db)
        result = service.evaluate_all()
        return APIResponse(success=True, data=result, message="Quality evaluation completed")
    except Exception as exc:
        logger.error(f"Quality evaluation failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Quality evaluation failed: {exc}",
        )

@router.get("/quality/reports", response_model=APIResponse)
async def get_quality_reports(db: Session = Depends(get_db)):
    try:
        service = QualityService(db)
        result = service.get_reports()
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Quality reports fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
