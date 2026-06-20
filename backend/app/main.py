import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

from app.routers import (
    router_0_orchestrator as orchestrator,
    router_1_ingest as ingest,
    router_2_extract as extract,
    router_3_fuse as fuse,
    router_4_quality as quality,
    router_5_prioritize as prioritize,
    router_6_planner as planner,
    router_7_tasks as tasks,
    router_8_chat as chat
)

app = FastAPI(
    title="TaskPilot AI",
    description="Autonomous Multi-Agent Engineering Workflow Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger = logging.getLogger("taskpilot.api")
    logger.error(f"Unhandled API error on {request.method} {request.url.path}: {exc}")
    
    # Try to capture LLM diagnostics for the response
    try:
        from agents.llm_client import LLMClient
        llm_diagnostics = LLMClient.get_diagnostics()
    except Exception:
        llm_diagnostics = []
    
    message = str(exc) or "An unexpected backend error occurred."
    
    # Provide user-friendly hints for common issues
    if "api key" in message.lower() or "api_key" in message.lower() or "unauthorized" in message.lower() or "401" in message:
        hint = "LLM API key may be missing or invalid. Check GROQ_API_KEY / NVIDIA_API_KEY in backend/.env"
    elif "timeout" in message.lower() or "timed out" in message.lower():
        hint = "Backend request timed out. The LLM service may be unreachable."
    elif "connection" in message.lower() or "econnrefused" in message.lower():
        hint = "Cannot connect to LLM provider. Check your network connection."
    elif "database" in message.lower() or "sqlite" in message.lower() or "db" in message.lower():
        hint = "Database error occurred. The database may be locked or corrupted."
    else:
        hint = "Backend error occurred. Check API keys, database connectivity, and server logs."
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": hint,
            "data": {
                "error": message[:500],
                "llm_diagnostics": llm_diagnostics,
            },
        },
    )

# Include routers
app.include_router(ingest.router)
app.include_router(extract.router)
app.include_router(fuse.router)
app.include_router(quality.router)
app.include_router(prioritize.router)
app.include_router(planner.router)
app.include_router(orchestrator.router)
app.include_router(tasks.router)
app.include_router(chat.router)

@app.on_event("startup")
async def startup():
    from app.logging_config import setup_logging
    setup_logging()
    init_db()
    
    # Clear all database tables on server startup to start in a completely clean initial state (0 tasks, 0 runs)
    try:
        from app.database import SessionLocal
        from app.models.daily_plan import DailyPlan, TimeSlot
        from app.models.priority_score import PriorityScore
        from app.models.quality_report import QualityReport
        from app.models.source_event import SourceEvent
        from app.models.task import MasterTask, TaskCandidate, TaskContextLink
        from app.models.workflow_run import WorkflowRun
        
        db = SessionLocal()
        db.query(TimeSlot).delete()
        db.query(DailyPlan).delete()
        db.query(PriorityScore).delete()
        db.query(QualityReport).delete()
        db.query(TaskContextLink).delete()
        db.query(MasterTask).delete()
        db.query(TaskCandidate).delete()
        db.query(SourceEvent).delete()
        db.query(WorkflowRun).delete()
        
        db.commit()
        db.close()
        logging.getLogger("taskpilot.api").info("Successfully cleared all database tables on server startup for a clean initial state.")
    except Exception as exc:
        logging.getLogger("taskpilot.api").error(f"Failed to clear database tables on startup: {exc}")

@app.get("/")
async def root():
    return {"message": "TaskPilot AI API", "version": "1.0.0"}

@app.get("/health")
async def health():
    from agents.llm_client import LLMClient
    from app.config import settings
    
    # Check which API keys are configured
    config_status = {
        "groq_configured": bool(settings.GROQ_API_KEY),
        "nvidia_configured": bool(settings.NVIDIA_API_KEY),
        "llm_providers_available": bool(settings.GROQ_API_KEY or settings.NVIDIA_API_KEY),
    }
    
    llm_diagnostics = LLMClient.get_diagnostics()
    
    return {
        "status": "healthy",
        "config": config_status,
        "llm_diagnostics": llm_diagnostics,
    }
