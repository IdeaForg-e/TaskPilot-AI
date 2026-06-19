# TaskPilot AI — 2-Day Hackathon Execution Plan

### 5 Developers | June 19–20, 2026 | Dell Hackathon

---

# 📁 Current Project State

```
TaskPilot-AI/
├── .git/
├── LICENSE
├── README.md
├── backend/              ← EMPTY (to be built)
├── frontend/             ← EMPTY (to be built)
├── data/                 ← ✅ READY (8 demo JSON files)
│   ├── users.json         (18 users)
│   ├── jira_data.json     (28 tickets)
│   ├── github_data.json   (22 items)
│   ├── slack_data.json    (65 messages)
│   ├── emails.json        (24 emails)
│   ├── calendar.json      (18 events)
│   ├── meeting_notes.json (12 meetings)
│   └── incidents.json     (14 incidents)
└── implementation-plan.md ← THIS FILE
```

---

# 📋 Final Folder Structure (What We Are Building)

```
TaskPilot-AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  ← FastAPI entry point (registers routers and middleware)
│   │   ├── config.py                ← Environment config (database URLs, LLM model names, key links)
│   │   ├── database.py              ← SQLite + SQLAlchemy base setup (session generators)
│   │   ├── models/                  ← Database models (SQLAlchemy ORM tables)
│   │   │   ├── __init__.py
│   │   │   ├── source_event.py      ← Stores raw incoming data from Jira, Slack, Emails, Github
│   │   │   ├── task.py              ← Stores unified Master Tasks (after extraction and fusion)
│   │   │   ├── quality_report.py    ← Stores AI evaluated task quality scores & missing fields
│   │   │   ├── priority_score.py    ← Stores calculated priority ranks and reasoning scores
│   │   │   ├── daily_plan.py        ← Stores planned schedules for a date (available hrs, status)
│   │   │   └── workflow_run.py      ← Logs orchestrator pipeline steps run status and timing
│   │   ├── schemas/                 ← Pydantic schemas (for request/response validation)
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py         ← Validates raw payload ingested from external webhooks
│   │   │   ├── task.py              ← Validates input/output structure for master tasks
│   │   │   ├── quality.py           ← Validates structure of the quality audit report outputs
│   │   │   ├── priority.py          ← Validates priorities, ranks, and impact factor scores
│   │   │   ├── plan.py              ← Validates time slots, recommendations, and plans
│   │   │   └── common.py            ← Standard shared API responses and query schemas
│   │   ├── routers/                 ← API Controllers (exposes HTTP request endpoints)
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py            ← API to trigger ingestion from synthetic data files
│   │   │   ├── extract.py           ← API to trigger extraction agent on raw events
│   │   │   ├── fuse.py              ← API to trigger task de-duplication and merging
│   │   │   ├── quality.py           ← API to trigger task quality checks & fetch reports
│   │   │   ├── prioritize.py        ← API to trigger prioritization scoring calculations
│   │   │   ├── planner.py           ← API to generate daily calendar schedules
│   │   │   ├── orchestrator.py      ← API to trigger the full end-to-end multi-agent flow
│   │   │   └── tasks.py             ← CRUD APIs to read, filter, or manually update tasks
│   │   └── services/                ← Core Business Logic (interacts with agents & databases)
│   │       ├── __init__.py
│   │       ├── ingestion_service.py ← Ingestion rules, loads JSON records to SQL DB
│   │       ├── extraction_service.py← Handles task identification and schema population
│   │       ├── fusion_service.py    ← Resolves title semantic matching & text merging
│   │       ├── quality_service.py   ← Controls quality agent evaluations per task
│   │       ├── prioritization_service.py ← Runs prioritization calculations and sorting ranks
│   │       ├── planning_service.py  ← Fetches calendar events, maps tasks to available hours
│   │       └── orchestrator_service.py   ← Runs pipeline states sequentially (Ingest -> Plan)
│   ├── agents/                      ← Agent LLM wrapper layers
│   │   ├── __init__.py
│   │   ├── orchestrator_agent.py    ← Router LLM agent coordinating dynamic pipeline calls
│   │   ├── extraction_agent.py      ← Parses chats/emails to extract explicit & hidden tasks
│   │   ├── fusion_agent.py          ← Semantically deduplicates similar tasks using LLM context
│   │   ├── quality_agent.py         ← Rates issue quality and actionability metrics
│   │   ├── prioritization_agent.py  ← Ranks tasks (0 to 10) based on severity and business impact
│   │   ├── planning_agent.py        ← Allocates tasks to time slots avoiding calendar events
│   │   └── prompts/                 ← Agent instructions & prompt templates
│   │       ├── __init__.py
│   │       ├── orchestrator_prompts.py← Prompts defining system state routes and classification logic
│   │       ├── extraction_prompts.py← System prompts to identify hidden action items in conversations
│   │       ├── fusion_prompts.py    ← Prompts to determine if two issues describe duplicate work
│   │       ├── quality_prompts.py   ← Criteria to evaluate issues and list missing context
│   │       ├── prioritization_prompts.py ← Decision matrices to rate production & customer impact
│   │       └── planning_prompts.py  ← Rules for calendar scheduling, buffers, and overflow
│   ├── requirements.txt             ← Python package dependency list (FastAPI, sqlalchemy, openai...)
│   ├── .env                         ← Local secrets file (ignored by Git)
│   └── .env.example                 ← Template configuration secrets reference
│
├── frontend/
│   ├── public/                      ← Static public assets folder (icons, fonts, images)
│   ├── src/
│   │   ├── components/              ← Reusable UI component definitions
│   │   │   ├── layout/              ← App Shell components
│   │   │   │   ├── Sidebar.jsx      ← Sidebar menu navigation panels
│   │   │   │   ├── Header.jsx       ← Top navigation bar with active Pipeline triggers
│   │   │   │   └── Layout.jsx       ← Wraps sidebar and header around pages content
│   │   │   ├── dashboard/           ← Dashboard analytics components
│   │   │   │   ├── StatsCard.jsx    ← Renders summary metrics (e.g. Total, Actionable, Hidden)
│   │   │   │   ├── PipelineStatus.jsx← Renders live progress visualizer of active runs
│   │   │   │   └── RecentActivity.jsx← Renders logs and latest events activity feed
│   │   │   ├── tasks/               ← Unified Tasks components
│   │   │   │   ├── TaskList.jsx     ← Main list and filters for managing master tasks
│   │   │   │   ├── TaskCard.jsx     ← Card view for Kanban drag/drop items
│   │   │   │   └── TaskDetail.jsx   ← Full details panel/modal with status history
│   │   │   ├── planner/             ← Daily schedule components
│   │   │   │   ├── DailyPlanner.jsx ← Renders daily calendar schedule blocks
│   │   │   │   └── TimeSlot.jsx     ← Visual block representing a task or calendar meeting
│   │   │   ├── quality/             ← Quality scoring components
│   │   │   │   ├── QualityReport.jsx← Detailed panel showing missing info list & questions
│   │   │   │   └── QualityScore.jsx ← Progress indicator showing numeric quality ratings
│   │   │   └── priority/            ← Priority score components
│   │   │       ├── PriorityList.jsx ← Tabular list of tasks ranked by priority score
│   │   │       └── PriorityCard.jsx ← Details breakdown of calculated impact factors
│   │   ├── pages/                   ← Main routed views
│   │   │   ├── Dashboard.jsx        ← Overview page (shows pipeline runs, activity feed)
│   │   │   ├── Tasks.jsx            ← Master Task list explorer page
│   │   │   ├── Planner.jsx          ← Calendar scheduler page
│   │   │   ├── Quality.jsx          ← Quality reports overview page
│   │   │   └── Priority.jsx         ← Priority score matrix page
│   │   ├── services/
│   │   │   └── api.js               ← Axios configuration mapping APIs to backend routes
│   │   ├── App.jsx                  ← Base layout routing map matching routes to pages
│   │   ├── App.css                  ← Frontend custom styling tweaks
│   │   ├── main.jsx                 ← React mounting node configuration
│   │   └── index.css                ← CSS entry point imports Tailwind utilities
│   ├── index.html                   ← HTML document shell container
│   ├── vite.config.js               ← Vite server and proxy configuration
│   ├── tailwind.config.js           ← Tailwind CSS styling properties config
│   ├── postcss.config.js            ← PostCSS plugin config (Vite Tailwind setup)
│   └── package.json                 ← Frontend libraries dependencies listing
│
├── data/                            ← ✅ READY: Synthetic engineering dataset JSONs
├── implementation-plan.md           ← Complete developer execution roadmap & instructions
└── README.md                        ← Hackathon repo guidelines and setup commands
```

