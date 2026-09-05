# TaskPilot AI — Agent Deep-Dive

This document explains the internals of each agent in the TaskPilot AI multi-agent pipeline.

---

## Overview

TaskPilot AI uses **8 specialized agents** working in a sequential pipeline:

```
Agent 0: Orchestrator (controller)
  ↓ triggers
Agent 1: Ingestion → Agent 2: Extraction → Agent 3: Fusion → Agent 4: Quality → Agent 5: Prioritization → Agent 6: Planning
Agent 7: Chat (standalone, reads from DB)
```

Each agent:
- Has a single responsibility
- Communicates through the shared SQLite database
- Uses LLM for complex decisions, with deterministic fallbacks
- Runs in < 5 seconds (total pipeline ~20 seconds)

---

## Agent 0 — Orchestrator

**Role:** Central pipeline workflow coordinator and self-healing execution manager.

**File:** `backend/app/services/agent_0_orchestrator_service.py`

### Responsibilities
- Triggers the 6 sequential pipeline stages in order
- Tracks execution state in `WorkflowRun` table (running → completed/failed)
- Detects stale runs (stuck > 5 minutes) and marks them as failed
- Collects LLM diagnostics (latency, token usage)
- Runs in a background thread so the API responds immediately

### Pipeline Execution Flow
```
1. Create WorkflowRun record (status=running)
2. IngestionAgent.run()      → SourceEvents
3. ExtractionService.extract_all() → TaskCandidates
4. FusionService.fuse_all()  → MasterTasks
5. QualityService.evaluate() → QualityReports
6. PrioritizationService.run() → PriorityScores
7. PlanningService.generate() → DailyPlan + TimeSlots
8. Update WorkflowRun (status=completed)
```

### Key Features
- **Stale Run Recovery:** On startup, scans for runs stuck in `running` status for > 5 minutes and transitions them to `failed`
- **LLM Diagnostics:** Tracks per-request latency and provider success/failure rates
- **System Accuracy:** Computes average quality score across all evaluated tasks

---

## Agent 1 — Ingestion

**Role:** Bulk parser and normalizer for heterogeneous developer data.

**File:** `backend/app/services/agent_1_ingestion_service.py`

### Data Sources
| Source | File | Records | Content |
|:---|:---|:---:|:---|
| GitHub | `github_data.json` | 9 | Issues, pull requests |
| Slack | `slack_data.json` | 15 | Channel messages, threads |
| Email | `emails.json` | 6 | Inbox threads, escalations |
| Calendar | `calendar.json` | 10 | Meeting schedule |
| Meetings | `meeting_notes.json` | 8 | Transcripts, action items |

### Process
1. Clears all downstream tables (TaskCandidates, MasterTasks, etc.)
2. Reads each JSON file
3. Maps raw payloads to `SourceEvent` schema:
   - `source`: platform name (github/slack/email/calendar/meeting)
   - `source_id`: unique identifier from the source
   - `event_type`: category (issue/message/email/meeting)
   - `title`, `content`, `author`, `timestamp`
   - `metadata_json`: full raw payload
4. Inserts all events into the database

### Design Decisions
- **Clear on every run:** Prevents stale data from contaminating results
- **No LLM needed:** Pure JSON parsing, instant execution
- **Preserves raw metadata:** Enables traceability back to original source

---

## Agent 2 — Extraction

**Role:** Hidden task extractor and candidate task parser.

**File:** `backend/agents/agent_2_extraction_agent.py` + `backend/app/services/agent_2_extraction_service.py`

### Two Extraction Modes

#### Explicit Extraction (GitHub, Jira)
- Direct mapping of structured records
- Title, description, assignee, priority mapped directly
- Task type inferred from labels/type fields
- **No LLM needed** for most cases

#### Hidden Extraction (Email, Meeting, Slack)
- Finds implied action items in unstructured text
- Uses LLM with few-shot prompts for emails and meetings
- Uses regex heuristics for Slack (fast, zero token cost)

### Extraction Process

```
For each SourceEvent:
  1. If source is GitHub/Jira → extract_explicit_task() [deterministic]
  2. If source is Email/Meeting → extract_hidden_tasks() [LLM with few-shot prompts]
  3. If source is Slack → extract_hidden_tasks() [regex only, no LLM]
  4. Validate with TaskValidator
  5. Filter by confidence >= 0.65
  6. Create TaskCandidate record
```

### Few-Shot Prompts

**Email prompt** (`EMAIL_HIDDEN_TASK_PROMPT`):
- 3 examples: customer escalation, security advisory, FYI with hidden action
- Teaches model to find action items in email threads

