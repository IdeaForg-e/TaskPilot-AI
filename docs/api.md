# TaskPilot AI — API Reference

All endpoints are prefixed with `/api/v1`. The backend runs on `http://localhost:8000` by default.

---

## Pipeline Orchestration

### POST `/orchestrate/run`

Execute the full 6-stage pipeline in the background.

**Response:**
```json
{
  "success": true,
  "data": {
    "run_id": "abc-123-def",
    "status": "running",
    "completed_agents": [],
    "llm_diagnostics": []
  },
  "message": "Pipeline started in background"
}
```

**Pipeline stages:** Ingestion → Extraction → Fusion → Quality → Prioritization → Planning

---

### GET `/orchestrate/status/{run_id}`

Get the status of a specific pipeline run.

**Response:**
```json
{
  "success": true,
  "data": {
    "run_id": "abc-123-def",
    "status": "completed",
    "started_at": "2026-09-05T10:00:00",
    "completed_at": "2026-09-05T10:00:22",
    "current_agent": "",
    "agents_completed": ["ingestion", "extraction", "fusion", "quality", "prioritization", "planning"],
    "error": null
  }
}
```

**Status values:** `running` | `completed` | `failed`

---

### GET `/orchestrate/latest`

Get the most recent pipeline run with LLM diagnostics and system metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "latest_run": {
      "run_id": "abc-123-def",
      "status": "completed",
      "started_at": "2026-09-05T10:00:00",
      "completed_at": "2026-09-05T10:00:22",
      "current_agent": "",
      "agents_completed": ["ingestion", "extraction", "fusion", "quality", "prioritization", "planning"],
      "error": null
    },
    "total_runs": 4,
    "system_accuracy": 95.0,
    "environment": "Development",
    "average_latency": 4243.2,
    "llm_diagnostics": [...]
  }
}
```

---

## Data Ingestion

### POST `/ingest`

Trigger ingestion of raw data from 5 JSON source files into SourceEvent records.

**Request body:** None required (reads from `data/` directory)

**Response:**
```json
{
  "success": true,
  "data": {
    "events_ingested": 51,
    "sources": ["github", "slack", "email", "calendar", "meeting"]
  },
  "message": "Ingestion completed"
}
```

---

### GET `/ingest/status`

Get the count of ingested source events.

---

## Task Extraction

### POST `/extract`

Run extraction (explicit + hidden tasks) from ingested source events.

**Request body (optional):**
```json
{
  "include_hidden": true,
  "min_confidence": 0.65
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tasks": 51,
    "explicit_tasks": 9,
    "hidden_tasks": 42,
    "filtered_out": 0,
    "validation_stats": {...},
    "tasks": [...]
  }
}
```

---

### GET `/extract/results`

Get all extracted task candidates.

---

## Fusion / Deduplication

### POST `/fuse`

Run deduplication and merge duplicate tasks into MasterTasks.

**Response:**
```json
{
  "success": true,
  "data": {
    "input_candidates": 51,
    "master_tasks": 42,
    "duplicates_merged": 9
  }
}
```

---

## Quality Evaluation

### POST `/quality/evaluate`

Run quality evaluation on all MasterTasks.

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluated": 42,
    "critical_evaluated": 5,
    "reports": [...]
  }
}
```

---

### GET `/quality/reports`

Get all quality evaluation reports.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "actionable": 35,
    "needs_info": 7,
    "blocked": 0,
    "reports": [
      {
        "id": "...",
        "master_task_id": "...",
        "title": "Fix login bug",
        "overall_score": 78.5,
        "clear_title_score": 85,
        "reproduction_steps_score": 80,
        "error_logs_score": 60,
        "environment_score": 80,
        "expected_behavior_score": 80,
        "severity_score": 70,
        "assignee_score": 85,
        "missing_info": ["error logs"],
        "clarification_questions": ["Please attach server logs..."],
        "actionability": "actionable"
      }
    ]
  }
}
```

---

## Prioritization

### POST `/prioritize`

Run multi-factor prioritization scoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "scored": 42,
    "critical_scored": 3,
    "scores": [...]
  }
}
```

