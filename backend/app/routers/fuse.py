from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.fusion_service import FusionService

router = APIRouter(prefix="/api/v1", tags=["fusion"])

@router.post("/fuse", response_model=APIResponse)
async def fuse_tasks(db: Session = Depends(get_db)):
    service = FusionService(db)
    result = service.fuse_all()
    return APIResponse(success=True, data=result, message="Fusion completed")