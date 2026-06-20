from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.task import ExtractRequest
from app.services.extraction_service import ExtractionService

router = APIRouter(prefix="/api/v1", tags=["extraction"])

@router.post("/extract", response_model=APIResponse)
async def extract_tasks(request: ExtractRequest, db: Session = Depends(get_db)):
    service = ExtractionService(db)
    result = service.extract_all(request.include_hidden, request.min_confidence)
    return APIResponse(success=True, data=result, message="Extraction completed")

@router.get("/extract/results", response_model=APIResponse)
async def extraction_results(db: Session = Depends(get_db)):
    service = ExtractionService(db)
    result = service.get_results()
    return APIResponse(success=True, data=result, message="OK")