import logging
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import APIResponse
from app.models.task import MasterTask
from app.models.source_event import SourceEvent
from app.models.priority_score import PriorityScore
from app.models.quality_report import QualityReport
from app.models.daily_plan import DailyPlan
from app.services.agent_0_orchestrator_service import OrchestratorService
from agents.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["chat"])
logger = logging.getLogger("taskpilot.chat")

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

@router.post("/chat", response_model=APIResponse)
def chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    user_query = payload.message.strip()
    query_lower = user_query.lower()
    
    # 1. Check if user wants to inject a P1 task (Demo Scenario: Adapt)
    if "inject" in query_lower or "add task" in query_lower or "new defect" in query_lower or "p1" in query_lower:
        try:
            llm = LLMClient()
            extraction_prompt = f"""
            Extract a task title, description, and source from this query: "{user_query}"
            Output raw JSON matching this schema:
            {{
                "title": "Short title",
                "description": "Longer description of problem",
                "source": "Jira / Github / Email / Incident",
                "urgency": "high / normal"
            }}
            """
            data = llm.complete_json(extraction_prompt, fallback={
                "title": "Simulated Urgent Defect",
                "description": user_query,
                "source": "Incident",
                "urgency": "high"
            })
            
            title_val = data.get("title", "Simulated Urgent Defect")
            desc_val = data.get("description", "P1 Production error occurred")
            source_raw = str(data.get("source", "incident")).strip().lower()
            if source_raw not in ["jira", "github", "slack", "email", "calendar", "meeting", "incident"]:
                source_raw = "incident"
                
            import os
            import json
            import random
            from app.config import settings
            from app.services.agent_1_ingestion_service import SOURCE_FILES
            
            # Map normalized source names
            source_key = "meetings" if source_raw == "meeting" else "incidents" if source_raw == "incident" else source_raw
            filename = SOURCE_FILES.get(source_key, "incidents.json")
            path = os.path.join(settings.DATA_DIR, filename)
            
            # Load existing items
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        file_items = json.load(f)
                except Exception:
                    file_items = []
            else:
                file_items = []

            # Structure the raw event based on its source type
            num = random.randint(1000, 9999)
            if source_raw == "jira":
                new_item = {
                    "id": f"jira-{num}",
                    "key": f"PROJ-{num}",
                    "title": title_val,
                    "description": desc_val,
                    "type": "Bug",
                    "status": "To Do",
                    "priority": "High",
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }
            elif source_raw == "github":
                new_item = {
                    "id": f"gh-{num}",
                    "number": num,
                    "title": title_val,
                    "body": desc_val,
                    "type": "Issue",
                    "status": "open",
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }
            elif source_raw == "slack":
                new_item = {
                    "id": f"msg-{num}",
                    "channel": "general",
                    "user": "user-001",
                    "content": f"{title_val}\n{desc_val}",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            elif source_raw == "email":
                new_item = {
                    "id": f"email-{num}",
                    "subject": title_val,
                    "body": desc_val,
                    "from": "alert@system.com",
                    "to": "user-001@company.com",
                    "date": datetime.utcnow().strftime("%Y-%m-%d")
                }
            else:  # incident / default
                new_item = {
                    "id": f"inc-{num}",
                    "key": f"INC-{num}",
                    "title": title_val,
                    "description": desc_val,
                    "severity": "P1",
                    "status": "Open",
                    "reporter": "user-001",
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                }

            file_items.append(new_item)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(file_items, f, indent=2, ensure_ascii=False)

            logger.info(f"Chat appended new event to {filename}: {title_val}")
            
            # Re-run the full pipeline to ingest, extract, fuse, score quality, prioritize, and plan
            orchestrator = OrchestratorService(db)
            result = orchestrator.run_full_pipeline()
            
            # Query the newly prioritized task to find its priority rank and score
            priority_info = ""
            new_task = db.query(MasterTask).filter(MasterTask.title == title_val).first()
            if new_task:
                score_item = db.query(PriorityScore).filter(PriorityScore.master_task_id == new_task.id).first()
                if score_item:
                    priority_info = f" The task has been prioritized with score **{score_item.overall_score}** and ranked **#{score_item.rank}** on your Leaderboard."
            
            reply = f"🚨 **P1 Incident Injected!**\n\nI have successfully injected a new raw event into the system datastore:\n* **Title**: {title_val}\n* **Source**: {source_raw.upper()}\n\n**Pipeline Orchestrator triggered autonomously...** All stages (Ingestion $\rightarrow$ Extraction $\rightarrow$ Fusion $\rightarrow$ Quality check $\rightarrow$ Prioritization $\rightarrow$ Daily Schedule Planning) have been re-run.{priority_info}\n\nCheck the **Dashboard**, **Priority**, and **Planner** pages to see the live updates!"
            return APIResponse(success=True, data={"reply": reply}, message="Event injected and pipeline re-run")
        except Exception as err:
            logger.error(f"Failed to inject task: {err}")
            return APIResponse(success=True, data={"reply": f"Sorry, I encountered an error trying to process and inject that task: {err}"}, message="Error during task injection")

    # 2. General Query Handling - retrieve relevant context from database
    try:
        tasks = db.query(MasterTask).all()
        priorities = db.query(PriorityScore).order_by(PriorityScore.rank).all()
        plans = db.query(DailyPlan).order_by(DailyPlan.plan_date.desc()).first()
        
        # Compile short summary of DB contents as context for the LLM
        context_str = "CURRENT DATA IN DATABASE:\n"
        context_str += "1. TASKS:\n"
        for t in tasks:
            context_str += f"- ID: {t.id}, Title: '{t.title}', Status: {t.status}, Type: {t.task_type}\n"
        
        context_str += "\n2. PRIORITY RANKS:\n"
        for p in priorities:
            task_title = next((t.title for t in tasks if t.id == p.master_task_id), "Unknown")
            context_str += f"- Rank #{p.rank}: '{task_title}' (Score: {p.overall_score}, Explanation: {p.explanation})\n"
            
        if plans:
            context_str += f"\n3. DAILY PLAN DATE: {plans.plan_date}\n"
            context_str += f"- Status: {plans.load_status}, Available Hours: {plans.available_hours}\n"
        
        llm = LLMClient()
        
        # Check if LLM has any providers configured
        if not llm.providers:
            reply = (
                "⚠️ **LLM Service Not Configured**\n\n"
                "I cannot generate intelligent responses because no LLM API keys are configured.\n\n"
                "**To fix this:**\n"
                "1. Open `backend/.env`\n"
                "2. Add your key:\n"
                "   - `GROQ_API_KEY=your_groq_key`\n"
                "3. Restart the backend server\n\n"
                "Until then, I can still inject P1 tasks and re-run the pipeline."
            )
            return APIResponse(success=True, data={"reply": reply}, message="LLM not configured")
        
        prompt = f"""
        You are TaskPilot AI, a personalized task intelligence assistant for software engineers.
        Answer the user's question using the provided context of tasks, quality reviews, priorities, and schedules.
        Be helpful, concise, and structured. Use Markdown formatting.
        
        {context_str}
        
        USER QUESTION:
        {user_query}
        
        YOUR RESPONSE:
        """
        reply = llm.complete_text(prompt)
        llm_diagnostics = LLMClient.get_diagnostics()
        return APIResponse(
            success=True,
            data={"reply": reply, "llm_diagnostics": llm_diagnostics},
            message="Response generated"
        )
    except Exception as err:
        logger.error(f"Error handling chat query: {err}")
        llm_diagnostics = LLMClient.get_diagnostics()
        return APIResponse(
            success=True,
            data={
                "reply": f"Sorry, I failed to process your request: {err}",
                "llm_diagnostics": llm_diagnostics,
            },
            message="Chat exception",
        )