---

# 🤖 LLM Model Mapping & Fallback Architecture

| Phase | Agent / Task | Primary Model (Groq) | Fallback Model (NVIDIA) | Complexity | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | **Orchestrator Agent** | `llama-3.1-8b-instant` | `meta/llama-3.1-8b-instruct` | **Medium** | Fast routing aur pipeline transitions classification ke liye. |
| **Step 3** | **Extraction Agent** | `llama-3.1-8b-instant` | `meta/llama-3.1-8b-instruct` | **Medium** | Chats/Emails lambe hote hain. Fast parsing ke liye 8B parameters model speed aur cost ke liye best hai. |
| **Step 4** | **Task Fusion Agent** | `llama-3.3-70b-versatile` | `meta/llama-3.3-70b-instruct` | **High** | De-duplication ke liye deep reasoning lagti hai taaki different words wale similar task merge ho sakein. Isliye 70B models best hain. |
| **Step 5** | **Issue Quality Agent** | `llama-3.1-8b-instant` | `meta/llama-3.1-8b-instruct` | **Medium** | Task completeness audit kar ke fix format JSON return karna hota hai. 8B parameter model is suitable. |
| **Step 6** | **Prioritization Agent**| `llama-3.3-70b-versatile` | `meta/llama-3.3-70b-instruct` | **High** | Multi-factor matrix (Blockers, Customer impact, Urgency) par score nikalna hota hai. Large model validation accuracy solid rakhega. |
| **Step 7** | **Daily Planning Agent** | `llama-3.3-70b-versatile` | `meta/llama-3.3-70b-instruct` | **High** | Time slots, overlaps aur schedule constraints ko solve karne ke liye 70B model best output deta hai. |

---

# 👥 Developer Assignments

| Dev | Name | Role | Focus Area |
|-----|------|------|------------|
| **Dev 1** | — | Backend Lead | FastAPI setup, Database, API routes, Services |
| **Dev 2** | — | Agent Dev 1 | Ingestion + Extraction + Fusion agents |
| **Dev 3** | — | Agent Dev 2 | Quality + Prioritization + Daily Planning agents |
| **Dev 4** | — | Frontend Dev | React dashboard, all UI pages |
| **Dev 5** | — | Integration Lead | Orchestrator, end-to-end pipeline, demo prep |

---

---

# 🧑‍💻 DEV 1 — Backend Lead

## Role: FastAPI Setup, Database, All API Routes, All Services

---

## DAY 1 (June 19) — Foundation + APIs

### Step 1: Setup Backend Project

```bash
cd TaskPilot-AI/backend
```

Create `requirements.txt`:

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
pydantic==2.7.3
python-dotenv==1.0.1
chromadb==0.5.0
sentence-transformers==3.0.0
crewai==0.30.0
langchain==0.2.5
langchain-openai==0.1.8
langchain-community==0.2.5
openai==1.35.0
httpx==0.27.0
```

Run installation:

```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `.env.example`:

```
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:///./taskpilot.db
CHROMA_PERSIST_DIR=./chroma_db
```

Create `.env` (copy from .env.example and fill in real keys)

---

### Step 2: Create `backend/app/__init__.py`

```python
# empty file
```

### Step 3: Create `backend/app/config.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskpilot.db")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

settings = Settings()
```

### Step 4: Create `backend/app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
```

### Step 5: Create ALL Models in `backend/app/models/`

Create `__init__.py`:
```python
from app.models.source_event import SourceEvent
from app.models.task import TaskCandidate, MasterTask, TaskContextLink
from app.models.quality_report import QualityReport
from app.models.priority_score import PriorityScore
from app.models.daily_plan import DailyPlan, TimeSlot
from app.models.workflow_run import WorkflowRun
```

Create `source_event.py`:
```python
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database import Base
import uuid
from datetime import datetime

class SourceEvent(Base):
    __tablename__ = "source_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)        # jira/github/slack/email/calendar/meeting/incident
    source_id = Column(String)                     # original ID in source system
    event_type = Column(String, nullable=False)     # ticket/pr/issue/message/email/event/note/incident
    title = Column(String)
    content = Column(Text)
    author = Column(String)
    timestamp = Column(DateTime)
    metadata_json = Column(JSON)
    ingestion_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

Create `task.py`:
```python
from sqlalchemy import Column, String, Text, DateTime, Float, Boolean, Integer, JSON
from app.database import Base
import uuid
from datetime import datetime

class TaskCandidate(Base):
    __tablename__ = "task_candidates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    source_event_id = Column(String)
    task_type = Column(String)          # bug/feature/review/incident/meeting_action/request
    is_hidden = Column(Boolean, default=False)
    assignee = Column(String)
    deadline = Column(String)
    urgency = Column(String)            # low/medium/high/critical
    confidence = Column(Float)
    extraction_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class MasterTask(Base):
    __tablename__ = "master_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    task_type = Column(String)
    status = Column(String, default="open")
    assignee = Column(String)
    deadline = Column(String)
    urgency = Column(String)
    source_count = Column(Integer, default=1)
    is_duplicate_of = Column(String)
    fusion_run_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class TaskContextLink(Base):
    __tablename__ = "task_context_links"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    source_event_id = Column(String, nullable=False)
    link_type = Column(String)          # origin/related/duplicate
    similarity_score = Column(Float)
```

Create `quality_report.py`:
```python
from sqlalchemy import Column, String, Float, Text, JSON, DateTime
from app.database import Base
import uuid
from datetime import datetime

class QualityReport(Base):
    __tablename__ = "quality_reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    clear_title_score = Column(Float)
    reproduction_steps_score = Column(Float)
    error_logs_score = Column(Float)
    environment_score = Column(Float)
    expected_behavior_score = Column(Float)
    severity_score = Column(Float)
    assignee_score = Column(Float)
    missing_info = Column(JSON)
    clarification_questions = Column(JSON)
    actionability = Column(String)       # actionable/needs_info/blocked
    created_at = Column(DateTime, default=datetime.utcnow)
```

Create `priority_score.py`:
```python
from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from app.database import Base
import uuid
from datetime import datetime

class PriorityScore(Base):
    __tablename__ = "priority_scores"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    master_task_id = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    severity_score = Column(Float)
    deadline_score = Column(Float)
    production_impact_score = Column(Float)
    customer_impact_score = Column(Float)
    dependency_score = Column(Float)
    blocker_score = Column(Float)
    business_impact_score = Column(Float)
    quality_factor_score = Column(Float)
    rank = Column(Integer)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

Create `daily_plan.py`:
```python
from sqlalchemy import Column, String, Float, Text, JSON, DateTime, Date
from app.database import Base
import uuid
from datetime import datetime

class DailyPlan(Base):
    __tablename__ = "daily_plans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String)
    plan_date = Column(String, nullable=False)
    available_hours = Column(Float)
    planned_hours = Column(Float)
    buffer_hours = Column(Float)
    load_status = Column(String)        # healthy/moderate/overloaded
    recommendations = Column(JSON)
    overflow_tasks = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class TimeSlot(Base):
    __tablename__ = "time_slots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    daily_plan_id = Column(String, nullable=False)
    master_task_id = Column(String)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    slot_type = Column(String)          # task/meeting/buffer/break
    priority_level = Column(String)     # critical/high/normal/buffer
    title = Column(String)
```

Create `workflow_run.py`:
```python
from sqlalchemy import Column, String, Text, JSON, DateTime
from app.database import Base
import uuid
from datetime import datetime

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, default="running")    # running/completed/failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    agents_completed = Column(JSON, default=list)
    current_agent = Column(String)
    error_log = Column(Text)
```

### Step 6: Create ALL Pydantic Schemas in `backend/app/schemas/`

Create `__init__.py`:
```python
# empty
```

Create `common.py`:
```python
from pydantic import BaseModel
from typing import Any, Optional

class APIResponse(BaseModel):
    success: bool
    data: Any = None
    message: str = ""
```

Create `ingestion.py`:
```python
from pydantic import BaseModel
from typing import Optional, List