**Meeting prompt** (`MEETING_HIDDEN_TASK_PROMPT`):
- 2 examples: standup action items, sprint planning decisions
- Teaches model to extract commitments from meeting notes

**Generic prompt** (`HIDDEN_TASK_PROMPT`):
- Source-agnostic, works for any unstructured text
- Lists action markers, urgency signals, and output format

### Validation Layer

**File:** `backend/agents/agent_2_validation.py`

Post-extraction validation:
- **Noise filtering:** Removes tasks that are too short, vague, or generic
- **Duplicate detection:** Identical titles within the same source
- **Field normalization:** Ensures urgency is valid, confidence is present
- **Statistics:** Tracks filtered/deduplicated counts per source

### Calibrated Confidence

Confidence scores are calculated based on evidence strength:

| Factor | Boost |
|:---|:---|
| Has assignee | +0.12 |
| Has deadline | +0.10 |
| Has urgency signal | +0.08 |
| Text > 100 chars | +0.03 |
| Has context (subject) | +0.02 |
| Meeting source | base 0.70 |
| Email source | base 0.62 |
| Slack source | base 0.55 |

---

## Agent 3 — Fusion

**Role:** Semantic deduplicator and cross-platform context aggregator.

**File:** `backend/agents/agent_3_fusion_agent.py` + `backend/app/services/agent_3_fusion_service.py`

### Deduplication Algorithm

For each candidate against every existing cluster:

```
1. Compute string similarity (SequenceMatcher)
2. Compute token overlap (Jaccard)
3. Compute description similarity
4. Apply contextual adjustments:
   - Different assignee → -0.10
   - Different platform → -0.02
   - Different deadline → -0.08
5. Apply boost for strong title match:
   - ratio > 0.85 → +0.10
   - ratio > 0.75 → +0.05
6. If confidence > 0.55 → mark as duplicate
7. Merge into existing cluster
```

### Performance Optimizations

- **No LLM calls:** Pure string matching, completes in ~3 seconds
- **No embedding model:** Removed for speed (was taking 30+ seconds)
- **Early exit:** If confidence < 0.55, skip further processing

### Cluster Merging

When duplicates are found:
1. Longer title becomes the merged title
2. Descriptions are combined with source attribution
3. TaskContextLink records maintain traceability to original sources
4. Urgency is set to the maximum of all merged candidates

### Output
- Creates `MasterTask` records (one per cluster)
- Creates `TaskContextLink` records (traceability)

---

## Agent 4 — Quality

**Role:** Completeness auditor and actionability classifier.

**File:** `backend/agents/agent_4_quality_agent.py` + `backend/app/services/agent_4_quality_service.py`

### 7-Dimension QA Score

Each MasterTask is scored on 7 criteria (0-100):

| Dimension | What It Measures |
|:---|:---|
| **Clear Title** | Is the title specific and descriptive? |
| **Reproduction Steps** | Are there steps to reproduce (for bugs)? |
| **Error Logs** | Are error logs attached (for bugs)? |
| **Environment** | Is the target environment specified? |
| **Expected Behavior** | Is expected vs actual behavior clear? |
| **Severity** | Is urgency/severity properly classified? |
| **Assignee** | Is there an assigned owner? |

### Cost-Optimized Flow

```
For each MasterTask:
  1. If NOT critical → use heuristic scoring (0 tokens)
  2. If critical → call LLM for deeper analysis
```

**Heuristic scoring** uses keyword matching:
- Title > 30 chars → clear_title = 85
- Contains "steps to reproduce" → reproduction = 80
- Contains "stack trace" → error_logs = 85
- Contains "production" → environment = 80

### Actionability Classification

| Score | Classification |
|:---:|:---|
| >= 55 | `actionable` |
| < 55 | `needs_info` |
| Contains "blocked" | `blocked` |

### Clarification Questions

For `needs_info` tasks, generates context-aware questions:
- Missing environment for database timeout → "Is this in Production or Staging?"
- Missing SSL domain → "Which endpoint is expiring?"
- Missing assignee → "Who should take ownership?"

---

## Agent 5 — Prioritization

**Role:** Multi-factor priority evaluator and rank scheduler.

**File:** `backend/agents/agent_5_prioritization_agent.py` + `backend/app/services/agent_5_prioritization_service.py`

### 7-Factor Weighted Scoring

| Factor | Weight | What It Measures |
|:---|:---:|:---|
| Technical Severity | 24% | Bug severity, incident level, security |
| Production Outage Risk | 18% | Production/staging mentions, outage keywords |
| User/Customer Impact | 16% | Customer mentions, user count, escalation |
| SLA/Deadline Proximity | 12% | Due date proximity, overdue status |
| Blocker Status | 10% | "blocked", "blocker", "waiting" keywords |
| Business Impact | 10% | Revenue, compliance, security mentions |
| Quality Score | 10% | From Agent 4 quality evaluation |

