"""
TaskPilot AI - Daily Planning Module
=====================================
Takes the `ranked_tasks` output of prioritization_engine.prioritize() and
turns it into a structured, time-blocked daily plan (the "Monday morning"
deliverable referenced in the demo scenario).

Design principle: this module does NOT re-score or re-rank anything. It is
a pure presentation/grouping layer over already-computed priority scores -
keeping the actual ranking logic in one auditable place (prioritization_engine).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Confidence labels below this are flagged in the plan so the reader knows
# a task's position rests partly on default assumptions, not full data.
LOW_CONFIDENCE_LABELS = ("low", "very_low")

# Score bands used to bucket tasks into named blocks of the day.
# (Tunable - these are reasonable hackathon-demo defaults.)
SCORE_BAND_CRITICAL = 75    # >= this score -> "Critical / Do First"
SCORE_BAND_IMPORTANT = 45   # >= this score -> "Important / Do Today"
# below SCORE_BAND_IMPORTANT -> "If Time Allows"

DEFAULT_WORKDAY_START = time(9, 0)
DEFAULT_BLOCK_MINUTES = 60  # default time allotted per task if not specified
MAX_TASKS_PER_PLAN = 8      # keep the demo plan readable; rest go to a backlog list


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class PlanBlock:
    task_id: str
    title: str
    priority_score: float
    rationale: str
    confidence_label: str
    suggested_start: str   # "09:00 AM"
    suggested_end: str     # "10:00 AM"
    flagged_low_confidence: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _band_for_score(score: float) -> str:
    if score >= SCORE_BAND_CRITICAL:
        return "Critical / Do First"
    if score >= SCORE_BAND_IMPORTANT:
        return "Important / Do Today"
    return "If Time Allows"


def _format_time(t: time) -> str:
    return t.strftime("%I:%M %p").lstrip("0")


def _add_minutes(t: time, minutes: int) -> time:
    dt = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return dt.time()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def build_daily_plan(
    prioritize_output: dict[str, Any],
    plan_date: Optional[date] = None,
    workday_start: time = DEFAULT_WORKDAY_START,
    block_minutes: int = DEFAULT_BLOCK_MINUTES,
    max_tasks: int = MAX_TASKS_PER_PLAN,
) -> dict[str, Any]:
    """
    Converts the output of prioritization_engine.prioritize() into a
    structured daily plan, grouped into named blocks and laid out across
    sequential time slots starting at `workday_start`.

    Grounding note: every task in the plan carries its `task_id` and
    `rationale` straight through from the prioritizer - nothing here is
    invented. Tasks beyond `max_tasks` are listed in `backlog`, not dropped.
    """
    plan_date = plan_date or date.today()
    ranked_tasks = prioritize_output.get("ranked_tasks", [])

    scheduled = ranked_tasks[:max_tasks]
    backlog = ranked_tasks[max_tasks:]

    blocks: list[PlanBlock] = []
    cursor = workday_start

    for t in scheduled:
        start = cursor
        end = _add_minutes(cursor, block_minutes)
        cursor = end

        confidence_label = t.get("data_quality", {}).get("confidence_label", "unknown")

        blocks.append(PlanBlock(
            task_id=t["task_id"],
            title=t["title"],
            priority_score=t["priority_score"],
            rationale=t["rationale"],
            confidence_label=confidence_label,
            suggested_start=_format_time(start),
            suggested_end=_format_time(end),
            flagged_low_confidence=confidence_label in LOW_CONFIDENCE_LABELS,
        ))

    # Group into named bands for the UI, preserving rank order within each.
    grouped: dict[str, list[dict[str, Any]]] = {
        "Critical / Do First": [],
        "Important / Do Today": [],
        "If Time Allows": [],
    }
    for b in blocks:
        band = _band_for_score(b.priority_score)
        grouped[band].append({
            "task_id": b.task_id,
            "title": b.title,
            "priority_score": b.priority_score,
            "rationale": b.rationale,
            "confidence_label": b.confidence_label,
            "flagged_low_confidence": b.flagged_low_confidence,
            "suggested_start": b.suggested_start,
            "suggested_end": b.suggested_end,
        })

    low_confidence_warnings = [
        f"{b.task_id} ({b.title}) is ranked using partially assumed data - "
        f"confidence: {b.confidence_label}"
        for b in blocks if b.flagged_low_confidence
    ]

    return {
        "plan_date": plan_date.isoformat(),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "schedule": grouped,
        "backlog": [
            {"task_id": t["task_id"], "title": t["title"], "priority_score": t["priority_score"]}
            for t in backlog
        ],
        "low_confidence_warnings": low_confidence_warnings,
        "summary": {
            "total_tasks_scheduled": len(blocks),
            "total_tasks_in_backlog": len(backlog),
            "critical_count": len(grouped["Critical / Do First"]),
        },
    }


def render_plan_as_text(plan: dict[str, Any]) -> str:
    """Human-readable plain-text rendering, e.g. for a Streamlit text block
    or console output during a live demo."""
    lines: list[str] = []
    lines.append(f"Daily Plan - {plan['plan_date']}")
    lines.append("=" * 40)

    for band, items in plan["schedule"].items():
        if not items:
            continue
        lines.append(f"\n## {band}")
        for item in items:
            flag = "  ⚠ low-confidence ranking" if item["flagged_low_confidence"] else ""
            lines.append(
                f"- [{item['suggested_start']}-{item['suggested_end']}] "
                f"{item['task_id']}: {item['title']} "
                f"(score: {item['priority_score']}){flag}"
            )
            lines.append(f"    why: {item['rationale']}")

    if plan["backlog"]:
        lines.append("\n## Backlog (not scheduled today)")
        for item in plan["backlog"]:
            lines.append(f"- {item['task_id']}: {item['title']} (score: {item['priority_score']})")

    if plan["low_confidence_warnings"]:
        lines.append("\n## Data Quality Warnings")
        for w in plan["low_confidence_warnings"]:
            lines.append(f"- {w}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Example usage / smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json
    from datetime import date, timedelta
    from prioritization_engine import RawTask, prioritize

    sample_tasks = [
        RawTask(
            task_id="JIRA-1234",
            title="Upload endpoint failing for enterprise customers",
            source_refs=["jira:JIRA-1234", "email:msg-042"],
            severity="P1",
            due_date=date.today(),
            blocking_count=2,
            description="Customer escalation from VP of Engineering.",
        ),
        RawTask(
            task_id="JIRA-1240",
            title="Refactor logging utility",
            source_refs=["jira:JIRA-1240"],
            severity="P3",
            due_date=date.today() + timedelta(days=30),
            blocking_count=0,
        ),
        RawTask(
            task_id="SNOW-998",
            title="Investigate intermittent 500 errors",
            source_refs=["servicenow:SNOW-998"],
            severity=None,
            due_date=None,
            blocking_count=1,
        ),
    ]

    prioritized = prioritize(sample_tasks)
    plan = build_daily_plan(prioritized)

    print(json.dumps(plan, indent=2))
    print("\n" + "=" * 60 + "\n")
    print(render_plan_as_text(plan))