---

### GET `/tasks/ranked`

Get all tasks sorted by priority score (highest first).

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "tasks": [
      {
        "id": "...",
        "title": "Fix payment gateway timeout",
        "overall_score": 9.2,
        "rank": 1,
        "urgency": "critical",
        "assignee": "user-002",
        "source_platform": "email",
        "explanation": "Critical production issue affecting 500+ users..."
      }
    ]
  }
}
```

---

## Tasks

### GET `/tasks`

List all MasterTasks with optional filtering.

**Query params:**
- `source` — filter by source platform
- `urgency` — filter by urgency level
- `status` — filter by task status

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "tasks": [
      {
        "id": "...",
        "title": "Fix login bug",
        "description": "...",
        "task_type": "bug",
        "is_hidden": false,
        "assignee": "user-002",
        "deadline": "2026-09-10",
        "urgency": "high",
        "confidence": 0.85,
        "source_platform": "github"
      }
    ]
  }
}
```

---

### GET `/tasks/{task_id}`

Get a single task with full details including quality report and priority score.

**Response:**
```json
{
  "success": true,
  "data": {
    "task": { "id": "...", "title": "...", ... },
    "quality": { "overall_score": 78.5, "actionability": "actionable", ... },
    "priority": { "overall_score": 8.5, "rank": 3, "explanation": "..." },
    "sources": [
      { "source": "github", "title": "...", "timestamp": "..." }
    ]
  }
}
```

---

### POST `/tasks/{task_id}/status`

Update a task's status.

**Request body:**
```json
{
  "status": "completed"
}
```

---

## Daily Planning

### POST `/daily-plan`

Generate a daily plan for a specific date.

**Request body:**
```json
{
  "user_id": "user-001",
  "date": "2026-09-05",
  "buffer_hours": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan_date": "2026-09-05",
    "available_hours": 5.5,
    "planned_hours": 5.0,
    "load_status": "healthy",
    "time_slots": [
      {
        "start_time": "09:00",
        "end_time": "09:30",
        "slot_type": "meeting",
        "title": "Daily Standup"
      },
      {
        "start_time": "09:30",
        "end_time": "10:30",
        "slot_type": "task",
        "title": "Fix payment gateway timeout",
        "priority_level": "critical"
      }
    ],
    "recommendations": ["Consider deferring low-priority tasks"],
    "overflow_tasks": []
  }
}
```

---

### GET `/daily-plan/{date}`

Get the existing plan for a date.

---

### GET `/daily-plans`

List all generated daily plans.

---

### GET `/planner/calendar`

Get calendar events for planning.

---

### GET `/planner/day/{date}`

Get the full day view with tasks and meetings.

---

## Chat

### POST `/chat`

Send a message to the AI copilot or trigger P1 injection.

**Request body:**
```json
{
  "message": "What's my top priority today?",
  "context": "optional file content or context"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Your top priority today is **Fix payment gateway timeout** (Score: 9.2, Rank: #1). This is a critical production issue affecting 500+ users...",
    "sources": ["github", "email"]
  }
}
```

**P1 Injection:** Send a message like `"inject a P1 defect - payment gateway timeout"` and the system will:
1. Extract task details via LLM
2. Create a new source event
3. Auto-run the full pipeline
4. Return the new priority rank

---

## System

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "config": {
    "groq_configured": true,
    "llm_providers_available": true
  },
  "llm_diagnostics": []
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "User-friendly hint about what went wrong",
  "data": {
    "error": "Technical error details",
    "llm_diagnostics": [...]
  }
}
```

**Common errors:**
| Status | Cause |
|:---:|:---|
| 400 | Invalid request body |
| 404 | Resource not found |
| 429 | Rate limit (Groq TPM) |
| 500 | Internal server error |

---

## Rate Limits

Groq free tier limits:
- **8,000 tokens per minute (TPM)**
- Circuit breaker opens after 2 consecutive failures
- Auto-recovers after 60 seconds
