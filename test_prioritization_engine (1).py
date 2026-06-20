"""
Unit tests for prioritization_engine.py

Run with:
    pytest test_prioritization_engine.py -v
"""

from datetime import date, timedelta

import pytest

from prioritization_engine import (
    RawTask,
    prioritize,
    score_severity,
    score_deadline,
    score_dependency,
    WEIGHTS,
    DEFAULT_SEVERITY_SCORE,
    DEFAULT_DEADLINE_SCORE,
    DEFAULT_DEPENDENCY_SCORE,
    OVERDUE_SCORE_FLOOR,
)


TODAY = date(2026, 6, 19)


# ---------------------------------------------------------------------------
# Severity scoring
# ---------------------------------------------------------------------------

def test_severity_p1_scores_full():
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity="P1")
    score, fb = score_severity(t)
    assert score == 1.0
    assert fb == []


def test_severity_unspecified_falls_back():
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity=None)
    score, fb = score_severity(t)
    assert score == DEFAULT_SEVERITY_SCORE
    assert "unspecified" in fb[0]


def test_severity_unrecognized_label_degrades_gracefully():
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity="banana")
    score, fb = score_severity(t)
    assert score == DEFAULT_SEVERITY_SCORE
    assert "unrecognized" in fb[0]


def test_severity_business_impact_keyword_boosts_score():
    t = RawTask(
        task_id="A", title="x", source_refs=["s"], severity="P3",
        description="Escalated by VP of Engineering",
    )
    score, fb = score_severity(t)
    assert score == pytest.approx(0.55)  # 0.40 + 0.15 boost
    assert any("boost" in f for f in fb)


def test_severity_boost_is_capped_at_one():
    t = RawTask(
        task_id="A", title="x", source_refs=["s"], severity="P1",
        description="VP customer escalation SLA breach",
    )
    score, _ = score_severity(t)
    assert score == 1.0  # capped, not 1.15


# ---------------------------------------------------------------------------
# Deadline scoring
# ---------------------------------------------------------------------------

def test_deadline_no_date_falls_back():
    t = RawTask(task_id="A", title="x", source_refs=["s"], due_date=None)
    score, fb = score_deadline(t, today=TODAY)
    assert score == DEFAULT_DEADLINE_SCORE
    assert "unspecified" in fb[0]


def test_deadline_due_today_scores_high():
    t = RawTask(task_id="A", title="x", source_refs=["s"], due_date=TODAY)
    score, _ = score_deadline(t, today=TODAY)
    assert score == 1.0  # 1 / (1 + 0)


def test_deadline_overdue_is_floored_not_unbounded():
    t = RawTask(task_id="A", title="x", source_refs=["s"], due_date=TODAY - timedelta(days=10))
    score, fb = score_deadline(t, today=TODAY)
    assert score == OVERDUE_SCORE_FLOOR
    assert "overdue" in fb[0]


def test_deadline_far_future_scores_low():
    t = RawTask(task_id="A", title="x", source_refs=["s"], due_date=TODAY + timedelta(days=30))
    score, _ = score_deadline(t, today=TODAY)
    assert score < 0.05


# ---------------------------------------------------------------------------
# Dependency scoring
# ---------------------------------------------------------------------------

def test_dependency_none_specified_falls_back():
    t = RawTask(task_id="A", title="x", source_refs=["s"], blocking_count=None)
    score, fb = score_dependency(t)
    assert score == DEFAULT_DEPENDENCY_SCORE
    assert "none detected" in fb[0]


def test_dependency_caps_at_three_blocking():
    t = RawTask(task_id="A", title="x", source_refs=["s"], blocking_count=10)
    score, _ = score_dependency(t)
    assert score == 1.0  # capped, not 3.33


def test_dependency_zero_blocking_scores_zero():
    t = RawTask(task_id="A", title="x", source_refs=["s"], blocking_count=0)
    score, _ = score_dependency(t)
    assert score == 0.0


# ---------------------------------------------------------------------------
# End-to-end ranking behavior
# ---------------------------------------------------------------------------

def test_higher_severity_outranks_lower_when_other_factors_equal():
    tasks = [
        RawTask(task_id="LOW", title="x", source_refs=["s"], severity="P4",
                due_date=TODAY, blocking_count=0),
        RawTask(task_id="HIGH", title="x", source_refs=["s"], severity="P1",
                due_date=TODAY, blocking_count=0),
    ]
    result = prioritize(tasks, today=TODAY)
    assert result["ranked_tasks"][0]["task_id"] == "HIGH"


