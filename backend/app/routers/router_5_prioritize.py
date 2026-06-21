import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.agent_5_prioritization_service import PrioritizationService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["prioritization"])
logger = logging.getLogger("taskpilot.api")

@router.post("/prioritize", response_model=APIResponse)
async def prioritize_tasks(db: Session = Depends(get_db)):
    try:
        service = PrioritizationService(db)
        result = service.prioritize_all()
        return APIResponse(success=True, data=result, message="Prioritization completed")
    except Exception as exc:
        logger.error(f"Prioritization failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Prioritization failed: {exc}",
        )

@router.get("/tasks/ranked", response_model=APIResponse)
async def get_ranked_tasks(db: Session = Depends(get_db)):
    try:
        service = PrioritizationService(db)
        result = service.get_ranked()
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Ranked tasks fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
