from fastapi import FastAPI

# 👇 ADD THIS LINE HERE (IMPORT YOUR ROUTER)
from app.routers import ingestion


app = FastAPI(
    title="TaskPilot AI",
    description="AI Task Extraction System",
    version="1.0.0"
)

@app.get("/")
def home():
    return {"message": "TaskPilot AI backend is running 🚀"}

# 👇 ADD THIS BELOW app = FastAPI(...)
app.include_router(ingestion.router)