def test_weights_sum_to_one():
    assert sum(WEIGHTS.values()) == pytest.approx(1.0)


def test_missing_task_id_is_excluded_not_fabricated():
    tasks = [
        RawTask(task_id="", title="ghost task", source_refs=[]),
        RawTask(task_id="REAL-1", title="real task", source_refs=["jira:REAL-1"], severity="P2"),
    ]
    result = prioritize(tasks, today=TODAY)
    ranked_ids = [t["task_id"] for t in result["ranked_tasks"]]
    assert "" not in ranked_ids
    assert len(result["unprocessable_items"]) == 1
    assert result["unprocessable_items"][0]["reason"] == "excluded: missing source traceability"


def test_every_ranked_task_has_source_refs():
    """Grounding requirement: nothing in ranked_tasks should lack traceability."""
    tasks = [
        RawTask(task_id="A", title="x", source_refs=["jira:A"], severity="P2"),
        RawTask(task_id="B", title="y", source_refs=["email:msg-1", "jira:B"], severity="P1"),
    ]
    result = prioritize(tasks, today=TODAY)
    for t in result["ranked_tasks"]:
        assert len(t["source_refs"]) > 0


def test_rank_numbers_are_sequential_and_unique():
    tasks = [
        RawTask(task_id=f"T{i}", title="x", source_refs=[f"s{i}"], severity="P3",
                due_date=TODAY, blocking_count=i)
        for i in range(5)
    ]
    result = prioritize(tasks, today=TODAY)
    ranks = [t["rank"] for t in result["ranked_tasks"]]
    assert ranks == sorted(ranks)
    assert ranks == list(range(1, len(tasks) + 1))


def test_fallback_tags_are_visible_when_applied():
    t = RawTask(task_id="A", title="x", source_refs=["s"])  # nothing specified
    result = prioritize([t], today=TODAY)
    fallbacks = result["ranked_tasks"][0]["fallbacks_applied"]
    assert any("severity" in f for f in fallbacks)
    assert any("deadline" in f for f in fallbacks)


def test_priority_score_is_within_0_to_100():
    tasks = [
        RawTask(task_id="A", title="x", source_refs=["s"], severity="P1",
                due_date=TODAY, blocking_count=10),
        RawTask(task_id="B", title="y", source_refs=["s"], severity="P4",
                due_date=TODAY + timedelta(days=365), blocking_count=0),
    ]
    result = prioritize(tasks, today=TODAY)
    for t in result["ranked_tasks"]:
        assert 0 <= t["priority_score"] <= 100


def test_empty_input_returns_empty_output_not_error():
    result = prioritize([], today=TODAY)
    assert result["ranked_tasks"] == []
    assert result["unprocessable_items"] == []


# ---------------------------------------------------------------------------
# Data quality / confidence scoring
# ---------------------------------------------------------------------------

def test_fully_specified_task_gets_high_confidence():
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity="P2",
                due_date=TODAY, blocking_count=1)
    result = prioritize([t], today=TODAY)
    dq = result["ranked_tasks"][0]["data_quality"]
    assert dq["confidence_label"] == "high"
    assert dq["fields_defaulted"] == 0


def test_fully_unspecified_task_gets_very_low_confidence():
    t = RawTask(task_id="A", title="x", source_refs=["s"])  # nothing set
    result = prioritize([t], today=TODAY)
    dq = result["ranked_tasks"][0]["data_quality"]
    assert dq["confidence_label"] == "very_low"
    assert dq["fields_defaulted"] == 3


def test_one_missing_field_gets_medium_confidence():
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity="P2",
                due_date=TODAY, blocking_count=None)  # only dependency missing
    result = prioritize([t], today=TODAY)
    dq = result["ranked_tasks"][0]["data_quality"]
    assert dq["fields_defaulted"] == 1
    assert dq["confidence_label"] == "medium"


def test_business_impact_boost_does_not_count_against_quality():
    """A boost reflects *extra* signal found, not missing data - confidence
    should stay high even though a 'fallback' tag is technically present."""
    t = RawTask(task_id="A", title="x", source_refs=["s"], severity="P3",
                due_date=TODAY, blocking_count=1,
                description="Escalated by VP")
    result = prioritize([t], today=TODAY)
    dq = result["ranked_tasks"][0]["data_quality"]
    assert dq["fields_defaulted"] == 0
    assert dq["confidence_label"] == "high"