class IngestRequest(BaseModel):
    sources: List[str] = ["jira", "github", "slack", "email", "calendar", "meetings", "incidents"]

class IngestResponse(BaseModel):
    total_events: int
    per_source: dict
    new_events: int
```

Create `task.py`:
```python
from pydantic import BaseModel
from typing import Optional, List

class TaskCandidateOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = None
    is_hidden: bool = False
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    urgency: Optional[str] = None
    confidence: Optional[float] = None
    source_event_id: Optional[str] = None

class MasterTaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = None
    status: str = "open"
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    urgency: Optional[str] = None
    source_count: int = 1

class ExtractRequest(BaseModel):
    include_hidden: bool = True
    min_confidence: float = 0.5

class ExtractResponse(BaseModel):
    total_tasks: int
    explicit_tasks: int
    hidden_tasks: int
    tasks: List[TaskCandidateOut]

class FuseResponse(BaseModel):
    input_candidates: int
    master_tasks: int
    duplicates_merged: int
```

Create `quality.py`:
```python
from pydantic import BaseModel
from typing import Optional, List

class QualityReportOut(BaseModel):
    id: str
    master_task_id: str
    task_title: Optional[str] = None
    overall_score: float
    clear_title_score: Optional[float] = None
    reproduction_steps_score: Optional[float] = None
    error_logs_score: Optional[float] = None
    environment_score: Optional[float] = None
    expected_behavior_score: Optional[float] = None
    severity_score: Optional[float] = None
    assignee_score: Optional[float] = None
    missing_info: Optional[List[str]] = None
    clarification_questions: Optional[List[str]] = None
    actionability: Optional[str] = None

class QualityResponse(BaseModel):
    total_evaluated: int
    actionable: int
    needs_info: int
    avg_score: float
    reports: List[QualityReportOut]
```

Create `priority.py`:
```python
from pydantic import BaseModel
from typing import Optional, List

class PriorityScoreOut(BaseModel):
    id: str
    master_task_id: str
    task_title: Optional[str] = None
    overall_score: float
    rank: Optional[int] = None
    explanation: Optional[str] = None
    severity_score: Optional[float] = None
    deadline_score: Optional[float] = None
    production_impact_score: Optional[float] = None
    customer_impact_score: Optional[float] = None

class PriorityResponse(BaseModel):
    total_ranked: int
    ranked_tasks: List[PriorityScoreOut]
```

Create `plan.py`:
```python
from pydantic import BaseModel
from typing import Optional, List

class TimeSlotOut(BaseModel):
    start_time: str
    end_time: str
    slot_type: str
    priority_level: Optional[str] = None
    title: str
    task_id: Optional[str] = None

class DailyPlanRequest(BaseModel):
    user_id: str = "user-001"
    date: str = "2026-06-18"
    buffer_hours: float = 1.0

class DailyPlanOut(BaseModel):
    id: str
    plan_date: str
    available_hours: float
    planned_hours: float
    buffer_hours: float
    load_status: str
    time_slots: List[TimeSlotOut]
    recommendations: Optional[List[str]] = None
    overflow_tasks: Optional[List[dict]] = None

class PlanResponse(BaseModel):
    plan: DailyPlanOut
```

### Step 7: Create ALL API Routers in `backend/app/routers/`

Create `__init__.py`:
```python
# empty
```

Create `ingest.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.ingestion import IngestRequest
from app.services.ingestion_service import IngestionService

router = APIRouter(prefix="/api/v1", tags=["ingestion"])

@router.post("/ingest", response_model=APIResponse)
async def ingest_data(request: IngestRequest, db: Session = Depends(get_db)):
    service = IngestionService(db)
    result = service.ingest_all(request.sources)
    return APIResponse(success=True, data=result, message="Ingestion completed")

@router.get("/ingest/status", response_model=APIResponse)
async def ingest_status(db: Session = Depends(get_db)):
    service = IngestionService(db)
    count = service.get_event_count()
    return APIResponse(success=True, data={"total_events": count}, message="OK")
```

Create `extract.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.task import ExtractRequest
from app.services.extraction_service import ExtractionService

router = APIRouter(prefix="/api/v1", tags=["extraction"])

@router.post("/extract", response_model=APIResponse)
async def extract_tasks(request: ExtractRequest, db: Session = Depends(get_db)):
    service = ExtractionService(db)
    result = service.extract_all(request.include_hidden, request.min_confidence)
    return APIResponse(success=True, data=result, message="Extraction completed")

@router.get("/extract/results", response_model=APIResponse)
async def extraction_results(db: Session = Depends(get_db)):
    service = ExtractionService(db)
    result = service.get_results()
    return APIResponse(success=True, data=result, message="OK")
```

Create `fuse.py`:
```python
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
```

Create `quality.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.quality_service import QualityService

router = APIRouter(prefix="/api/v1", tags=["quality"])

@router.post("/quality/evaluate", response_model=APIResponse)
async def evaluate_quality(db: Session = Depends(get_db)):
    service = QualityService(db)
    result = service.evaluate_all()
    return APIResponse(success=True, data=result, message="Quality evaluation completed")

@router.get("/quality/reports", response_model=APIResponse)
async def get_quality_reports(db: Session = Depends(get_db)):
    service = QualityService(db)
    result = service.get_reports()
    return APIResponse(success=True, data=result, message="OK")
```

Create `prioritize.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.prioritization_service import PrioritizationService

router = APIRouter(prefix="/api/v1", tags=["prioritization"])

@router.post("/prioritize", response_model=APIResponse)
async def prioritize_tasks(db: Session = Depends(get_db)):
    service = PrioritizationService(db)
    result = service.prioritize_all()
    return APIResponse(success=True, data=result, message="Prioritization completed")

@router.get("/tasks/ranked", response_model=APIResponse)
async def get_ranked_tasks(db: Session = Depends(get_db)):
    service = PrioritizationService(db)
    result = service.get_ranked()
    return APIResponse(success=True, data=result, message="OK")
```

Create `planner.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.schemas.plan import DailyPlanRequest
from app.services.planning_service import PlanningService

router = APIRouter(prefix="/api/v1", tags=["planning"])

@router.post("/daily-plan", response_model=APIResponse)
async def generate_plan(request: DailyPlanRequest, db: Session = Depends(get_db)):
    service = PlanningService(db)
    result = service.generate_plan(request.user_id, request.date, request.buffer_hours)
    return APIResponse(success=True, data=result, message="Daily plan generated")

@router.get("/daily-plan/{date}", response_model=APIResponse)
async def get_plan(date: str, db: Session = Depends(get_db)):
    service = PlanningService(db)
    result = service.get_plan(date)
    return APIResponse(success=True, data=result, message="OK")
```

Create `orchestrator.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.services.orchestrator_service import OrchestratorService

router = APIRouter(prefix="/api/v1", tags=["orchestrator"])

@router.post("/orchestrate/run", response_model=APIResponse)
async def run_pipeline(db: Session = Depends(get_db)):
    service = OrchestratorService(db)
    result = service.run_full_pipeline()
    return APIResponse(success=True, data=result, message="Pipeline completed")

@router.get("/orchestrate/status/{run_id}", response_model=APIResponse)
async def pipeline_status(run_id: str, db: Session = Depends(get_db)):
    service = OrchestratorService(db)
    result = service.get_status(run_id)
    return APIResponse(success=True, data=result, message="OK")
```

Create `tasks.py`:
```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.common import APIResponse
from app.models.task import MasterTask
from app.models.quality_report import QualityReport
from app.models.priority_score import PriorityScore
from app.models.task import TaskContextLink
from app.models.source_event import SourceEvent

router = APIRouter(prefix="/api/v1", tags=["tasks"])

@router.get("/tasks", response_model=APIResponse)
async def get_tasks(
    status: str = Query(None),
    assignee: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MasterTask)
    if status:
        query = query.filter(MasterTask.status == status)
    if assignee:
        query = query.filter(MasterTask.assignee == assignee)
    tasks = query.all()
    result = [
        {
            "id": t.id, "title": t.title, "description": t.description,
            "task_type": t.task_type, "status": t.status, "assignee": t.assignee,
            "deadline": t.deadline, "urgency": t.urgency, "source_count": t.source_count
        }
        for t in tasks
    ]
    return APIResponse(success=True, data={"total": len(result), "tasks": result}, message="OK")

