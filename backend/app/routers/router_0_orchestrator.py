import logging
import uuid

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.schemas.common import APIResponse
from app.services.agent_0_orchestrator_service import OrchestratorService
from app.models.workflow_run import WorkflowRun
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["orchestrator"])
logger = logging.getLogger("taskpilot.api")


def run_pipeline_task(run_id: str):
    db = SessionLocal()
    try:
        service = OrchestratorService(db)
        service.run_full_pipeline(existing_run_id=run_id)
    except Exception as exc:
        logger.error(f"Background pipeline run failed: {exc}")
    finally:
        db.close()


@router.post("/orchestrate/run", response_model=APIResponse)
def run_pipeline(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        from datetime import datetime, timedelta
        
        # Check for active pipeline runs (status == "running")
        # In case a run hangs (e.g. server crash), we implement a 5-minute timeout threshold
        active_run = db.query(WorkflowRun).filter(WorkflowRun.status == "running").first()
        if active_run:
            if datetime.utcnow() - active_run.started_at < timedelta(minutes=5):
                return APIResponse(
                    success=False,
                    data={"error": "Another pipeline run is currently active.", "run_id": active_run.id},
                    message="Pipeline is currently running. Please wait for the current run to complete.",
                )
            else:
                logger.warning(f"Marking stale pipeline run {active_run.id} as failed due to timeout.")
                active_run.status = "failed"
                active_run.completed_at = datetime.utcnow()
                active_run.error_log = "Run timed out / preempted by new execution."
                db.commit()

        run_id = str(uuid.uuid4())
        run = WorkflowRun(id=run_id, status="running", current_agent="ingestion")
        db.add(run)
        db.commit()

        background_tasks.add_task(run_pipeline_task, run_id)

        llm_diagnostics = LLMClient.get_diagnostics()
        result = {
            "run_id": run_id,
            "status": "running",
            "completed_agents": [],
            "llm_diagnostics": llm_diagnostics
        }
        return APIResponse(success=True, data=result, message="Pipeline started in background")
    except Exception as exc:
        logger.error(f"Pipeline run failed: {exc}")
        llm_diagnostics = LLMClient.get_diagnostics()
        return APIResponse(
            success=False,
            data={"error": str(exc), "llm_diagnostics": llm_diagnostics},
            message=f"Pipeline failed: {exc}",
        )

@router.get("/orchestrate/status/{run_id}", response_model=APIResponse)
async def pipeline_status(run_id: str, db: Session = Depends(get_db)):
    try:
        service = OrchestratorService(db)
        result = service.get_status(run_id)
        return APIResponse(success=True, data=result, message="OK")
    except Exception as exc:
        logger.error(f"Pipeline status fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))

@router.get("/orchestrate/latest", response_model=APIResponse)
async def get_latest_pipeline_run(db: Session = Depends(get_db)):
    try:
        service = OrchestratorService(db)
        result = service.get_latest_run()
        llm_diagnostics = LLMClient.get_diagnostics()
        return APIResponse(success=True, data={**result, "llm_diagnostics": llm_diagnostics}, message="OK")
    except Exception as exc:
        logger.error(f"Latest pipeline fetch failed: {exc}")
        return APIResponse(success=False, data={"error": str(exc)}, message=str(exc))
