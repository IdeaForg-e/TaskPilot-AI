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

STOP_WORDS = {
    "what", "how", "is", "are", "the", "on", "for", "all", "this", "that", "task", "tasks",
    "status", "show", "tell", "me", "with", "from", "about", "give", "list", "please", "can",
    "you", "does", "done", "work", "progress", "pipeline", "many", "there", "which", "where",
    "when", "who", "why", "have", "been", "being", "has", "had", "current", "currently"
}

def _generate_telemetry_fallback_reply(user_query: str, tasks, priorities, plans) -> str:
    query_lower = user_query.lower()
    
    # Intent 1: Task Count / Statistics
    if any(phrase in query_lower for phrase in ["how many", "total task", "task count", "number of task", "total count", "statistics", "overview"]):
        open_count = sum(1 for t in tasks if getattr(t, 'status', '').lower() in ['open', 'pending', 'in_progress', 'in-progress'])
        closed_count = sum(1 for t in tasks if getattr(t, 'status', '').lower() in ['completed', 'closed', 'done'])
        return (
            f"### 📊 Workspace Task Statistics\n\n"
            f"* **Total Active Tasks**: **{len(tasks)}**\n"
            f"* **Pending / Open Tasks**: **{open_count}**\n"
            f"* **Completed Tasks**: **{closed_count}**\n"
            f"* **Ranked Tasks**: **{len(priorities)}**\n\n"
            f"*(Retrieved live from workspace telemetry)*"
        )
        
    # Intent 2: Top Priorities / Leaderboard
    if any(phrase in query_lower for phrase in ["priority", "priorities", "top task", "leaderboard", "highest", "rank", "important"]):
        top_list = ""
        for p in priorities[:5]:
            t_item = next((t for t in tasks if t.id == p.master_task_id), None)
            t_title = t_item.title if t_item else "Unknown Task"
            t_status = t_item.status.upper() if t_item and t_item.status else "OPEN"
            top_list += f"\n{p.rank}. **{t_title}** — Priority Score: `{p.overall_score}` (`{t_status}`)"
            
        return (
            f"### 🏆 Top Ranked Priorities\n"
            f"{top_list or 'No priorities calculated yet. Run the pipeline to rank tasks.'}\n\n"
            f"*(Ranked by Multi-Agent Prioritization Matrix)*"
        )

    # Intent 3: Daily Plan / Schedule
    if any(phrase in query_lower for phrase in ["plan", "schedule", "today", "daily", "calendar", "agenda"]):
        if plans:
            return (
                f"### 📅 Current Daily Schedule ({plans.plan_date})\n\n"
                f"* **Schedule Status**: `{plans.load_status.upper()}`\n"
                f"* **Available Work Hours**: `{plans.available_hours} hrs`\n\n"
                f"Check the **AI Planner** page to view and adjust your time slots!"
            )
        return "### 📅 Daily Schedule\n\nNo daily plan has been generated for today. Click **Run Pipeline** to generate your AI schedule."

    # Intent 4: Specific Task Lookup (Match title using non-stop words)
    words = [w for w in query_lower.replace('"', '').replace("'", '').replace("?", "").split() if len(w) > 2 and w not in STOP_WORDS]
    
    best_task = None
    best_score = 0

    for t in tasks:
        if not t.title:
            continue
        t_title_lower = t.title.lower()
        
        # Exact or substring match
        clean_query = user_query.strip('?"\' ').lower()
        if clean_query in t_title_lower or t_title_lower in clean_query:
            best_task = t
            break
            
        # Keyword overlap match (excluding stop words)
        matches = sum(1 for kw in words if kw in t_title_lower)
        if matches >= 2 and matches > best_score:
            best_score = matches
            best_task = t

    if best_task:
        p_item = next((p for p in priorities if p.master_task_id == best_task.id), None)
        rank_info = f"Rank **#{p_item.rank}** (Priority Score: **{p_item.overall_score}**)" if p_item else "Unranked"
        explanation = f"\n\n**Priority Rationale**: {p_item.explanation}" if p_item and p_item.explanation else ""
        desc_info = f"\n\n**Description**: {best_task.description}" if best_task.description else ""

        return (
            f"### 📋 Task Telemetry Status\n\n"
            f"* **Task Title**: {best_task.title}\n"
            f"* **Status**: `{best_task.status.upper()}`\n"
            f"* **Priority Rank**: {rank_info}\n"
            f"* **Category / Type**: `{best_task.task_type}`"
            f"{desc_info}"
            f"{explanation}\n\n"
            f"*(Retrieved directly from live TaskPilot database)*"
        )

    # General fallback summary
    total_tasks = len(tasks)
    top_summary = ""
    for p in priorities[:3]:
        t_title = next((t.title for t in tasks if t.id == p.master_task_id), "Unknown")
        top_summary += f"\n* **Rank #{p.rank}**: {t_title} (Score: **{p.overall_score}**)"

    return (
        f"### 🚀 TaskPilot Intelligence Assistant\n\n"
        f"Synchronized **{total_tasks} active tasks** across multi-agent pipelines.\n\n"
        f"**Top Priorities**:{top_summary or ' None'}\n\n"
        f"**You can ask me:**\n"
        f"- *\"How many tasks are there?\"*\n"
        f"- *\"What are the top priorities?\"*\n"
        f"- *\"What is today's schedule?\"*\n"
        f"- *\"How is progress on [task title]?\"*\n"
        f"- Or type `inject P1 <issue>` to simulate an emergency incident!"
    )

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
                "source": "Github / Slack / Email / Meeting / Calendar",
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
            source_raw = str(data.get("source", "email")).strip().lower()
            if source_raw not in ["github", "slack", "email", "calendar", "meeting"]:
                source_raw = "email"
                
            import os
            import json
            import random
            from app.config import settings
            from app.services.agent_1_ingestion_service import SOURCE_FILES
            
            # Map normalized source names
            source_key = "meetings" if source_raw == "meeting" else source_raw
            filename = SOURCE_FILES.get(source_key, "emails.json")
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
            if source_raw == "github":
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
            else:  # calendar / meeting / default
                new_item = {
                    "id": f"event-{num}",
                    "title": title_val,
                    "description": desc_val,
                    "type": "one-time",
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "organizer": "user-001",
                    "created_at": datetime.utcnow().isoformat() + "Z",
                }

            file_items.append(new_item)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(file_items, f, indent=2, ensure_ascii=False)

            logger.info(f"Chat appended new event to {filename}: {title_val}")
            
            orchestrator = OrchestratorService(db)
            result = orchestrator.run_full_pipeline(incremental=True)
            
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
        
        # If no provider API key configured or LLM calls disabled, fallback gracefully to database telemetry
        if not llm.providers:
            reply = _generate_telemetry_fallback_reply(user_query, tasks, priorities, plans)
            return APIResponse(success=True, data={"reply": reply}, message="Response generated from telemetry")
        
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
        
        # If LLM returned unreachable fallback, generate smart database telemetry response based on intent
        if "unreachable" in reply.lower() or "no llm provider" in reply.lower():
            reply = _generate_telemetry_fallback_reply(user_query, tasks, priorities, plans)

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