@router.get("/tasks/{task_id}", response_model=APIResponse)
async def get_task_detail(task_id: str, db: Session = Depends(get_db)):
    task = db.query(MasterTask).filter(MasterTask.id == task_id).first()
    if not task:
        return APIResponse(success=False, message="Task not found")
    
    quality = db.query(QualityReport).filter(QualityReport.master_task_id == task_id).first()
    priority = db.query(PriorityScore).filter(PriorityScore.master_task_id == task_id).first()
    links = db.query(TaskContextLink).filter(TaskContextLink.master_task_id == task_id).all()
    
    context = []
    for link in links:
        event = db.query(SourceEvent).filter(SourceEvent.id == link.source_event_id).first()
        if event:
            context.append({
                "source": event.source, "title": event.title,
                "content": event.content[:200] if event.content else None,
                "link_type": link.link_type
            })
    
    result = {
        "task": {
            "id": task.id, "title": task.title, "description": task.description,
            "task_type": task.task_type, "status": task.status, "assignee": task.assignee,
            "deadline": task.deadline, "urgency": task.urgency, "source_count": task.source_count
        },
        "quality": {
            "overall_score": quality.overall_score,
            "actionability": quality.actionability,
            "missing_info": quality.missing_info,
            "clarification_questions": quality.clarification_questions
        } if quality else None,
        "priority": {
            "overall_score": priority.overall_score,
            "rank": priority.rank,
            "explanation": priority.explanation
        } if priority else None,
        "context_links": context
    }
    return APIResponse(success=True, data=result, message="OK")
```

### Step 8: Create `backend/app/main.py`

```python
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
```

### Step 9: Create ALL Service Stubs (empty — Dev 2, 3, 5 will fill)

Create `backend/app/services/__init__.py`:
```python
# empty
```

Create `backend/app/services/ingestion_service.py`:
```python
# DEV 2 will implement this
class IngestionService:
    def __init__(self, db):
        self.db = db
    
    def ingest_all(self, sources):
        raise NotImplementedError("Dev 2 will implement")
    
    def get_event_count(self):
        raise NotImplementedError("Dev 2 will implement")
```

Create the same stub pattern for:
- `extraction_service.py` → **Dev 2 implements**
- `fusion_service.py` → **Dev 2 implements**
- `quality_service.py` → **Dev 3 implements**
- `prioritization_service.py` → **Dev 3 implements**
- `planning_service.py` → **Dev 3 implements**
- `orchestrator_service.py` → **Dev 5 implements**

**Each stub should follow the same pattern with class name + methods matching what the router calls.**

### Step 10: Test Server Runs

```bash
cd TaskPilot-AI/backend
uvicorn app.main:app --reload --port 8000
```

Visit: `http://localhost:8000/docs` → Should see Swagger UI with all endpoints listed.

---

## DAY 2 (June 20) — Bug Fixes + Integration Support

- Fix any issues Dev 2/3/5 face with models/schemas
- Add missing API endpoints if needed
- Help Dev 5 with orchestrator integration
- Help Dev 4 with API response format issues
- Final testing of all endpoints via Swagger

---

---

# 🧑‍💻 DEV 2 — Agent Developer 1

## Role: Ingestion Agent + Extraction Agent + Fusion Agent

---

## DAY 1 (June 19) — Ingestion + Extraction

### Step 1: Wait for Dev 1 to finish Steps 1-5 (models + database)

While waiting, study the demo data files:
```
data/users.json
data/jira_data.json
data/github_data.json
data/slack_data.json
data/emails.json
data/calendar.json
data/meeting_notes.json
data/incidents.json
```

### Step 2: Implement `backend/app/services/ingestion_service.py`

**What this does:** Reads all 8 JSON files → converts each record to a `SourceEvent` → saves to database.

```python
import json
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.config import settings
from app.models.source_event import SourceEvent

class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.data_dir = settings.DATA_DIR

    def ingest_all(self, sources: list[str]) -> dict:
        per_source = {}
        total = 0

        source_file_map = {
            "jira": ("jira_data.json", "jira", "ticket"),
            "github": ("github_data.json", "github", "pr"),
            "slack": ("slack_data.json", "slack", "message"),
            "email": ("emails.json", "email", "email"),
            "calendar": ("calendar.json", "calendar", "event"),
            "meetings": ("meeting_notes.json", "meeting", "note"),
            "incidents": ("incidents.json", "incident", "incident"),
        }

        for source_name in sources:
            if source_name not in source_file_map:
                continue
            filename, source_type, event_type = source_file_map[source_name]
            filepath = os.path.join(self.data_dir, filename)
            
            if not os.path.exists(filepath):
                per_source[source_name] = 0
                continue

            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            count = 0
            for item in data:
                event = SourceEvent(
                    id=str(uuid.uuid4()),
                    source=source_type,
                    source_id=item.get("id", ""),
                    event_type=event_type,
                    title=item.get("title", item.get("subject", item.get("key", ""))),
                    content=json.dumps(item),
                    author=item.get("author", item.get("assignee", item.get("from", ""))),
                    timestamp=datetime.fromisoformat(item.get("created_at", item.get("timestamp", item.get("date", "2026-06-17"))).replace("Z", "+00:00")) if item.get("created_at") or item.get("timestamp") else None,
                    metadata_json=item,
                )
                self.db.add(event)
                count += 1

            self.db.commit()
            per_source[source_name] = count
            total += count

        return {"total_events": total, "per_source": per_source, "new_events": total}

    def get_event_count(self) -> int:
        return self.db.query(SourceEvent).count()
```

### Step 3: Implement `backend/agents/extraction_agent.py`

**What this does:** Takes source events → uses LLM to find explicit tasks (from Jira/GitHub) and hidden tasks (from Slack/Email/Meetings).

Create `backend/agents/__init__.py`:
```python
# empty
```

Create `backend/agents/prompts/__init__.py`:
```python
# empty
```

Create `backend/agents/prompts/extraction_prompts.py`:
```python
HIDDEN_TASK_PROMPT = """You are a hidden task detector for engineering teams.

Analyze the following {source_type} content and extract any implicit tasks, requests, action items, or commitments that are NOT formally tracked in a project management tool.

Content:
{content}

Look for:
- Direct requests ("Can you...", "Please...", "@mention")
- Commitments ("I'll do...", "Let me...")
- Action items from discussions
- Implied work ("We need to...", "Someone should...")
- Follow-ups ("Let's revisit...", "Don't forget to...")

Return a JSON array of tasks found. Each task should have:
- "title": Clear, actionable task title
- "description": What needs to be done
- "assignee": Who should do this (user name or null)
- "deadline": When it's due (date string or null)
- "urgency": "low" / "medium" / "high" / "critical"
- "confidence": 0.0 to 1.0 (how confident you are this is a real task)

If no hidden tasks found, return an empty array: []

Return ONLY the JSON array, no other text."""

EXPLICIT_TASK_PROMPT = """Analyze this {source_type} item and extract the task information.

Data:
{content}

Return a JSON object with:
- "title": Task title
- "description": Task description
- "assignee": Assignee (or null)
- "deadline": Due date (or null)
- "urgency": "low" / "medium" / "high" / "critical"
- "task_type": "bug" / "feature" / "review" / "incident" / "documentation" / "technical_debt" / "security"

Return ONLY the JSON object, no other text."""
```

Create `backend/agents/extraction_agent.py`:
```python
import json
from openai import OpenAI
from app.config import settings
from app.agents.prompts.extraction_prompts import HIDDEN_TASK_PROMPT, EXPLICIT_TASK_PROMPT

client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

class ExtractionAgent:

    def extract_explicit_task(self, source_type: str, content: str) -> dict:
        """Extract task from structured sources like Jira/GitHub"""
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": EXPLICIT_TASK_PROMPT.format(source_type=source_type, content=content[:3000])}],
                temperature=0.1,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Explicit extraction error: {e}")
            return None

    def extract_hidden_tasks(self, source_type: str, content: str) -> list[dict]:
        """Detect hidden tasks from unstructured sources like Slack/Email/Meetings"""
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": HIDDEN_TASK_PROMPT.format(source_type=source_type, content=content[:3000])}],
                temperature=0.2,
            )
            text = response.choices[0].message.content.strip()
            # Handle markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            print(f"Hidden extraction error: {e}")
            return []
```

### Step 4: Implement `backend/app/services/extraction_service.py`

