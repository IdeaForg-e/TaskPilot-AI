import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.ingestion import IngestRequest
from app.services.agent_1_ingestion_service import IngestionService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["ingestion"])
logger = logging.getLogger("taskpilot.api")

@router.post("/ingest", response_model=APIResponse)
async def ingest_data(request: IngestRequest, db: Session = Depends(get_db)):
    try:
        service = IngestionService(db)
        result = service.ingest_all(request.sources)
        return APIResponse(success=True, data=result, message="Ingestion completed")
    except Exception as exc:
        logger.error(f"Ingestion failed: {exc}")
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": LLMClient.get_diagnostics()},
            message=f"Data ingestion failed: {exc}",
        )

@router.get("/ingest/status", response_model=APIResponse)
async def ingest_status(db: Session = Depends(get_db)):
    try:
        service = IngestionService(db)
        count = service.get_event_count()
        return APIResponse(success=True, data={"total_events": count}, message="OK")
    except Exception as exc:
        logger.error(f"Ingest status failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
