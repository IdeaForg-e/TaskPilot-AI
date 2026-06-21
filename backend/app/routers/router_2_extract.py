import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.task import ExtractRequest
from app.services.agent_2_extraction_service import ExtractionService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["extraction"])
logger = logging.getLogger("taskpilot.api")

@router.post("/extract", response_model=APIResponse)
async def extract_tasks(request: ExtractRequest, db: Session = Depends(get_db)):
    try:
        service = ExtractionService(db)
        result = service.extract_all(request.include_hidden, request.min_confidence)
        return APIResponse(success=True, data=result, message="Extraction completed")
    except Exception as exc:
        logger.error(f"Extraction failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Task extraction failed: {exc}",
        )

@router.get("/extract/results", response_model=APIResponse)
async def extraction_results(db: Session = Depends(get_db)):
    try:
        service = ExtractionService(db)
        result = service.get_results()
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Extraction results failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
