
from fastapi import APIRouter
from app.services.ingestion_service import ingest_task
from app.services.extraction_service import extract_task
from app.services.fusion_service import fuse_task

router = APIRouter()


@router.post("/ingest")
def ingest(data: dict):

    cleaned_data = ingest_task(data)

    if "error" in cleaned_data:
        return cleaned_data

    extracted = extract_task(cleaned_data["task"])

    fused = fuse_task(extracted)

    return {
        "status": "success",
        "cleaned_data": cleaned_data,
        "extracted": extracted,
        "fused": fused
    }