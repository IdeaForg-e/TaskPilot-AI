"""
TaskPilot AI - Prioritization & Planning Specialist
=====================================================
Deterministic, auditable multi-dimensional scoring engine.

Scoring weights (fixed, non-negotiable per spec):
    Severity / Business Impact : 40%
    Deadline Proximity         : 35%
    Dependency Status          : 25%

Design principle: the RANK is always computed by pure math, never by an LLM.
An LLM may only be used downstream to phrase the `rationale` string using the
already-computed component scores as grounding facts (see `generate_rationale`
docstring) - it never invents or adjusts a score.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

WEIGHTS = {
    "severity": 0.40,
    "deadline": 0.35,
    "dependency": 0.25,
}

SEVERITY_SCORE_MAP = {
    "P1": 1.00, "CRITICAL": 1.00, "SEV-1": 1.00, "SEV1": 1.00,
    "P2": 0.70, "HIGH": 0.70, "SEV-2": 0.70, "SEV2": 0.70,
    "P3": 0.40, "MEDIUM": 0.40, "SEV-3": 0.40, "SEV3": 0.40,
    "P4": 0.15, "LOW": 0.15, "SEV-4": 0.15, "SEV4": 0.15,
}

BUSINESS_IMPACT_KEYWORDS = (
    "vp", "customer escalation", "sla breach", "exec", "production down",
    "outage", "data loss", "security incident",
)

# Fallback defaults - applied only when a field is genuinely absent.
# Never invented per-task; always the same documented constant, and always
# tagged in `fallbacks_applied` so it is visible downstream.
DEFAULT_SEVERITY_SCORE = SEVERITY_SCORE_MAP["P3"]      # 0.40 - "assumed Medium"
DEFAULT_DEADLINE_SCORE = 0.30                          # "assumed this week"
DEFAULT_DEPENDENCY_SCORE = 0.00                        # "no known blockers"

MAX_BLOCKING_FOR_FULL_SCORE = 3   # blocking_count >= 3 -> dependency_score = 1.0
OVERDUE_SCORE_FLOOR = 0.95        # overdue tasks don't get an "infinite" score
BUSINESS_IMPACT_BOOST = 0.15      # additive boost, capped at 1.0

# Data-quality confidence: how much of a task's score rests on real fields
# vs fallback assumptions. Each of the 3 dimensions (severity/deadline/
# dependency) contributes equally; a fallback on a dimension costs it points.
QUALITY_FIELD_WEIGHT = 1 / 3
QUALITY_LABELS = (
    (0.99, "high"),    # all 3 fields present and recognized
    (0.65, "medium"),  # 1 field missing/unrecognized
    (0.30, "low"),     # 2 fields missing/unrecognized
    (0.00, "very_low"),  # all 3 fields missing/unrecognized
)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class RawTask:
    """Input contract: a single deduplicated task as handed off by the
    Deduplication stage. Fields beyond task_id/title are optional - missing
    optional fields trigger documented fallback logic, never fabrication."""
    task_id: str
    title: str
    source_refs: list[str] = field(default_factory=list)
    severity: Optional[str] = None
    due_date: Optional[date] = None
    blocking_count: Optional[int] = None
    description: str = ""


@dataclass
class ScoredTask:
    rank: int
    task_id: str
    title: str
    priority_score: float
    component_scores: dict[str, float]
    fallbacks_applied: list[str]
    source_refs: list[str]
    rationale: str
    data_quality: dict[str, Any]


# ---------------------------------------------------------------------------
# Component scoring functions
# ---------------------------------------------------------------------------

def score_severity(task: RawTask) -> tuple[float, list[str]]:
    """Returns (score, fallback_tags)."""
    fallbacks: list[str] = []

    if not task.severity:
        score = DEFAULT_SEVERITY_SCORE
        fallbacks.append("severity: assumed Medium (unspecified)")
    else:
        key = task.severity.strip().upper()
        score = SEVERITY_SCORE_MAP.get(key)
        if score is None:
            # Unrecognized label - degrade gracefully rather than crash/fabricate.
            score = DEFAULT_SEVERITY_SCORE
            fallbacks.append(f"severity: unrecognized value '{task.severity}', assumed Medium")

    haystack = f"{task.title} {task.description}".lower()
    if any(kw in haystack for kw in BUSINESS_IMPACT_KEYWORDS):
        score = min(score + BUSINESS_IMPACT_BOOST, 1.0)
        fallbacks.append("severity: +0.15 business-impact keyword boost applied")

    return round(score, 4), fallbacks


def score_deadline(task: RawTask, today: Optional[date] = None) -> tuple[float, list[str]]:
    fallbacks: list[str] = []
    today = today or date.today()

    if task.due_date is None:
        fallbacks.append("deadline: assumed (unspecified)")
        return DEFAULT_DEADLINE_SCORE, fallbacks

    days_until_due = (task.due_date - today).days

    if days_until_due < 0:
        score = OVERDUE_SCORE_FLOOR
        fallbacks.append(f"deadline: overdue by {-days_until_due} day(s)")
    else:
        score = 1 / (1 + days_until_due)

    return round(score, 4), fallbacks


def score_dependency(task: RawTask) -> tuple[float, list[str]]:
    fallbacks: list[str] = []

    if task.blocking_count is None:
        fallbacks.append("dependencies: none detected")
        return DEFAULT_DEPENDENCY_SCORE, fallbacks

    score = min(task.blocking_count / MAX_BLOCKING_FOR_FULL_SCORE, 1.0)
    return round(score, 4), fallbacks


# ---------------------------------------------------------------------------
# Data quality / confidence scoring
# ---------------------------------------------------------------------------

def compute_data_quality(fallback_count: int) -> dict[str, Any]:
    """
    Translates how many of the 3 scoring dimensions relied on a fallback
    default into a human-readable confidence label. This is surfaced
    separately from priority_score so a low-confidence #1 ranking is
    visibly flagged rather than silently presented with the same weight
    as a fully-grounded #1 ranking.
    """
    # fallback_count is 0-3 (severity/deadline/dependency each contribute
    # at most one "missing/unrecognized" fallback to this count; the
    # business-impact-boost fallback tag does NOT count against quality,
    # since it reflects extra signal found, not missing data).
    confidence = max(1.0 - (fallback_count * QUALITY_FIELD_WEIGHT), 0.0)
    confidence = round(confidence, 2)

    label = "very_low"
    for threshold, name in QUALITY_LABELS:
        if confidence >= threshold - 0.01:  # tolerate float rounding
            label = name
            break

    return {
        "confidence_score": confidence,
        "confidence_label": label,
        "fields_defaulted": fallback_count,
    }


# ---------------------------------------------------------------------------
# Rationale generation (template-based, grounded - no LLM call required;
# swap `generate_rationale` for an LLM call if richer phrasing is desired,
# but ALWAYS pass only the computed component_scores as context - the model
# must never be allowed to re-derive or adjust the underlying numbers.)
# ---------------------------------------------------------------------------

def generate_rationale(task: RawTask, components: dict[str, float], total: float) -> str:
    parts: list[str] = []

    if components["severity"] >= 0.85:
        parts.append("critical P1 severity")
    elif components["severity"] >= 0.55:
        parts.append("high business impact")
    elif components["severity"] >= 0.30:
        parts.append("moderate severity")
    else:
        parts.append("low severity")

    if components["deadline"] >= 0.85:
        parts.append("deadline expiring within a day")
    elif components["deadline"] >= 0.40:
        parts.append("deadline approaching soon")
    elif components["deadline"] > DEFAULT_DEADLINE_SCORE:
        parts.append("deadline within the week")
    else:
        parts.append("no immediate deadline pressure")

    if components["dependency"] >= 0.67:
        parts.append("blocking multiple teammates")
    elif components["dependency"] >= 0.33:
        parts.append("blocking at least one teammate")

    sentence = ", ".join(parts)
    return f"{sentence[0].upper()}{sentence[1:]} (priority score: {round(total, 1)}/100)."


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def prioritize(
    tasks: list[RawTask],
    today: Optional[date] = None,
) -> dict[str, Any]:
    """
    Scores and ranks a deduplicated list of RawTask objects.

    Tasks missing `task_id` or all `source_refs` are NOT scored - they are
    routed to `unprocessable_items` instead, per the grounding requirement
    that every output item must trace back to source data.
    """
    scorable: list[RawTask] = []
    unprocessable: list[dict[str, Any]] = []

    for t in tasks:
        if not t.task_id or not t.source_refs:
            unprocessable.append({
                "raw_input": {"task_id": t.task_id, "title": t.title},
                "reason": "excluded: missing source traceability",
            })
            continue
        scorable.append(t)

    scored: list[ScoredTask] = []

    for t in scorable:
        sev_score, sev_fb = score_severity(t)
        dl_score, dl_fb = score_deadline(t, today=today)
        dep_score, dep_fb = score_dependency(t)

        components = {
            "severity": sev_score,
            "deadline": dl_score,
            "dependency": dep_score,
        }

        total = (
            WEIGHTS["severity"] * sev_score
            + WEIGHTS["deadline"] * dl_score
            + WEIGHTS["dependency"] * dep_score
        ) * 100  # scale to 0-100

        fallbacks_applied = sev_fb + dl_fb + dep_fb
        rationale = generate_rationale(t, components, total)

        # Count only "missing/unrecognized data" fallbacks toward quality -
        # the business-impact boost tag is extra signal found, not a gap.
        missing_field_count = sum(
            1 for fb_list in (sev_fb, dl_fb, dep_fb)
            if any("boost" not in f for f in fb_list) and fb_list
        )
        data_quality = compute_data_quality(missing_field_count)

        scored.append(ScoredTask(
            rank=0,  # assigned after sort
            task_id=t.task_id,
            title=t.title,
            priority_score=round(total, 2),
            component_scores=components,
            fallbacks_applied=fallbacks_applied,
            source_refs=t.source_refs,
            rationale=rationale,
            data_quality=data_quality,
        ))

    # Sort descending by score; stable tie-break on task_id for reproducibility.
    scored.sort(key=lambda s: (-s.priority_score, s.task_id))
    for i, s in enumerate(scored, start=1):
        s.rank = i

    return {
        "ranked_tasks": [
            {
                "rank": s.rank,
                "task_id": s.task_id,
                "title": s.title,
                "priority_score": s.priority_score,
                "component_scores": s.component_scores,
                "fallbacks_applied": s.fallbacks_applied,
                "source_refs": s.source_refs,
                "rationale": s.rationale,
                "data_quality": s.data_quality,
            }
            for s in scored
        ],
        "unprocessable_items": unprocessable,
        "weights_used": WEIGHTS,
    }


# ---------------------------------------------------------------------------
# Example usage / smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    sample_tasks = [
        RawTask(
            task_id="JIRA-1234",
            title="Upload endpoint failing for enterprise customers",
            source_refs=["jira:JIRA-1234", "email:msg-042"],
            severity="P1",
            due_date=date.today(),
            blocking_count=2,
            description="Customer escalation from VP of Engineering at client.",
        ),
        RawTask(
            task_id="JIRA-1240",
            title="Refactor logging utility",
            source_refs=["jira:JIRA-1240"],
            severity="P3",
            due_date=date(date.today().year, 12, 31),
            blocking_count=0,
        ),
        RawTask(
            task_id="SNOW-998",
            title="Investigate intermittent 500 errors",
            source_refs=["servicenow:SNOW-998"],
            severity=None,         # triggers severity fallback
            due_date=None,         # triggers deadline fallback
            blocking_count=1,
        ),
        RawTask(
            task_id="",            # missing ID -> unprocessable
            title="Untraceable item scraped from chat",
            source_refs=[],
        ),
    ]

    result = prioritize(sample_tasks)
    print(json.dumps(result, indent=2))
