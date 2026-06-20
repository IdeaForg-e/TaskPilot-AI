from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.ingestion import IngestRequest
from app.services.ingestion_service import IngestionService

router = APIRouter(prefix="/api/v1", tags=["ingestion"])

@router.post("/ingest", response_model=APIResponse)
async def ingest_data(request: IngestRequest, db: Session = Depends(get_db)):
    service = IngestionService(db)
    result = service.ingest_all(request.sources)
    return APIResponse(success=True, data=result, message="Ingestion completed")

@router.get("/ingest/status", response_model=APIResponse)
async def ingest_status(db: Session = Depends(get_db)):
    service = IngestionService(db)
    count = service.get_event_count()
    return APIResponse(success=True, data={"total_events": count}, message="OK")