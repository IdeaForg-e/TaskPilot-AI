# TaskPilot AI — Prioritization & Planning Module

This folder contains the **Prioritization & Planning Specialist** component of
TaskPilot AI: a deterministic, auditable scoring engine that ranks deduplicated
tasks and turns the ranking into a structured daily plan.

It is built to be a **standalone, independently testable unit** — it has no
dependency on the Ingestion, Extraction, or Dedup agents. Any code that
produces data matching the `RawTask` contract (see below) can plug straight in.

---

## Files

| File | Purpose |
|---|---|
| `prioritization_engine.py` | Core scoring engine. Computes weighted priority scores, applies fallback logic for missing data, generates per-task rationale strings and a data-quality/confidence score. **This is the only file that decides rank order.** |
| `daily_planner.py` | Pure presentation layer. Takes the ranked output of `prioritization_engine.py` and groups it into a time-blocked daily plan (Critical / Important / If Time Allows), with low-confidence flagging. Does not re-score anything. |
| `agent_adapter.py` | Translation layer between upstream agents (Ingestion/Dedup) and this module. Converts plain dicts/JSON from other teammates' code into `RawTask` objects. Edit this file, not the engine, if upstream field names change. |
| `langgraph_node.py` | Wraps `prioritize()` + `build_daily_plan()` as a LangGraph-compatible node function (`prioritization_node(state) -> state`), plus a commented wiring sketch showing where it sits in the overall agent graph. |
| `test_prioritization_engine.py` | Unit tests for scoring math, fallback logic, ranking order, and grounding/traceability rules. |
| `test_daily_planner.py` | Unit tests for plan grouping, time-slot generation, backlog handling, and confidence flagging. |

---

## Quick Start

```bash
# Install test dependencies
pip install pytest --break-system-packages

# Run everything
pytest -v

# Run a manual smoke test (prints sample ranked output)
python3 prioritization_engine.py

# Run a manual smoke test of the daily plan (prints plan + readable text version)
python3 daily_planner.py

# Run the adapter end-to-end with fake upstream data
python3 agent_adapter.py
```

All 39 unit tests should pass. If they don't after a change, **don't ship the
change** — see "Pre-flight check" below.

---

## The `RawTask` Contract

This is the only thing other agents need to know to integrate with this module.

```python
RawTask(
    task_id: str,                    # required — source system ID, e.g. "JIRA-1234"
    title: str,                      # required
    source_refs: list[str],          # required — e.g. ["jira:JIRA-1234", "email:msg-042"]
    severity: Optional[str] = None,  # "P1" / "P2" / "P3" / "P4" or None
    due_date: Optional[date] = None,
    blocking_count: Optional[int] = None,
    description: str = "",
)
```

If the Dedup Agent emits plain dicts/JSON instead, use `agent_adapter.py`:

```python
from agent_adapter import dedup_output_to_raw_tasks
from prioritization_engine import prioritize
from daily_planner import build_daily_plan

raw_tasks = dedup_output_to_raw_tasks(dedup_agent_output)   # list[dict] -> list[RawTask]
prioritized = prioritize(raw_tasks)                          # ranked output
plan = build_daily_plan(prioritized)                         # daily plan
```

---

## Scoring Formula

```
priority_score = (0.40 × severity_score) + (0.35 × deadline_score) + (0.25 × dependency_score)
```

| Dimension | Weight | Notes |
|---|---|---|
| Severity / Business Impact | 40% | P1=1.0, P2=0.7, P3=0.4, P4=0.15; +0.15 boost for VP/customer-escalation/SLA keywords, capped at 1.0 |
| Deadline Proximity | 35% | `1 / (1 + days_until_due)`; overdue tasks floor at 0.95 |
| Dependency Status | 25% | `min(blocking_count / 3, 1.0)` |

Missing fields use documented fallback defaults (never fabricated) and are
tagged in `fallbacks_applied` plus reflected in `data_quality.confidence_label`
(`high` / `medium` / `low` / `very_low`).

---

## Output Format

```json
{
  "ranked_tasks": [
    {
      "rank": 1,
      "task_id": "JIRA-1234",
      "title": "...",
      "priority_score": 91.67,
      "component_scores": { "severity": 1.0, "deadline": 1.0, "dependency": 0.67 },
      "fallbacks_applied": [],
      "source_refs": ["jira:JIRA-1234", "email:msg-042"],
      "rationale": "Critical P1 severity, deadline expiring within a day, blocking 2 teammates.",
      "data_quality": { "confidence_score": 1.0, "confidence_label": "high", "fields_defaulted": 0 }
    }
  ],
  "unprocessable_items": [],
  "weights_used": { "severity": 0.40, "deadline": 0.35, "dependency": 0.25 }
}
```

Tasks missing `task_id` or `source_refs` are routed to `unprocessable_items`,
never silently dropped or fabricated — this is required for the grounding
guarantee.

---

## Integration Options

**Plain function calls (fastest, no framework):**
```python
prioritized = prioritize(raw_tasks)
plan = build_daily_plan(prioritized)
```

**LangGraph node:**
```python
from langgraph_node import prioritization_node
graph.add_node("prioritize", prioritization_node)
graph.add_edge("dedup", "prioritize")
```
See the commented wiring sketch at the bottom of `langgraph_node.py` for the
full graph layout (Ingest → Extract → Dedup → **Prioritize** → Converse).

---

## Pre-Flight Check (run before every demo rehearsal)

Once real seed data exists, assert the known demo facts hold after any
prompt/weight/seed-data change:

```python
result = prioritize(real_seed_tasks, today=demo_date)
top_3_ids = [t["task_id"] for t in result["ranked_tasks"][:3]]
assert "JIRA-1234" in top_3_ids, "Known P1 defect must be in top 3!"
assert len(result["unprocessable_items"]) == 0, "No demo task should be dropped"
```

---

## Design Principles

- **Rank is always deterministic math** — never decided by an LLM, so it's
  reproducible and auditable.
- **Rationale is grounded** — generated from the already-computed component
  scores, never invented justification.
- **Nothing is fabricated** — missing data uses documented fallback defaults
  only, always tagged; untraceable items are excluded and listed, not dropped.
- **Daily planning is presentation-only** — it groups and schedules, it does
  not re-score or re-rank anything.