```python
import uuid
from sqlalchemy.orm import Session
from app.models.source_event import SourceEvent
from app.models.task import TaskCandidate
from app.agents.extraction_agent import ExtractionAgent

class ExtractionService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = ExtractionAgent()

    def extract_all(self, include_hidden: bool = True, min_confidence: float = 0.5) -> dict:
        events = self.db.query(SourceEvent).all()
        explicit_count = 0
        hidden_count = 0
        tasks = []

        for event in events:
            if event.source in ("jira", "github"):
                # Explicit tasks
                result = self.agent.extract_explicit_task(event.source, event.content)
                if result:
                    tc = TaskCandidate(
                        id=str(uuid.uuid4()),
                        title=result.get("title", event.title or "Untitled"),
                        description=result.get("description", ""),
                        source_event_id=event.id,
                        task_type=result.get("task_type", "feature"),
                        is_hidden=False,
                        assignee=result.get("assignee"),
                        deadline=result.get("deadline"),
                        urgency=result.get("urgency", "medium"),
                        confidence=1.0,
                    )
                    self.db.add(tc)
                    explicit_count += 1
                    tasks.append(tc)

            elif event.source in ("slack", "email", "meeting") and include_hidden:
                # Hidden tasks
                hidden_tasks = self.agent.extract_hidden_tasks(event.source, event.content)
                for ht in hidden_tasks:
                    conf = ht.get("confidence", 0.7)
                    if conf < min_confidence:
                        continue
                    tc = TaskCandidate(
                        id=str(uuid.uuid4()),
                        title=ht.get("title", "Hidden Task"),
                        description=ht.get("description", ""),
                        source_event_id=event.id,
                        task_type="request",
                        is_hidden=True,
                        assignee=ht.get("assignee"),
                        deadline=ht.get("deadline"),
                        urgency=ht.get("urgency", "medium"),
                        confidence=conf,
                    )
                    self.db.add(tc)
                    hidden_count += 1
                    tasks.append(tc)

        self.db.commit()

        return {
            "total_tasks": explicit_count + hidden_count,
            "explicit_tasks": explicit_count,
            "hidden_tasks": hidden_count,
            "tasks": [
                {"id": t.id, "title": t.title, "is_hidden": t.is_hidden, 
                 "confidence": t.confidence, "assignee": t.assignee, "urgency": t.urgency}
                for t in tasks
            ]
        }

    def get_results(self) -> dict:
        candidates = self.db.query(TaskCandidate).all()
        return {
            "total": len(candidates),
            "explicit": len([c for c in candidates if not c.is_hidden]),
            "hidden": len([c for c in candidates if c.is_hidden]),
            "tasks": [
                {"id": c.id, "title": c.title, "is_hidden": c.is_hidden,
                 "confidence": c.confidence, "assignee": c.assignee}
                for c in candidates
            ]
        }
```

### Step 5: Test Ingestion + Extraction

```bash
cd TaskPilot-AI/backend
uvicorn app.main:app --reload --port 8000
```

Test with:
1. `POST http://localhost:8000/api/v1/ingest` → Should load all demo data
2. `POST http://localhost:8000/api/v1/extract` → Should extract explicit + hidden tasks

---

## DAY 2 (June 20) — Fusion Agent

### Step 6: Create `backend/agents/prompts/fusion_prompts.py`

```python
FUSION_PROMPT = """Compare these two tasks and determine if they represent the SAME work:

Task A:
- Title: {title_a}
- Source: {source_a}
- Description: {desc_a}

Task B:
- Title: {title_b}
- Source: {source_b}
- Description: {desc_b}

Return a JSON object:
{{
  "is_duplicate": true/false,
  "confidence": 0.0-1.0,
  "merged_title": "best title if duplicate",
  "merged_description": "combined description if duplicate"
}}

Return ONLY the JSON object."""
```

### Step 7: Implement `backend/agents/fusion_agent.py`

```python
import json
from openai import OpenAI
from app.config import settings
from app.agents.prompts.fusion_prompts import FUSION_PROMPT

client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

class FusionAgent:
    def check_duplicate(self, task_a: dict, task_b: dict) -> dict:
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": FUSION_PROMPT.format(
                    title_a=task_a["title"], source_a=task_a.get("source", ""),
                    desc_a=task_a.get("description", "")[:500],
                    title_b=task_b["title"], source_b=task_b.get("source", ""),
                    desc_b=task_b.get("description", "")[:500],
                )}],
                temperature=0.1,
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            print(f"Fusion error: {e}")
            return {"is_duplicate": False, "confidence": 0}
```

### Step 8: Implement `backend/app/services/fusion_service.py`

```python
import uuid
from sqlalchemy.orm import Session
from app.models.task import TaskCandidate, MasterTask, TaskContextLink
from app.models.source_event import SourceEvent
from app.agents.fusion_agent import FusionAgent

class FusionService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = FusionAgent()

    def fuse_all(self) -> dict:
        candidates = self.db.query(TaskCandidate).all()
        if not candidates:
            return {"input_candidates": 0, "master_tasks": 0, "duplicates_merged": 0}

        # Simple approach: compare by title similarity + LLM check for borderline cases
        master_tasks = []
        merged_count = 0
        used = set()

        for i, candidate in enumerate(candidates):
            if candidate.id in used:
                continue

            # Check if this candidate is a duplicate of any existing master task
            merged = False
            for mt in master_tasks:
                # Quick title check first
                if self._titles_similar(candidate.title, mt["title"]):
                    result = self.agent.check_duplicate(
                        {"title": candidate.title, "description": candidate.description or ""},
                        {"title": mt["title"], "description": mt["description"] or ""}
                    )
                    if result.get("is_duplicate") and result.get("confidence", 0) > 0.7:
                        mt["source_count"] += 1
                        mt["linked_candidates"].append(candidate)
                        if result.get("merged_title"):
                            mt["title"] = result["merged_title"]
                        used.add(candidate.id)
                        merged_count += 1
                        merged = True
                        break

            if not merged:
                master_tasks.append({
                    "title": candidate.title,
                    "description": candidate.description,
                    "task_type": candidate.task_type,
                    "assignee": candidate.assignee,
                    "deadline": candidate.deadline,
                    "urgency": candidate.urgency,
                    "source_count": 1,
                    "linked_candidates": [candidate],
                })
                used.add(candidate.id)

        # Save master tasks to DB
        for mt_data in master_tasks:
            mt = MasterTask(
                id=str(uuid.uuid4()),
                title=mt_data["title"],
                description=mt_data["description"],
                task_type=mt_data["task_type"],
                assignee=mt_data["assignee"],
                deadline=mt_data["deadline"],
                urgency=mt_data["urgency"],
                source_count=mt_data["source_count"],
            )
            self.db.add(mt)
            self.db.flush()

            # Create context links
            for cand in mt_data["linked_candidates"]:
                if cand.source_event_id:
                    link = TaskContextLink(
                        id=str(uuid.uuid4()),
                        master_task_id=mt.id,
                        source_event_id=cand.source_event_id,
                        link_type="origin" if mt_data["source_count"] == 1 else "duplicate",
                    )
                    self.db.add(link)

        self.db.commit()

        return {
            "input_candidates": len(candidates),
            "master_tasks": len(master_tasks),
            "duplicates_merged": merged_count,
        }

    def _titles_similar(self, t1: str, t2: str) -> bool:
        """Quick check if titles might be similar (before LLM call)"""
        t1_words = set(t1.lower().split())
        t2_words = set(t2.lower().split())
        if not t1_words or not t2_words:
            return False
        overlap = len(t1_words & t2_words) / max(len(t1_words), len(t2_words))
        return overlap > 0.3
```

### Step 9: Test Fusion

```
POST http://localhost:8000/api/v1/fuse
```

---

---

# 🧑‍💻 DEV 3 — Agent Developer 2

## Role: Quality Agent + Prioritization Agent + Daily Planning Agent

---

## DAY 1 (June 19) — Quality + Prioritization

### Step 1: Create `backend/agents/prompts/quality_prompts.py`

