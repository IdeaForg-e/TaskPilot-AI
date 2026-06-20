import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.agent_3_fusion_service import FusionService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["fusion"])
logger = logging.getLogger("taskpilot.api")

@router.post("/fuse", response_model=APIResponse)
async def fuse_tasks(db: Session = Depends(get_db)):
    try:
        service = FusionService(db)
        result = service.fuse_all()
        return APIResponse(success=True, data=result, message="Fusion completed")
    except Exception as exc:
        logger.error(f"Fusion failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Task fusion failed: {exc}",
        )
