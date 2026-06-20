from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import ingest, extract, fuse, quality, prioritize, planner, orchestrator, tasks

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

# Include routers
app.include_router(ingest.router)
app.include_router(extract.router)
app.include_router(fuse.router)
app.include_router(quality.router)
app.include_router(prioritize.router)
app.include_router(planner.router)
app.include_router(orchestrator.router)
app.include_router(tasks.router)

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"message": "TaskPilot AI API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}