```python
QUALITY_PROMPT = """You are an Issue Quality evaluator for engineering tasks.

Evaluate this task for completeness and actionability:

Title: {title}
Description: {description}
Type: {task_type}
Assignee: {assignee}
Deadline: {deadline}

Score each dimension (0 to 100):
1. clear_title: Is the title specific and descriptive?
2. reproduction_steps: Are steps to reproduce included (for bugs)?
3. error_logs: Are relevant logs or details provided?
4. environment: Is the environment specified?
5. expected_behavior: Is expected vs actual behavior described?
6. severity: Is severity/priority defined?
7. assignee: Is an owner assigned?

Also provide:
- missing_info: List of what's missing
- clarification_questions: Specific questions to ask
- actionability: "actionable" / "needs_info" / "blocked"

Return as JSON:
{{
  "clear_title": 0-100,
  "reproduction_steps": 0-100,
  "error_logs": 0-100,
  "environment": 0-100,
  "expected_behavior": 0-100,
  "severity": 0-100,
  "assignee": 0-100,
  "overall_score": 0-100,
  "missing_info": ["item1", "item2"],
  "clarification_questions": ["question1", "question2"],
  "actionability": "actionable/needs_info/blocked"
}}

Return ONLY the JSON object."""
```

### Step 2: Create `backend/agents/quality_agent.py`

```python
import json
from openai import OpenAI
from app.config import settings
from app.agents.prompts.quality_prompts import QUALITY_PROMPT

client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

class QualityAgent:
    def evaluate(self, title: str, description: str, task_type: str, assignee: str, deadline: str) -> dict:
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": QUALITY_PROMPT.format(
                    title=title, description=description or "No description",
                    task_type=task_type or "unknown",
                    assignee=assignee or "Unassigned",
                    deadline=deadline or "No deadline",
                )}],
                temperature=0.1,
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            print(f"Quality evaluation error: {e}")
            return {"overall_score": 50, "actionability": "needs_info", "missing_info": [], "clarification_questions": []}
```

### Step 3: Implement `backend/app/services/quality_service.py`

```python
import uuid
from sqlalchemy.orm import Session
from app.models.task import MasterTask
from app.models.quality_report import QualityReport
from app.agents.quality_agent import QualityAgent

class QualityService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = QualityAgent()

    def evaluate_all(self) -> dict:
        tasks = self.db.query(MasterTask).all()
        reports = []
        actionable = 0
        needs_info = 0
        total_score = 0

        for task in tasks:
            result = self.agent.evaluate(
                task.title, task.description or "",
                task.task_type or "", task.assignee or "", task.deadline or ""
            )
            
            report = QualityReport(
                id=str(uuid.uuid4()),
                master_task_id=task.id,
                overall_score=result.get("overall_score", 50),
                clear_title_score=result.get("clear_title"),
                reproduction_steps_score=result.get("reproduction_steps"),
                error_logs_score=result.get("error_logs"),
                environment_score=result.get("environment"),
                expected_behavior_score=result.get("expected_behavior"),
                severity_score=result.get("severity"),
                assignee_score=result.get("assignee"),
                missing_info=result.get("missing_info", []),
                clarification_questions=result.get("clarification_questions", []),
                actionability=result.get("actionability", "needs_info"),
            )
            self.db.add(report)
            reports.append({"task_title": task.title, **result})
            
            if result.get("actionability") == "actionable":
                actionable += 1
            else:
                needs_info += 1
            total_score += result.get("overall_score", 50)

        self.db.commit()

        return {
            "total_evaluated": len(tasks),
            "actionable": actionable,
            "needs_info": needs_info,
            "avg_score": round(total_score / len(tasks), 1) if tasks else 0,
            "reports": reports,
        }

    def get_reports(self) -> dict:
        reports = self.db.query(QualityReport).all()
        tasks = {t.id: t.title for t in self.db.query(MasterTask).all()}
        return {
            "total": len(reports),
            "reports": [
                {
                    "master_task_id": r.master_task_id,
                    "task_title": tasks.get(r.master_task_id, ""),
                    "overall_score": r.overall_score,
                    "actionability": r.actionability,
                    "missing_info": r.missing_info,
                    "clarification_questions": r.clarification_questions,
                }
                for r in reports
            ]
        }
```

### Step 4: Create `backend/agents/prompts/prioritization_prompts.py`

```python
PRIORITY_PROMPT = """You are a Prioritization Engine for engineering tasks.

Rank this task on a scale of 0.0 to 10.0:

Title: {title}
Description: {description}
Type: {task_type}
Urgency: {urgency}
Deadline: {deadline}
Assignee: {assignee}
Quality Score: {quality_score}/100

Evaluate these factors:
- severity (20%): How critical is this? P0 incidents = 10.0
- deadline (15%): How close is the deadline?
- production_impact (20%): Is production affected?
- customer_impact (10%): Are customers affected?
- dependencies (10%): Is this blocking other work?
- blockers (5%): Is the team waiting?
- business_impact (10%): Strategic importance?
- quality_factor (10%): Is the issue actionable as-is?

Return as JSON:
{{
  "overall_score": 0.0-10.0,
  "severity_score": 0.0-10.0,
  "deadline_score": 0.0-10.0,
  "production_impact_score": 0.0-10.0,
  "customer_impact_score": 0.0-10.0,
  "dependency_score": 0.0-10.0,
  "blocker_score": 0.0-10.0,
  "business_impact_score": 0.0-10.0,
  "quality_factor_score": 0.0-10.0,
  "explanation": "One sentence explaining the priority ranking"
}}

Return ONLY the JSON object."""
```

### Step 5: Create `backend/agents/prioritization_agent.py`

```python
import json
from openai import OpenAI
from app.config import settings
from app.agents.prompts.prioritization_prompts import PRIORITY_PROMPT

client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

class PrioritizationAgent:
    def prioritize(self, title, description, task_type, urgency, deadline, assignee, quality_score) -> dict:
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": PRIORITY_PROMPT.format(
                    title=title, description=description or "No description",
                    task_type=task_type or "unknown", urgency=urgency or "medium",
                    deadline=deadline or "No deadline", assignee=assignee or "Unassigned",
                    quality_score=quality_score or 50,
                )}],
                temperature=0.1,
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            print(f"Prioritization error: {e}")
            return {"overall_score": 5.0, "explanation": "Default priority"}
```

### Step 6: Implement `backend/app/services/prioritization_service.py`

```python
import uuid
from sqlalchemy.orm import Session
from app.models.task import MasterTask
from app.models.quality_report import QualityReport
from app.models.priority_score import PriorityScore
from app.agents.prioritization_agent import PrioritizationAgent

class PrioritizationService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = PrioritizationAgent()

    def prioritize_all(self) -> dict:
        tasks = self.db.query(MasterTask).all()
        quality_map = {q.master_task_id: q.overall_score for q in self.db.query(QualityReport).all()}
        scored = []

        for task in tasks:
            qs = quality_map.get(task.id, 50)
            result = self.agent.prioritize(
                task.title, task.description or "", task.task_type or "",
                task.urgency or "medium", task.deadline or "", task.assignee or "", qs
            )
            
            ps = PriorityScore(
                id=str(uuid.uuid4()),
                master_task_id=task.id,
                overall_score=result.get("overall_score", 5.0),
                severity_score=result.get("severity_score"),
                deadline_score=result.get("deadline_score"),
                production_impact_score=result.get("production_impact_score"),
                customer_impact_score=result.get("customer_impact_score"),
                dependency_score=result.get("dependency_score"),
                blocker_score=result.get("blocker_score"),
                business_impact_score=result.get("business_impact_score"),
                quality_factor_score=result.get("quality_factor_score"),
                explanation=result.get("explanation", ""),
            )
            self.db.add(ps)
            scored.append((ps, task.title))

        self.db.commit()

        # Assign ranks
        scored.sort(key=lambda x: x[0].overall_score, reverse=True)
        ranked = []
        for rank, (ps, title) in enumerate(scored, 1):
            ps.rank = rank
            ranked.append({
                "rank": rank,
                "task_title": title,
                "master_task_id": ps.master_task_id,
                "overall_score": ps.overall_score,
                "explanation": ps.explanation,
            })
        self.db.commit()

        return {"total_ranked": len(ranked), "ranked_tasks": ranked}

    def get_ranked(self) -> dict:
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        tasks = {t.id: t.title for t in self.db.query(MasterTask).all()}
        return {
            "total": len(scores),
            "ranked_tasks": [
                {
                    "rank": s.rank, "master_task_id": s.master_task_id,
                    "task_title": tasks.get(s.master_task_id, ""),
                    "overall_score": s.overall_score, "explanation": s.explanation,
                }
                for s in scores
            ]
        }
```

---

## DAY 2 (June 20) — Daily Planning Agent

