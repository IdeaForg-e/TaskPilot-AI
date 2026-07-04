import uuid
import logging
from datetime import datetime

from agents.llm_client import LLMClient
from app.models.workflow_run import WorkflowRun
from app.services.agent_2_extraction_service import ExtractionService
from app.services.agent_3_fusion_service import FusionService
from app.services.agent_1_ingestion_service import IngestionService
from app.services.agent_6_planning_service import PlanningService
from app.services.agent_5_prioritization_service import PrioritizationService
from app.services.agent_4_quality_service import QualityService


class OrchestratorService:
    def __init__(self, db):
        self.db = db

    def run_full_pipeline(self, existing_run_id: str = None):
        logger = logging.getLogger("taskpilot.orchestrator")
        LLMClient.pipeline_mode = True
        LLMClient.reset_diagnostics()
        try:
            if existing_run_id:
                run = self.db.query(WorkflowRun).filter(WorkflowRun.id == existing_run_id).first()
                if not run:
                    run = WorkflowRun(id=existing_run_id, status="running", current_agent="ingestion")
                    self.db.add(run)
            else:
                run = WorkflowRun(id=str(uuid.uuid4()), status="running", current_agent="ingestion")
                self.db.add(run)
            self.db.commit()
            logger.info(f"Starting pipeline execution run_id={run.id}")
            results = {}
            completed = []

            steps = [
                ("ingestion", lambda: IngestionService(self.db).ingest_all(["jira", "github", "slack", "email", "calendar", "meetings", "incidents"])),
                ("extraction", lambda: ExtractionService(self.db).extract_all(True, 0.5)),
                ("fusion", lambda: FusionService(self.db).fuse_all()),
                ("quality", lambda: QualityService(self.db).evaluate_all()),
                ("prioritization", lambda: PrioritizationService(self.db).prioritize_all()),
                ("planning", lambda: PlanningService(self.db).generate_plan("user-001", "2026-07-14", 1.0)),
            ]

            for name, fn in steps:
                try:
                    run.current_agent = name
                    self.db.commit()
                    logger.info(f"Executing pipeline stage: {name}")
                    results[name] = fn()
                    completed.append(name)
                    run.agents_completed = completed
                    self.db.commit()
                    logger.info(f"Stage '{name}' completed successfully")
                except Exception as exc:
                    logger.error(f"Stage '{name}' failed: {exc}")
                    run.status = "failed"
                    run.error_log = f"{name} failed: {exc}"
                    run.completed_at = datetime.utcnow()
                    self.db.commit()
                    return {
                        "run_id": run.id,
                        "status": "failed",
                        "failed_agent": name,
                        "error": str(exc),
                        "llm_diagnostics": LLMClient.get_diagnostics(),
                        "completed_agents": completed,
                        "results": results,
                    }

            run.status = "completed"
            run.current_agent = None
            run.completed_at = datetime.utcnow()
            self.db.commit()
            logger.info(f"Pipeline execution completed successfully run_id={run.id}")
            return {
                "run_id": run.id,
                "status": "completed",
                "completed_agents": completed,
                "llm_diagnostics": LLMClient.get_diagnostics(),
                "results": results,
            }
        finally:
            LLMClient.pipeline_mode = False

    def get_status(self, run_id):
        run = self.db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
        if not run:
            return {"message": "Run not found"}
        return {
            "run_id": run.id,
            "status": run.status,
            "started_at": str(run.started_at),
            "completed_at": str(run.completed_at) if run.completed_at else None,
            "current_agent": run.current_agent,
            "agents_completed": run.agents_completed or [],
            "error": run.error_log,
        }

    def get_latest_run(self):
        import os
        from datetime import datetime, timedelta
        from app.models.quality_report import QualityReport
        run = self.db.query(WorkflowRun).order_by(WorkflowRun.started_at.desc()).first()
        total_runs = self.db.query(WorkflowRun).count()
        
        # Calculate system accuracy dynamically based on QualityReport scores
        reports = self.db.query(QualityReport).all()
        if reports:
            system_accuracy = round(sum(r.overall_score for r in reports) / len(reports), 1)
        else:
            system_accuracy = 95.0  # fallback baseline
            
        environment = os.getenv("APP_ENV", "Development")
        
        if not run:
            return {
                "latest_run": None,
                "total_runs": total_runs,
                "system_accuracy": system_accuracy,
                "environment": environment,
                "average_latency": LLMClient.get_average_latency()
            }
        
        # Detect stale "running" pipeline — if it's been running > 5 minutes, it's dead
        status = run.status
        current_agent = run.current_agent
        completed_agents = run.agents_completed or []
        error_log = run.error_log
        
        if status == "running" and run.started_at:
            elapsed = datetime.utcnow() - run.started_at.replace(tzinfo=None)
            if elapsed > timedelta(minutes=5):
                status = "failed"
                current_agent = None
                error_log = "Pipeline was interrupted (server restarted or process killed). Marked as stale."
                # Optionally update the DB so subsequent calls see the fixed state
                run.status = status
                run.current_agent = current_agent
                run.error_log = error_log
                run.completed_at = datetime.utcnow()
                self.db.commit()
        
        return {
            "latest_run": {
                "run_id": run.id,
                "status": status,
                "started_at": str(run.started_at),
                "completed_at": str(run.completed_at) if run.completed_at else None,
                "current_agent": current_agent,
                "agents_completed": completed_agents,
                "error": error_log,
            },
            "total_runs": total_runs,
            "system_accuracy": system_accuracy,
            "environment": environment,
            "average_latency": LLMClient.get_average_latency()
        }
