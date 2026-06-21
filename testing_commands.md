# TaskPilot AI — Hackathon Testing & Demo Scenarios Guide

This document contains copy-pasteable commands and queries to test every feature of TaskPilot AI during the live hackathon presentation and verification.

---

## 🚀 1. Setup & Launch Services
Before testing, launch both servers using the startup controller:
```powershell
# Double-click start.bat in the root folder or run:
.\start.bat
```
* **FastAPI Backend**: http://localhost:8000
* **Vite React Frontend**: http://localhost:5173 (Automatically opens in Chrome)

---

## ⚡ 2. Automated Pipeline Orchestration (End-to-End Run)
Use this command to trigger the complete Multi-Agent pipeline manually. This runs all 6 steps sequentially (Ingestion $\rightarrow$ Extraction $\rightarrow$ Fusion $\rightarrow$ Quality check $\rightarrow$ Prioritization $\rightarrow$ Daily Schedule Planning):

```powershell
curl -X POST http://localhost:8000/api/v1/orchestrate/run
```

**Expected Response JSON:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "completed_agents": ["ingestion", "extraction", "fusion", "quality", "prioritization", "planning"]
  },
  "message": "Pipeline completed"
}
```

---

## 💬 3. Conversational Copilot Queries (Must-Have MVP)
The Chat page (http://localhost:5173/chat) now connects directly to the SQLite backend datastore. You can type these natural language queries directly into the Chat UI, or test them via `curl` below.

### Query 1: "What is my top priority today?"
* **UI Prompt:** `What is my top priority today?`
* **API Command:**
```powershell
curl -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d "{\"message\": \"What is my top priority today?\"}"
```
* **Expected Answer**: Returns the highest ranked task from the Leaderboard (e.g. `PROJ-1016: Security: Update SSL/TLS certificates` because expiration is tomorrow, June 20, 2026) with detailed LLM explanation.

### Query 2: "Summarize my emails"
* **UI Prompt:** `Summarize my emails`
* **API Command:**
```powershell
curl -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d "{\"message\": \"Summarize my emails\"}"
```
* **Expected Answer**: Summarizes the unstructured email entries from `emails.json` (such as Acme Corp login issues, XSS vulnerability warnings, and Cloudflare SSL alerts).

### Query 3: "Why is the SSL certificate renewal task ranked higher than user documentation?"
* **UI Prompt:** `Why is the SSL certificate renewal task ranked higher than user documentation?`
* **API Command:**
```powershell
curl -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d "{\"message\": \"Why is the SSL certificate renewal task ranked higher than user documentation?\"}"
```
* **Expected Answer**: Evaluates priority scores and outputs explainable logic (certificates expire on June 20, causing immediate service breakdown, while documentation is low urgency and due in July).

---

## 🚨 4. The Live "Adapt / Injection" Scenario (Demo Showstopper)
To demonstrate **adaptation** (re-prioritizing the system when a new urgent incident happens), paste this command. It injects a P1 incident and re-calculates the pipeline immediately:

### Step A: Send Injection Command (via UI or API)
* **UI Prompt:** `inject a P1 defect for "Production upload API is down with 500 server errors"`
* **API Command:**
```powershell
curl -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d "{\"message\": \"inject a P1 defect for 'Production upload API is down with 500 server errors'\"}"
```

**Expected Response in Chat:**
> 🚨 **P1 Incident Injected!**
> 
> I have successfully injected a new raw event into the system datastore:
> * **Title**: Production upload API is down with 500 server errors
> * **Source**: Incident
> 
> **Pipeline Orchestrator triggered autonomously...** All stages (Ingestion $\rightarrow$ Extraction $\rightarrow$ Fusion $\rightarrow$ Quality check $\rightarrow$ Prioritization $\rightarrow$ Daily Schedule Planning) have been re-run. The task has been prioritized with score **95** and ranked **#1** on your Leaderboard.

### Step B: Verify the Adaptation
1. Open http://localhost:5173/priority (Priority Leaderboard). You will see the new task **Production upload API is down with 500 server errors** ranked as **#1** with a score of 95+.
2. Open http://localhost:5173/planner (Daily Planner). You will see the daily plan schedule updated automatically to block time for this P1 task at the start of the day.

---

## 📊 5. Individual Page Verification Endpoints
Verify individual frontend page data feeds using these endpoint requests:

### Tasks Page Feed (Consolidated directory)
```powershell
curl http://localhost:8000/api/v1/tasks
```

### Quality Page Feed (Flagged attributes / questions)
```powershell
curl http://localhost:8000/api/v1/quality/reports
```

### Priority Page Feed (Leaderboard ranking)
```powershell
curl http://localhost:8000/api/v1/tasks/ranked
```

### Planner Page Feed (Schedule calendar)
```powershell
curl http://localhost:8000/api/v1/daily-plan/2026-06-18
```

---

## 🛠️ 6. New Features & Workflow Verification

This section lists verification commands and expected UI/API behaviors for the latest updates.

### A. Database Reset on Server Startup
* **Action**: Restart the FastAPI server (e.g. kill the terminal running uvicorn and run `.\start.bat` or save a backend file).
* **Expected Behavior**: The `@app.on_event("startup")` event handler in `main.py` runs, unconditionally truncating all SQLite tables to return the database to a clean initial state.
* **Verification Command**:
```powershell
# Run task count check to verify database is fully empty on start
python -c "import sqlite3; conn=sqlite3.connect('backend/taskpilot.db'); cur=conn.cursor(); print('Workflow Runs:', cur.execute('SELECT COUNT(*) FROM workflow_runs').fetchone()[0]); print('Master Tasks:', cur.execute('SELECT COUNT(*) FROM master_tasks').fetchone()[0])"
```
* **Expected Output**:
  ```text
  Workflow Runs: 0
  Master Tasks: 0
  ```

### B. Platform Origin Badges on Priority Leaderboard
* **Action**: Open http://localhost:5173/priority (Priority Leaderboard).
* **Expected Behavior**: Next to each task title, you will see colored, styled labels representing the source platforms the fused task originated from (e.g., `Jira`, `GitHub`, `Slack`, `Email`).
* **Verification Endpoint**:
```powershell
curl http://localhost:8000/api/v1/tasks/ranked
```
* **Expected JSON Field**: Each task in the array will contain a `platforms` list (e.g. `"platforms": ["github", "jira"]`).

### C. Limited Daily Rest Breaks (Max 2 Breaks)
* **Action**: Open http://localhost:5173/planner (Daily Planner).
* **Expected Behavior**: The Daily Schedule Timeline will display **exactly 2 rest breaks / buffers** (green timelines with coffee cup icons) across the whole day (one mid-morning and one mid-afternoon), instead of breaking after every single task block.
* **Verification Command**:
```powershell
# Verify only 2 buffer slots are scheduled in the database
python -c "import sqlite3; conn=sqlite3.connect('backend/taskpilot.db'); cur=conn.cursor(); print('Scheduled Breaks:', cur.execute('SELECT COUNT(*) FROM time_slots WHERE slot_type=\"buffer\"').fetchone()[0])"
```
* **Expected Output**:
  ```text
  Scheduled Breaks: 2
  ```

### D. Overloaded Developer Queue Warnings
* **Action**: Open http://localhost:5173/tasks (Tasks Directory).
* **Expected Behavior**: Select a task assigned to a developer with more than 3 active tasks (e.g., `user-002` or `user-005`). A warning banner with a glowing rose badge saying `"Queue Overloaded"` will appear in the Task Detail view.
* **Verification Log Output**:
  ```text
  WARNING - Developer 'user-002' has an overloaded queue with 7 active tasks.
  ```