### Step 7: Create `backend/agents/prompts/planning_prompts.py`

```python
PLANNING_PROMPT = """You are a Daily Planning Agent for engineers.

Generate a daily work plan.

Date: {date}
Available hours: {available_hours}
Calendar events (meetings): {meetings}

Ranked tasks (by priority):
{ranked_tasks}

Rules:
1. Schedule highest priority tasks first
2. NEVER overlap with meetings
3. Add 1 hour buffer at end of day
4. If total work > available time, mark overflow tasks
5. Group related tasks when possible

Return as JSON:
{{
  "available_hours": number,
  "planned_hours": number,
  "buffer_hours": 1.0,
  "load_status": "healthy" / "moderate" / "overloaded",
  "time_slots": [
    {{"start_time": "09:00", "end_time": "11:00", "slot_type": "task", "priority_level": "critical", "title": "...", "task_id": "..."}},
    {{"start_time": "11:00", "end_time": "11:30", "slot_type": "meeting", "priority_level": "neutral", "title": "Daily Standup", "task_id": null}}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "overflow_tasks": [{{"task_id": "...", "title": "...", "reason": "..."}}]
}}

Return ONLY the JSON object."""
```

### Step 8: Create `backend/agents/planning_agent.py`

```python
import json
from openai import OpenAI
from app.config import settings
from app.agents.prompts.planning_prompts import PLANNING_PROMPT

client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

class PlanningAgent:
    def generate_plan(self, date, available_hours, meetings, ranked_tasks) -> dict:
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": PLANNING_PROMPT.format(
                    date=date, available_hours=available_hours,
                    meetings=json.dumps(meetings), ranked_tasks=json.dumps(ranked_tasks[:15]),
                )}],
                temperature=0.2,
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            print(f"Planning error: {e}")
            return {"time_slots": [], "recommendations": ["Planning failed"], "load_status": "unknown"}
```

### Step 9: Implement `backend/app/services/planning_service.py`

```python
import uuid, json, os
from sqlalchemy.orm import Session
from app.config import settings
from app.models.task import MasterTask
from app.models.priority_score import PriorityScore
from app.models.daily_plan import DailyPlan, TimeSlot
from app.agents.planning_agent import PlanningAgent

class PlanningService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = PlanningAgent()

    def generate_plan(self, user_id: str, date: str, buffer_hours: float = 1.0) -> dict:
        # Load calendar
        calendar_path = os.path.join(settings.DATA_DIR, "calendar.json")
        meetings = []
        if os.path.exists(calendar_path):
            with open(calendar_path, "r") as f:
                all_events = json.load(f)
            meetings = [
                {"title": e["title"], "start": e["start_time"], "end": e["end_time"]}
                for e in all_events if e.get("date") == date
            ]

        # Calculate available hours
        total_hours = 8.0
        meeting_hours = sum(
            (int(m["end"].split(":")[0]) * 60 + int(m["end"].split(":")[1]) -
             int(m["start"].split(":")[0]) * 60 - int(m["start"].split(":")[1])) / 60
            for m in meetings
        )
        available = total_hours - meeting_hours - buffer_hours

        # Get ranked tasks
        scores = self.db.query(PriorityScore).order_by(PriorityScore.rank).all()
        tasks = {t.id: t for t in self.db.query(MasterTask).all()}
        ranked = [
            {"task_id": s.master_task_id, "title": tasks[s.master_task_id].title,
             "score": s.overall_score, "rank": s.rank}
            for s in scores if s.master_task_id in tasks
        ]

        # Generate plan via LLM
        result = self.agent.generate_plan(date, available, meetings, ranked)

        # Save to DB
        plan = DailyPlan(
            id=str(uuid.uuid4()), user_id=user_id, plan_date=date,
            available_hours=available,
            planned_hours=result.get("planned_hours", available),
            buffer_hours=buffer_hours,
            load_status=result.get("load_status", "healthy"),
            recommendations=result.get("recommendations", []),
            overflow_tasks=result.get("overflow_tasks", []),
        )
        self.db.add(plan)

        for slot_data in result.get("time_slots", []):
            slot = TimeSlot(
                id=str(uuid.uuid4()), daily_plan_id=plan.id,
                master_task_id=slot_data.get("task_id"),
                start_time=slot_data.get("start_time", ""),
                end_time=slot_data.get("end_time", ""),
                slot_type=slot_data.get("slot_type", "task"),
                priority_level=slot_data.get("priority_level", "normal"),
                title=slot_data.get("title", ""),
            )
            self.db.add(slot)

        self.db.commit()

        return {
            "plan": {
                "id": plan.id, "plan_date": plan.plan_date,
                "available_hours": plan.available_hours,
                "planned_hours": plan.planned_hours,
                "buffer_hours": plan.buffer_hours,
                "load_status": plan.load_status,
                "time_slots": result.get("time_slots", []),
                "recommendations": plan.recommendations,
                "overflow_tasks": plan.overflow_tasks,
            }
        }

    def get_plan(self, date: str) -> dict:
        plan = self.db.query(DailyPlan).filter(DailyPlan.plan_date == date).first()
        if not plan:
            return {"message": "No plan found for this date"}
        slots = self.db.query(TimeSlot).filter(TimeSlot.daily_plan_id == plan.id).all()
        return {
            "plan": {
                "id": plan.id, "plan_date": plan.plan_date,
                "available_hours": plan.available_hours,
                "planned_hours": plan.planned_hours,
                "load_status": plan.load_status,
                "time_slots": [
                    {"start_time": s.start_time, "end_time": s.end_time,
                     "slot_type": s.slot_type, "priority_level": s.priority_level,
                     "title": s.title, "task_id": s.master_task_id}
                    for s in slots
                ],
                "recommendations": plan.recommendations,
            }
        }
```

---

---

# 🧑‍💻 DEV 4 — Frontend Developer

## Role: React Dashboard (ALL UI Pages)

---

## DAY 1 (June 19) — Project Setup + Layout + Dashboard

### Step 1: Create React Project

```bash
cd TaskPilot-AI/frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### Step 3: Update `src/index.css`

```css
@import "tailwindcss";
```

Design a beautiful, dark-themed dashboard using Tailwind CSS. Implement these pages:

### Step 4: Create `src/services/api.js`

```javascript
import axios from 'axios';

const API = axios.create({ baseURL: '/api/v1' });

