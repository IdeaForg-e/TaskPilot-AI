"""
Unit tests for daily_planner.py

Run with:
    pytest test_daily_planner.py -v
"""

from datetime import date, time

import pytest

from daily_planner import (
    build_daily_plan,
    render_plan_as_text,
    _band_for_score,
    SCORE_BAND_CRITICAL,
    SCORE_BAND_IMPORTANT,
)


def make_prioritize_output(tasks: list[dict]) -> dict:
    """Builds a fake prioritize() output shape for isolated planner testing -
    doesn't depend on prioritization_engine actually running."""
    return {
        "ranked_tasks": tasks,
        "unprocessable_items": [],
        "weights_used": {"severity": 0.40, "deadline": 0.35, "dependency": 0.25},
    }


def fake_task(task_id, title, score, confidence="high"):
    return {
        "task_id": task_id,
        "title": title,
        "priority_score": score,
        "component_scores": {"severity": 0.5, "deadline": 0.5, "dependency": 0.5},
        "fallbacks_applied": [],
        "source_refs": [f"jira:{task_id}"],
        "rationale": f"Test rationale for {task_id}.",
        "data_quality": {"confidence_score": 1.0, "confidence_label": confidence, "fields_defaulted": 0},
    }


# ---------------------------------------------------------------------------
# Band classification
# ---------------------------------------------------------------------------

def test_score_band_critical():
    assert _band_for_score(SCORE_BAND_CRITICAL) == "Critical / Do First"
    assert _band_for_score(100) == "Critical / Do First"


def test_score_band_important():
    assert _band_for_score(SCORE_BAND_IMPORTANT) == "Important / Do Today"
    assert _band_for_score(SCORE_BAND_CRITICAL - 0.01) == "Important / Do Today"


def test_score_band_if_time_allows():
    assert _band_for_score(0) == "If Time Allows"
    assert _band_for_score(SCORE_BAND_IMPORTANT - 0.01) == "If Time Allows"


# ---------------------------------------------------------------------------
# build_daily_plan
# ---------------------------------------------------------------------------

def test_empty_ranked_tasks_produces_empty_plan():
    output = make_prioritize_output([])
    plan = build_daily_plan(output, plan_date=date(2026, 6, 22))
    assert plan["summary"]["total_tasks_scheduled"] == 0
    assert all(len(v) == 0 for v in plan["schedule"].values())


def test_tasks_grouped_into_correct_bands():
    tasks = [
        fake_task("A", "critical task", 90),
        fake_task("B", "important task", 60),
        fake_task("C", "low priority task", 10),
    ]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)

    assert plan["schedule"]["Critical / Do First"][0]["task_id"] == "A"
    assert plan["schedule"]["Important / Do Today"][0]["task_id"] == "B"
    assert plan["schedule"]["If Time Allows"][0]["task_id"] == "C"


def test_rank_order_preserved_within_band():
    tasks = [fake_task("A", "x", 95), fake_task("B", "y", 80)]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)
    critical = plan["schedule"]["Critical / Do First"]
    assert [t["task_id"] for t in critical] == ["A", "B"]


def test_low_confidence_task_is_flagged():
    tasks = [fake_task("A", "x", 50, confidence="low")]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)
    item = plan["schedule"]["Important / Do Today"][0]
    assert item["flagged_low_confidence"] is True
    assert len(plan["low_confidence_warnings"]) == 1


def test_high_confidence_task_is_not_flagged():
    tasks = [fake_task("A", "x", 50, confidence="high")]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)
    item = plan["schedule"]["Important / Do Today"][0]
    assert item["flagged_low_confidence"] is False
    assert plan["low_confidence_warnings"] == []


def test_tasks_beyond_max_go_to_backlog_not_dropped():
    tasks = [fake_task(f"T{i}", f"task {i}", 100 - i) for i in range(12)]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output, max_tasks=8)

    total_scheduled = sum(len(v) for v in plan["schedule"].values())
    assert total_scheduled == 8
    assert len(plan["backlog"]) == 4
    # Nothing fabricated or lost - every task_id accounted for
    scheduled_ids = {t["task_id"] for band in plan["schedule"].values() for t in band}
    backlog_ids = {t["task_id"] for t in plan["backlog"]}
    assert scheduled_ids | backlog_ids == {f"T{i}" for i in range(12)}


def test_time_slots_are_sequential_and_non_overlapping():
    tasks = [fake_task("A", "x", 90), fake_task("B", "y", 85), fake_task("C", "z", 80)]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output, workday_start=time(9, 0), block_minutes=30)
    items = plan["schedule"]["Critical / Do First"]
    assert items[0]["suggested_start"] == "9:00 AM"
    assert items[0]["suggested_end"] == "9:30 AM"
    assert items[1]["suggested_start"] == "9:30 AM"
    assert items[1]["suggested_end"] == "10:00 AM"
    assert items[2]["suggested_start"] == "10:00 AM"


def test_plan_date_defaults_to_today_when_not_specified():
    output = make_prioritize_output([fake_task("A", "x", 90)])
    plan = build_daily_plan(output)
    assert plan["plan_date"] == date.today().isoformat()


def test_plan_date_uses_provided_date():
    output = make_prioritize_output([fake_task("A", "x", 90)])
    plan = build_daily_plan(output, plan_date=date(2026, 12, 25))
    assert plan["plan_date"] == "2026-12-25"


def test_grounding_no_fabricated_task_ids_in_output():
    """Every task_id appearing anywhere in the plan must trace back to the
    input ranked_tasks list - nothing invented."""
    tasks = [fake_task("REAL-1", "x", 90), fake_task("REAL-2", "y", 40)]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)

    input_ids = {t["task_id"] for t in tasks}
    output_ids = {t["task_id"] for band in plan["schedule"].values() for t in band}
    output_ids |= {t["task_id"] for t in plan["backlog"]}
    assert output_ids.issubset(input_ids)


# ---------------------------------------------------------------------------
# render_plan_as_text
# ---------------------------------------------------------------------------

def test_render_plan_as_text_includes_task_titles():
    tasks = [fake_task("A", "Fix login bug", 90)]
    output = make_prioritize_output(tasks)
    plan = build_daily_plan(output)
    text = render_plan_as_text(plan)
    assert "Fix login bug" in text
    assert "A" in text


def test_render_plan_as_text_handles_empty_plan_without_error():
    output = make_prioritize_output([])
    plan = build_daily_plan(output)
    text = render_plan_as_text(plan)
    assert isinstance(text, str)