### Anti-Noise Modifiers

| Modifier | Multiplier | Condition |
|:---|:---:|:---|
| Vague title demotion | 0.55x | Title < 12 characters |
| Admin task demotion | 0.72x | Retro, demo, standup, report keywords |

### Explainability

For each task, generates:
- **Numerical scores** for each factor
- **Ranked reason tags** (e.g., `["production_outage", "high_severity"]`)
- **Narrative explanation** (human-readable paragraph)

### Output
- `PriorityScore` records with `rank` (1 = highest priority)
- Explanation text for each task

---

## Agent 6 — Planning

**Role:** Calendar-aware scheduler and workload balancer.

**File:** `backend/agents/agent_6_planning_agent.py` + `backend/app/services/agent_6_planning_service.py`

### Planning Process

```
1. Fetch calendar events for the date → lock as meeting slots
2. Calculate available hours: 8h - meetings - buffer
3. Get top 12 prioritized tasks (by PriorityScore rank)
4. Generate time slots:
   - Meetings: locked, protected
   - Tasks: filled in priority order
   - Breaks: auto-injected decompression breaks
5. Detect overflow: if tasks exceed available hours
```

### Calendar Protection

- Meetings from `calendar.json` are treated as locked slots
- Tasks are only placed in free time windows
- Buffer time (default 1 hour) is reserved for overflows

### Decompression Breaks

Auto-injected between deep focus blocks:
- "Mid-Morning Coffee Break" (10 min)
- "Afternoon Decompression Break" (15 min)

### Load Status

| Status | Condition |
|:---|:---|
| `healthy` | All tasks fit within available hours |
| `moderate` | 80-100% capacity used |
| `overloaded` | Tasks overflow available hours |

---

## Agent 7 — Chat

**Role:** Natural language copilot and P1 injection interface.

**File:** `backend/app/routers/router_8_chat.py`

### Context Injection

The chat system injects real-time data from the database:
- Current task list (top 20 by priority)
- Today's schedule (if plan exists)
- Priority leaderboard (top 10)
- Developer workload summary

### P1 Injection Flow

When user sends "inject a P1 defect...":

```
1. LLM extracts task details (title, description, urgency)
2. Create raw source event in appropriate JSON file
3. Auto-run full pipeline
4. Query new priority score
5. Return: "Task ranked #X with score Y.Z"
```

### File Attachment

Users can attach files via the paperclip icon:
1. Browser reads file content via HTML5 FileReader
2. Content truncated to 3,000 characters
3. Appended to chat message in code blocks
4. LLM answers questions about the file content

---

## LLM Client

**File:** `backend/agents/llm_client.py`

### Provider Configuration

| Provider | Model (Fast) | Model (Reasoning) |
|:---|:---|:---|
| **Groq** | `openai/gpt-oss-20b` | `openai/gpt-oss-120b` |

### Circuit Breaker Pattern

- Opens after 2 consecutive failures
- Cools down for 60 seconds
- Half-open: allows 1 retry request
- Prevents cascading failures

### Rate Limit Handling

- Detects 429 (Too Many Requests) responses
- Waits 1 second, then retries once
- Falls back to deterministic algorithms if all retries fail

### JSON Parsing

The `parse_json()` function handles common LLM output issues:
- Strips `<think>` reasoning tags
- Extracts JSON from markdown code blocks
- Repairs truncated JSON (unclosed strings/objects)
- Fixes unquoted keys and trailing commas
- Strips leading/trailing junk characters

---

## Prompt Templates

All prompts are in `backend/agents/prompts/`:

| File | Agent | Purpose |
|:---|:---|:---|
| `agent_2_extraction_prompts.py` | Extraction | Hidden task extraction with few-shot examples |
| `agent_3_fusion_prompts.py` | Fusion | Duplicate verification (currently unused) |
| `agent_4_quality_prompts.py` | Quality | Critical task quality analysis |
| `agent_5_prioritization_prompts.py` | Prioritization | Batch priority scoring |
| `agent_6_planning_prompts.py` | Planning | Daily schedule generation |

### Prompt Design Principles

1. **Few-shot examples:** 2-3 real-world examples per prompt
2. **Output format enforcement:** "Return ONLY valid JSON"
3. **Role definition:** "You are TaskPilot AI's [specific role]"
4. **Reasoning procedure:** Step-by-step instructions done privately
5. **Constraints:** "Do not invent owners, deadlines, or incidents"