export const runPipeline = () => API.post('/orchestrate/run');
export const getPipelineStatus = (id) => API.get(`/orchestrate/status/${id}`);
export const ingestData = (sources) => API.post('/ingest', { sources });
export const extractTasks = () => API.post('/extract', { include_hidden: true, min_confidence: 0.5 });
export const fuseTasks = () => API.post('/fuse');
export const evaluateQuality = () => API.post('/quality/evaluate');
export const getQualityReports = () => API.get('/quality/reports');
export const prioritizeTasks = () => API.post('/prioritize');
export const getRankedTasks = () => API.get('/tasks/ranked');
export const generatePlan = (data) => API.post('/daily-plan', data);
export const getPlan = (date) => API.get(`/daily-plan/${date}`);
export const getTasks = () => API.get('/tasks');
export const getTaskDetail = (id) => API.get(`/tasks/${id}`);
```

### Step 5: Create Layout Components

Create these files under `src/components/layout/`:

- `Sidebar.jsx` — Navigation sidebar with links: Dashboard, Tasks, Planner, Quality, Priority
- `Header.jsx` — Top bar with "TaskPilot AI" title and "Run Pipeline" button
- `Layout.jsx` — Wraps Sidebar + Header + main content area

### Step 6: Create Pages

Create these files under `src/pages/`:

- `Dashboard.jsx` — Overview with stats cards (total tasks, hidden tasks, avg quality, top priority), pipeline run button, recent activity
- `Tasks.jsx` — Table/card list of all master tasks with filters (status, type, assignee)
- `Quality.jsx` — Quality reports with score bars, missing info, clarification questions
- `Priority.jsx` — Ranked task list with priority scores and explanations
- `Planner.jsx` — Daily plan view with time blocks, meetings, buffer, recommendations

### Step 7: Update `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Quality from './pages/Quality';
import Priority from './pages/Priority';
import Planner from './pages/Planner';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/priority" element={<Priority />} />
          <Route path="/planner" element={<Planner />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

### Step 8: Run Frontend

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## DAY 2 (June 20) — API Integration + Polish

- Connect all pages to real API endpoints
- Add loading states and error handling
- Add animations and transitions
- Polish the design — make it demo-worthy
- Test full flow: Dashboard → Run Pipeline → See results in all pages

---

---

# 🧑‍💻 DEV 5 — Integration Lead

## Role: Orchestrator Service, End-to-End Pipeline, Demo Prep

---

## DAY 1 (June 19) — Orchestrator + Users Data Setup

### Step 1: Implement `backend/app/services/orchestrator_service.py`

**Wait for Dev 1 (routes) + Dev 2 (ingestion+extraction) to be ready.**

```python
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.workflow_run import WorkflowRun
from app.services.ingestion_service import IngestionService
from app.services.extraction_service import ExtractionService
from app.services.fusion_service import FusionService
from app.services.quality_service import QualityService
from app.services.prioritization_service import PrioritizationService
from app.services.planning_service import PlanningService

class OrchestratorService:
    def __init__(self, db: Session):
        self.db = db

    def run_full_pipeline(self) -> dict:
        run = WorkflowRun(id=str(uuid.uuid4()), status="running", current_agent="ingestion")
        self.db.add(run)
        self.db.commit()

        results = {}
        agents = [
            ("ingestion", self._run_ingestion),
            ("extraction", self._run_extraction),
            ("fusion", self._run_fusion),
            ("quality", self._run_quality),
            ("prioritization", self._run_prioritization),
            ("planning", self._run_planning),
        ]

        completed = []
        for agent_name, agent_fn in agents:
            try:
                run.current_agent = agent_name
                self.db.commit()
                
                result = agent_fn()
                results[agent_name] = result
                completed.append(agent_name)
                run.agents_completed = completed
                self.db.commit()
            except Exception as e:
                run.status = "failed"
                run.error_log = f"Agent {agent_name} failed: {str(e)}"
                run.completed_at = datetime.utcnow()
                self.db.commit()
                return {
                    "run_id": run.id, "status": "failed",
                    "failed_agent": agent_name, "error": str(e),
                    "completed_agents": completed, "results": results,
                }

        run.status = "completed"
        run.current_agent = None
        run.completed_at = datetime.utcnow()
        self.db.commit()

        return {
            "run_id": run.id, "status": "completed",
            "completed_agents": completed, "results": results,
        }

    def _run_ingestion(self):
        svc = IngestionService(self.db)
        return svc.ingest_all(["jira", "github", "slack", "email", "calendar", "meetings", "incidents"])

    def _run_extraction(self):
        svc = ExtractionService(self.db)
        return svc.extract_all(include_hidden=True, min_confidence=0.5)

    def _run_fusion(self):
        svc = FusionService(self.db)
        return svc.fuse_all()

    def _run_quality(self):
        svc = QualityService(self.db)
        return svc.evaluate_all()

    def _run_prioritization(self):
        svc = PrioritizationService(self.db)
        return svc.prioritize_all()

    def _run_planning(self):
        svc = PlanningService(self.db)
        return svc.generate_plan("user-001", "2026-06-18", 1.0)

    def get_status(self, run_id: str) -> dict:
        run = self.db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
        if not run:
            return {"message": "Run not found"}
        return {
            "run_id": run.id, "status": run.status,
            "started_at": str(run.started_at),
            "completed_at": str(run.completed_at) if run.completed_at else None,
            "current_agent": run.current_agent,
            "agents_completed": run.agents_completed,
            "error": run.error_log,
        }
```

### Step 2: Test the Full Pipeline

```bash
# Start server
cd TaskPilot-AI/backend
uvicorn app.main:app --reload --port 8000

# Hit the one-click pipeline endpoint
# POST http://localhost:8000/api/v1/orchestrate/run
```

This single call should:
1. Ingest all demo data ✅
2. Extract explicit + hidden tasks ✅
3. Merge duplicates ✅
4. Score quality ✅
5. Prioritize tasks ✅
6. Generate daily plan ✅

---

## DAY 2 (June 20) — End-to-End Testing + Demo Prep

### Step 3: Verify All 5 Demo Scenarios

| Scenario | What to verify |
|----------|---------------|
| **1. Production Incident** | INC-001 (mobile login) should rank #1 with score > 9.0 |
| **2. Hidden Slack Task** | "@anil review PR #212" detected as hidden task |
| **3. Duplicate Merge** | OAuth work from Jira+GitHub+Slack merged into 1 task |
| **4. Poor Quality Issue** | "Login broken." (PROJ-1003) should score < 30/100 |
| **5. Daily Plan** | Plan shows time blocks, meetings, buffer, no overlaps |

### Step 4: Fix Bugs + Polish

- Fix any pipeline failures
- Ensure frontend shows all data correctly
- Coordinate with Dev 4 for API response format fixes
- Delete old `taskpilot.db` and re-run pipeline if data is messy

### Step 5: Demo Script

Prepare this demo flow:
1. Open Dashboard → Show empty state
2. Click "Run Pipeline" → Show progress
3. Go to Tasks → Show extracted tasks (highlight hidden ones)
4. Go to Quality → Show poor vs good issues
5. Go to Priority → Show ranked list with explanations
6. Go to Planner → Show daily plan with time blocks
7. Click on a task → Show cross-system context

---

---

# ⏰ 2-Day Timeline

## DAY 1 — June 19 (Thursday)

| Time | Dev 1 | Dev 2 | Dev 3 | Dev 4 | Dev 5 |
|------|-------|-------|-------|-------|-------|
| **Morning** | Steps 1-6: Setup, Config, DB, Models, Schemas | Study demo data | Study prompts & LLM patterns | Step 1-2: Vite + Tailwind setup | Study architecture |
| **Afternoon** | Steps 7-8: All Routers + main.py | Steps 2-4: Ingestion + Extraction | Steps 1-6: Quality + Prioritization | Steps 3-7: Layout + Pages | Step 1: Orchestrator |
| **Evening** | Step 9: Service stubs + test server | Step 5: Test ingestion + extraction | Test quality + prioritization | Step 8: Run frontend | Step 2: Test pipeline |
| **EOD** | ✅ Server runs, Swagger shows all endpoints | ✅ Ingest + Extract working | ✅ Quality + Priority working | ✅ Frontend renders all pages | ✅ Pipeline runs end-to-end |

## DAY 2 — June 20 (Friday)

| Time | Dev 1 | Dev 2 | Dev 3 | Dev 4 | Dev 5 |
|------|-------|-------|-------|-------|-------|
| **Morning** | Fix API bugs | Steps 6-8: Fusion agent | Steps 7-9: Daily Planning agent | API integration (all pages) | Test all 5 demo scenarios |
| **Afternoon** | Help Dev 4/5 with issues | Step 9: Test fusion | Test planning | Loading states + error handling | Fix bugs + data issues |
| **Evening** | Final API testing | Bug fixes | Bug fixes | Polish UI + animations | Demo script + rehearsal |
| **EOD** | ✅ All APIs stable | ✅ All 3 agents working | ✅ All 3 agents working | ✅ Dashboard demo-ready | ✅ Demo rehearsed |

---

# 🚀 Quick Start Commands

### Backend (Dev 1, 2, 3, 5)
```bash
cd TaskPilot-AI/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Visit: http://localhost:8000/docs
```

### Frontend (Dev 4)
```bash
cd TaskPilot-AI/frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios lucide-react
npm install -D tailwindcss @tailwindcss/vite
npm run dev
# Visit: http://localhost:5173
```

### One-Click Pipeline Test
```bash
# After everything is built:
curl -X POST http://localhost:8000/api/v1/orchestrate/run
```

---

# ✅ Definition of Done (Demo Ready)

- [ ] Backend server runs without errors
- [ ] All 8 JSON files ingest successfully
- [ ] Explicit tasks extracted from Jira/GitHub
- [ ] Hidden tasks extracted from Slack/Email/Meetings
- [ ] Duplicates merged correctly
- [ ] Quality scores generated (poor issues score low)
- [ ] Priority ranking works (P0 incidents rank first)
- [ ] Daily plan has time blocks + buffer + no overlaps
- [ ] Frontend dashboard shows all data
- [ ] One-click "Run Pipeline" works end-to-end
- [ ] 5 demo scenarios verified

---

*TaskPilot AI — Dell Hackathon 2026*
*2 Days. 5 Developers. Ship It. 🚀*
