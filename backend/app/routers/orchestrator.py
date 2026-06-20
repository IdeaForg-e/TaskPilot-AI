from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.orchestrator_service import OrchestratorService

router = APIRouter(prefix="/api/v1", tags=["orchestrator"])

@router.post("/orchestrate/run", response_model=APIResponse)
async def run_pipeline(db: Session = Depends(get_db)):
    service = OrchestratorService(db)
    result = service.run_full_pipeline()
    return APIResponse(success=True, data=result, message="Pipeline completed")

@router.get("/orchestrate/status/{run_id}", response_model=APIResponse)
async def pipeline_status(run_id: str, db: Session = Depends(get_db)):
    service = OrchestratorService(db)
    result = service.get_status(run_id)
    return APIResponse(success=True, data=result, message="OK")