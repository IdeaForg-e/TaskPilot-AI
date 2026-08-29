<p align="center">
  <img src="docs/images/banner.png" alt="TaskPilot AI Banner" width="100%" />
</p>

<h1 align="center">🚀 TaskPilot AI</h1>

<p align="center">
  <strong>Your Personal AI Chief of Staff — an Autonomous Multi-Agent System that turns engineering noise into a ranked, scheduled, explainable workday.</strong>
</p>

<p align="center">
  🏆 <strong>National Top 6 Finalist — DELL FutureMind AI Hackathon</strong> 🏆<br/>
  <em>Built by Team <strong>IdeaForg-E</strong></em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge" alt="Groq" /></a>
</p>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [System Architecture](#-system-architecture)
- [The Multi-Agent Pipeline](#-the-multi-agent-pipeline)
- [Engineering Highlights](#-engineering-highlights)
- [Frontend Dashboard](#-frontend-dashboard)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Demo Walkthrough](#-demo-walkthrough-judge-mode)
- [Design Decisions & Trade-offs](#-design-decisions--trade-offs)
- [Roadmap](#-roadmap)
- [Team IdeaForg-E](#-team-ideaforg-e)

---

## 🔥 The Problem

Modern software engineers are **drowning in context fragmentation**. Work arrives from GitHub, Gmail, Slack threads, calendar invites, and meeting notes — there is no single pane of glass, and the most important work is often the least visible.

| Pain Point | Impact |
|:---|:---|
| 🔀 **Source Fragmentation** | Engineers juggle 4–7 tools daily; no unified view of *actual* workload |
| 👻 **Invisible Task Debt** | Action items buried in emails & chat are never tracked — ~35% of real work goes unplanned |
| 🎯 **Priority Blindness** | Engineers optimize locally ("loudest first"), not globally — critical work slips |
| 🧠 **Context Switching Tax** | Every switch costs ~23 minutes of focus; mornings are burned on triage, not building |
| 📧 **Triage Burden** | 45+ min/day spent manually scanning emails, threads, and meeting notes |

> **The result?** Engineers spend their first 45 minutes each morning just figuring out *what to work on*. A P1 production issue buried in a Friday email isn't discovered until Monday.

---

## 💡 Our Solution

**TaskPilot AI** is an autonomous multi-agent pipeline that acts as a **personal chief of staff** for every engineer:

1. **Ingests** work signals from **5 real-world sources** — 📧 Gmail, 🐙 GitHub, �� Slack, 📅 Calendar, 🗒 Meeting Notes
2. **Extracts** explicit tasks *and* recovers **hidden action items** from unstructured text using LLM-powered NLP
3. **Fuses** duplicate signals about the same real-world work into a single master task (email + PR + meeting mention → one task)
4. **Audits quality** of every task and generates the exact clarification questions needed to make it actionable
5. **Prioritizes** with an 8-factor, explainable scoring model (severity, production impact, customer impact, deadline, blockers, business impact, dependencies, quality)
6. **Plans** a calendar-aware daily schedule with focus blocks, buffers, and overflow detection
7. **Converses** — inject a P1 incident in plain English and watch the entire system re-rank and re-plan in seconds

```text
┌──────────────────────────────────────────────────────────────────────┐
│  RAW NOISE IN                          DECISION-READY WORK OUT       │
│                                                                      │
│  📧 Gmail        ┐                                                   │
│  🐙 GitHub       │   ┌─────────────────────────────┐   ✅ Ranked     │
│  💬 Slack        ├──▶│  6-Agent Autonomous Pipeline │──▶    Task List  │
│  📅 Calendar     │   │  Ingest → Extract → Fuse →   │   📊 Quality     │
│  🗒 Meetings     ┘   │  Quality → Prioritize → Plan  │   Audit         │
│                      └─────────────────────────────┘   📅 Daily      │
│                                          ▲                Schedule   │
│                                    💬 Chat: "Inject a P1!"           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🏗 System Architecture

```text
                            ┌─────────────────────────┐
                            │   React 18 + Vite SPA   │
                            │  Dashboard │ Priority   │
                            │  Planner │ Quality │Chat │
                            └───────────┬─────────────┘
                                        │ REST (JSON)
                            ┌───────────▼─────────────┐
                            │      FastAPI Backend     │
                            │  9 Routers / APIResponse │
                            ├──────────────────────────┤
                            │  Orchestrator Service    │
                            │  (WorkflowRun tracking,  │
                            │   stale-run watchdog)    │
                            ├──────┬──────┬──────┬─────┤
                            │ A1   │ A2   │ A3   │ ... │   Six agent services
                            ├──────┴──────┴──────┴─────┤
                            │      LLM Client Layer     │
                            │  Groq (primary)           │
                            │  NVIDIA NIM (fallback)    │
                            │  Deterministic fallback   │
                            │  Circuit breaker + cache  │
                            ├───────────────────────────┤
                            │  SQLAlchemy ORM           │
                            │  SQLite (WAL mode)        │
                            └───────────────────────────┘
```

**Reliability in one glance:** if Groq fails → NVIDIA takes over → if both fail, every agent has a deterministic rules-based fallback so the demo *never* dies. A circuit breaker (2 failures → 60 s cooldown → auto-retry) stops transient rate-limit storms from cascading.

---

## 🤖 The Multi-Agent Pipeline

| # | Agent | Role | Key Techniques |
|:--|:------|:-----|:---------------|
| 0 | **Orchestrator** | Sequences the pipeline, tracks `WorkflowRun`, 5-minute stale-run watchdog, supports **full** and **incremental** execution modes | Run ledger, background tasks |
| 1 | **Ingestion** | Normalizes 5 sources into a unified `SourceEvent` schema with ISO-8601 timestamps | Per-source content adapters, idempotent incremental ingestion (source+source_id dedup) |
| 2 | **Extraction** | Direct mapping for structured sources (GitHub); parallel LLM extraction of hidden tasks from Gmail/Slack/Meetings | ThreadPoolExecutor (4 workers), 30+ action-verb detection, atomic line/bullet/sentence splitting, evidence-scaled confidence (0.55–0.95), per-event dedup, urgency calibration (critical/high/medium) |
| 3 | **Fusion** | Merges signals about the same real-world work into `MasterTask` records | Composite similarity = 45% title ratio + 35% token overlap + 20% description similarity, adaptive confidence thresholds (assignee/platform/deadline penalties), persistent pairwise cache |
| 4 | **Quality** | Audits each task across 7 dimensions (clear title, repro steps, error logs, environment, expected behavior, severity, ownership) and generates **clarification questions** | Evidence-based scoring (high scores require specific proof), context-aware question generation |
| 5 | **Prioritization** | 8-factor weighted score → global leaderboard with explainable rationale | `severity(24%) + production(18%) + customer(16%) + deadline(12%) + blocker(10%) + business(10%) + quality(10%)`, blocker boost, vague-title demotion, workload-overload detection |
| 6 | **Planning** | Generates a calendar-aware daily schedule: meetings protected, focus blocks, breaks, overflow list | LLM plans **validated against hard constraints** (no meeting overlap, capacity respected) before acceptance — invalid plans fall back to a deterministic greedy scheduler |

### Incremental Pipeline ⚡

Chat-triggered injections no longer wipe the world. The orchestrator supports two modes:

- **Full run** — clean rebuild: ingest everything → extract everything → fuse → score → plan
- **Incremental run** — ingest *only new* events (matched by source + source_id), extract *only events without candidates*, then re-fuse/re-rank on top of existing context

```text
Full run:          42 events ingested → 51 tasks extracted
Incremental (+1):   1 event ingested  →  1 task extracted   (42 skipped)
```

---

## 🛠 Engineering Highlights

- 🛡 **SQLite WAL concurrency mode** — parallel reads never block writes during threaded agent execution
- 🔌 **Circuit breaker LLM client** — 2 consecutive failures open the circuit; 60 s cooldown; half-open auto-retry. Providers self-heal instead of being banned for the run
- 🧬 **Resilient JSON parsing** — strips `<think>` reasoning tags, repairs unquoted keys / single quotes / trailing commas, handles markdown-fenced output
- 🚦 **Plan guardrails** — LLM-generated schedules are rejected if they overlap meetings or exceed available hours; a deterministic scheduler guarantees a valid plan
- 📉 **Honest fallback scoring** — when the LLM is unreachable, quality scores are *evidence-based* (a high repro score requires actual reproduction steps), never inflated
- 🚨 **Workload radar** — flags developers carrying >3 active tasks and surfaces it as a system diagnostic
- 🔎 **Explainable everything** — every priority score ships with per-factor sub-scores, human-readable reasons, and a full explanation paragraph
- 🧾 **Structured `APIResponse` envelope** + LLM diagnostics attached to every error for instant debuggability

---

## 🖥 Frontend Dashboard

| Page | What it shows |
|:-----|:--------------|
| **Dashboard** | Live pipeline status with animated agent states, system accuracy gauge, LLM latency diagnostics, notifications, one-click `.txt` health report |
| **Tasks** | Unified task list across all 5 sources with search, status/assignee/source filters, per-task provenance ("merged 3 signals from Email + GitHub + Slack") |
| **Quality** | Actionable vs Needs-Info tabs, per-dimension score breakdowns, AI-generated clarification questions |
| **Priority** | Interactive leaderboard — clickable cards, rank badges, per-factor scoring breakdown modal with AI explanations |
| **Planner** | Calendar-aware day view: meetings, focus blocks, buffers, overflow tasks, priority agenda |
| **Chat** | Natural-language assistant — query your workload or inject a P1 and trigger a live incremental re-rank |

🌗 Dark/light theme with OS-level `prefers-color-scheme` sync.

---

## 💻 Tech Stack

**Backend** — Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, SQLite (WAL), httpx, Groq SDK
**LLMs** — Groq (fast + reasoning models) with NVIDIA NIM fallback; fully deterministic offline mode
**Frontend** — React 18, Vite 5, Tailwind CSS 4, React Router 6, Lucide icons, react-markdown
**Infra** — Vercel (frontend), Render (backend), Git/GitHub

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com)) — optional; the system runs in deterministic fallback mode without it

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# Configure LLM keys (optional)
copy .env.example .env           # then edit: GROQ_API_KEY=gsk_...

uvicorn app.main:app --reload
```

Backend live at `http://localhost:8000` · interactive docs at `/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard live at `http://localhost:5173`

### Run the pipeline

```bash
curl -X POST http://localhost:8000/api/v1/orchestrate/run
# then poll:
curl http://localhost:8000/api/v1/orchestrate/latest
```

Or just click **Run Pipeline** on the dashboard.

---

## 📡 API Reference

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/v1/orchestrate/run` | Start the full pipeline (background) |
| `GET` | `/api/v1/orchestrate/status/{run_id}` | Poll a specific run |
| `GET` | `/api/v1/orchestrate/latest` | Latest run + system accuracy + latency |
| `POST` | `/api/v1/ingest` | Ingest demo data (5 sources, incremental-capable) |
| `POST` | `/api/v1/extract` | Extract explicit + hidden tasks |
| `POST` | `/api/v1/fuse` | Fuse duplicate signals into master tasks |
| `POST` | `/api/v1/quality/evaluate` | Run quality audit |
| `POST` | `/api/v1/prioritize` | Score & rank all tasks |
| `POST` | `/api/v1/daily-plan` | Generate the daily schedule |
| `GET` | `/api/v1/tasks` | Unified task list (filters: status, assignee, source) |
| `GET` | `/api/v1/tasks/ranked` | Priority leaderboard |
| `GET` | `/api/v1/planner/calendar` | Planner calendar view |
| `POST` | `/api/v1/chat` | Conversational assistant + P1 injection |
| `GET` | `/health` | Config & LLM diagnostics |

All responses use a consistent envelope: `{ success, data, message }`.

---

## 🎬 Demo Walkthrough (Judge Mode)

1. **Dashboard** → hit **Run Pipeline** and watch all 6 agents light up sequentially with live status
2. **Tasks** → see the unified list across Gmail, GitHub, Slack, Calendar, and Meetings; open a fused task and inspect its multi-source provenance
3. **Quality** → toggle *Needs Info* and read the AI-generated clarification questions for vague tickets
4. **Priority** → open the #1 task — inspect the 8-factor breakdown and the explanation paragraph
5. **Planner** → see focus blocks scheduled around fixed meetings, with overflow tasks listed
6. **The killer moment** 💬 → type in Chat: *"We have a P1 production outage, payment service is down"* — watch the event get ingested, the pipeline re-run **incrementally**, and the new task land at rank #1 with a re-planned schedule

---

## ⚖️ Design Decisions & Trade-offs

| Decision | Why | Trade-off we accept |
|:---------|:----|:--------------------|
| **Full re-runs by default** | Guarantees globally consistent rankings | Slower; mitigated by the incremental path for injections |
| **Deterministic fallbacks everywhere** | Demo must never die, even offline | Fallback output is simpler than LLM output; clearly flagged in diagnostics |
| **Fusion tuned precision-first** | Merging two *distinct* tasks is worse than leaving a duplicate | Rare duplicates may survive; threshold is a single, documented knob |
| **SQLite over Postgres** | Zero-config hackathon portability, WAL gives real concurrency | Not multi-region; documented upgrade path |
| **Full-context chat injection** | Precise answers at demo scale | Won't scale to 10k+ tasks — roadmap: retrieval + tool-calling |
| **Honest "accuracy" metric** | The QA gauge is a *task-completeness* score, not model accuracy | Real evaluation harness (golden dataset) is on the roadmap |

---

## 🗺 Roadmap

- [ ] **Auth & multi-tenancy** — JWT + per-user data isolation (currently single-tenant demo)
- [ ] **Live connectors** — real Gmail/GitHub/Slack OAuth integrations replacing demo JSON
- [ ] **Vector retrieval** — pgvector/Chroma-backed chat grounding instead of full-context injection
- [ ] **Golden-dataset evaluation harness** — precision/recall metrics for extraction & fusion
- [ ] **Agent memory** — cross-run learning of team-specific prioritization preferences
- [ ] **Streaming chat** — token-streamed responses with tool-calling

---

## 👥 Team IdeaForg-E

| Member | Role |
|:-------|:-----|
| **ANIL** | Multi-agent architecture, backend pipeline, LLM orchestration |
| *<add teammates — names & roles>* | Frontend dashboard, UX, deployment |

---

## 🙌 Acknowledgments

Built for the **DELL FutureMind AI Hackathon** — proudly finished as a **National Top 6 team**. Thanks to Dell and the hackathon mentors for the challenge that pushed this system from idea to reality.

---

<p align="center">
  <em>TaskPilot AI — stop triaging, start building.</em> ⚡
</p>
