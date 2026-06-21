from agents.llm_client import LLMClient
from agents.prompts.agent_5_prioritization_prompts import BATCH_PRIORITY_PROMPT
import json
import logging


# Extensible factor registry for dynamic priority_reason generation.
# Add a tuple to extend with a new scoring factor — no other code changes needed.
# (score_key, threshold, label_fn)
FACTOR_RULES = [
    ("severity_score", 8.0, lambda v: f"High severity ({v}/10)"),
    ("production_impact_score", 8.0, lambda v: f"Critical production impact ({v}/10)"),
    ("customer_impact_score", 8.0, lambda v: f"High customer impact ({v}/10)"),
    ("blocker_score", 8.0, lambda v: f"Contains blockers ({v}/10)"),
    ("deadline_score", 8.0, lambda v: f"Deadline urgency ({v}/10)"),
    ("dependency_score", 7.0, lambda v: f"High dependency/complexity ({v}/10)"),
    ("business_impact_score", 8.0, lambda v: f"High business impact ({v}/10)"),
]


def build_priority_reasons(scores: dict, task: dict) -> list[str]:
    """
    Build a human-readable priority_reason list purely from numeric scoring
    inputs and task metadata. Never hardcoded per-task text — works
    identically whether scores came from the LLM or the local fallback.
    """
    reasons: list[str] = []

    if task.get("task_type") in ("incident", "security"):
        reasons.append(f"Classified as {task.get('task_type')} (elevated priority)")

    for key, threshold, label_fn in FACTOR_RULES:
        value = scores.get(key)
        if value is not None and value >= threshold:
            reasons.append(label_fn(round(value, 1)))

    source_count = task.get("source_count") or 1
    if source_count > 1:
        reasons.append(f"Reported by {source_count} merged signals")

    if task.get("deadline"):
        reasons.append(f"Deadline: {task.get('deadline')}")

    if not reasons:
        reasons.append("Standard backlog priority; no critical signals detected")

    return reasons


def build_explanation_paragraph(scores: dict, task: dict, overall: float, title_quality_multiplier: float, is_reporting_work: bool) -> str:
    explanation_reasons = []
    
    if task.get("task_type") in ("incident", "security"):
        explanation_reasons.append(f"being classified as a critical {task.get('task_type')} issue")
        
    for key, threshold, label_fn in FACTOR_RULES:
        value = scores.get(key)
        if value is not None and value >= threshold:
            if key == "severity_score":
                explanation_reasons.append(f"its elevated technical severity ({round(value, 1)}/10)")
            elif key == "production_impact_score":
                explanation_reasons.append("high risk of production outage or infrastructure impact")
            elif key == "customer_impact_score":
                explanation_reasons.append("direct customer-facing degradation and user complaints")
            elif key == "blocker_score":
                explanation_reasons.append("blocking critical team pipelines or engineering dependencies")
            elif key == "deadline_score":
                explanation_reasons.append("an urgent approaching deadline")
            elif key == "dependency_score":
                explanation_reasons.append("high complexity and multiple system integration dependencies")
            elif key == "business_impact_score":
                explanation_reasons.append("significant business operations and service delivery impact")
                
    source_count = task.get("source_count") or 1
    if source_count > 1:
        explanation_reasons.append(f"combining {source_count} distinct event signals")
        
    demotions = []
    if title_quality_multiplier < 1.0:
        demotions.append("vague title formatting")
    if is_reporting_work and task.get("task_type") == "request":
        demotions.append("administrative/reporting task classification")
        
    if not explanation_reasons:
        explanation_reasons.append("standard backlog processing checks")
        
    if len(explanation_reasons) > 1:
        reasons_phrasing = ", ".join(explanation_reasons[:-1]) + f", and {explanation_reasons[-1]}"
    else:
        reasons_phrasing = explanation_reasons[0]
        
    paragraph = f"This task is prioritized with a score of {overall}/10 due to {reasons_phrasing}."
    
    if demotions:
        demotion_phrasing = " and ".join(demotions)
        paragraph += f" Note that the priority score was adjusted downward due to {demotion_phrasing}."
    else:
        paragraph += " Resolving this task promptly will mitigate operational risks and address critical bottlenecks."
        
    return paragraph


class PrioritizationAgent:
    def __init__(self):
        self.llm = LLMClient(reasoning=False)

    def score_batch(self, tasks: list[dict], quality_scores: dict) -> dict[str, dict]:
        logger = logging.getLogger("taskpilot.prioritization_agent")
        task_by_id = {t.get("id"): t for t in tasks}

        # 1. Pre-calculate all fallbacks and filter critical tasks
        fallbacks = {}
        critical_tasks = []
        results = {}

        for task in tasks:
            t_id = task.get("id")
            q_score = quality_scores.get(t_id, 50.0)
            fb = self._fallback(task, q_score)
            fallbacks[t_id] = fb

            if self._is_critical(task, fb):
                critical_tasks.append(task)
            else:
                results[t_id] = fb

        if not critical_tasks:
            logger.info("No critical tasks found for LLM scoring. Using local fallbacks for all tasks.")
            return results

        logger.info(f"Prioritization Agent selected {len(critical_tasks)} / {len(tasks)} critical tasks for LLM scoring.")

        # 2. Group critical tasks into batches of 8 tasks
        batch_size = 8
        for i in range(0, len(critical_tasks), batch_size):
            batch = critical_tasks[i:i + batch_size]
            batch_tasks_data = []
            batch_fallbacks = {}

            for t in batch:
                t_id = t.get("id")
                q_score = quality_scores.get(t_id, 50.0)
                batch_tasks_data.append({
                    "id": t_id,
                    "title": t.get("title", ""),
                    "description": (t.get("description") or "")[:150],  # truncate aggressively to save input tokens
                    "urgency": t.get("urgency", "") or "normal",
                    "deadline": t.get("deadline", "") or "none",
                    "source_count": t.get("source_count") or 1,
                    "task_type": t.get("task_type", "task"),
                    "quality_score": q_score
                })
                batch_fallbacks[t_id] = fallbacks[t_id]

            tasks_json = json.dumps(batch_tasks_data, indent=2)
            prompt = BATCH_PRIORITY_PROMPT.format(tasks_json=tasks_json)

            # Wrap the fallback structure matching the BATCH prompt response schema
            wrapped_fallback = {"scores": batch_fallbacks}

            logger.info(f"Prioritization Agent sending batch of {len(batch)} tasks to LLM...")
            try:
                llm_response = self.llm.complete_json(prompt, fallback=wrapped_fallback, temperature=0.1)
                if isinstance(llm_response, dict) and "scores" in llm_response:
                    scores_dict = llm_response["scores"]
                    for t in batch:
                        t_id = t.get("id")
                        if t_id in scores_dict and isinstance(scores_dict[t_id], dict) and "overall_score" in scores_dict[t_id]:
                            result = scores_dict[t_id]
                            # priority_reason is always regenerated locally from the actual
                            # numeric scores so it can never drift from the data or be hallucinated.
                            result["priority_reason"] = build_priority_reasons(result, task_by_id[t_id])
                            results[t_id] = result
                        else:
                            # If a specific task is missing in the LLM dictionary, use its fallback
                            logger.warning(f"Task ID {t_id} missing or invalid in LLM response scores. Using local fallback.")
                            results[t_id] = fallbacks[t_id]
                else:
                    logger.warning("LLM response failed to conform to scores schema. Using local fallbacks for this batch.")
                    for t in batch:
                        t_id = t.get("id")
                        results[t_id] = fallbacks[t_id]
            except Exception as e:
                logger.error(f"Error during batch prioritization LLM call: {e}. Using local fallbacks for this batch.")
                for t in batch:
                    t_id = t.get("id")
                    results[t_id] = fallbacks[t_id]
        return results

    def _fallback(self, task: dict, quality_score: float) -> dict:
        title = task.get("title", "") or ""
        text = f"{title} {task.get('description', '')}".lower()
        urgency_map = {"critical": 9.5, "high": 8.0, "medium": 5.5, "low": 3.0}
        severity = urgency_map.get((task.get("urgency") or "").lower(), 5.0)
        if task.get("task_type") in ("incident", "security"):
            severity = max(severity, 8.5)
        if any(w in text for w in ("p0", "critical", "cvss", "certificate", "expires", "outage")):
            severity = max(severity, 9.0)
        is_reporting_work = any(
            w in text
            for w in (
                "management report",
                "summary by",
                "sprint retrospective",
                "sprint 24 review",
                "roadmap review",
                "coordinate your demos",
            )
        )
        production = 10 if any(w in text for w in ("production", "outage", "incident", "customer")) else 4
        customer = 9 if any(w in text for w in ("customer", "enterprise", "acme", "globaltech", "users affected")) else 4
        if is_reporting_work and task.get("task_type") == "request":
            production = min(production, 5)
            customer = min(customer, 5)
            severity = min(severity, 6)
        blocker = 8 if any(w in text for w in ("blocked", "blocking", "credentials", "certificate", "ci pipeline")) else 3
        deadline = 8 if task.get("deadline") else 4
        if any(w in text for w in ("today", "eod", "expires", "due date", "within 24 hours")):
            deadline = max(deadline, 9)
        dependency = min(10, 3 + int(task.get("source_count") or 1))
        business = max(customer, production)
        quality_factor = max(1, min(10, quality_score / 10))
        title_quality_multiplier = 0.55 if self._is_vague_title(title) else 1.0
        work_type_multiplier = 0.72 if is_reporting_work and task.get("task_type") == "request" else 1.0
        overall = round(
            (
                severity * 0.25
                + production * 0.2
                + customer * 0.18
                + deadline * 0.12
                + blocker * 0.1
                + business * 0.1
                + quality_factor * 0.05
            )
            * title_quality_multiplier
            * work_type_multiplier,
            1,
        )

        scores = {
            "overall_score": overall,
            "severity_score": severity,
            "deadline_score": deadline,
            "production_impact_score": production,
            "customer_impact_score": customer,
            "dependency_score": dependency,
            "blocker_score": blocker,
            "business_impact_score": business,
            "quality_factor_score": quality_factor,
        }

        reasons = build_priority_reasons(scores, task)
        if title_quality_multiplier < 1.0:
            reasons.append("Demoted: vague title formatting")
        if is_reporting_work and task.get("task_type") == "request":
            reasons.append("Demoted: administrative/reporting task classification")

        scores["explanation"] = build_explanation_paragraph(scores, task, overall, title_quality_multiplier, is_reporting_work)
        scores["priority_reason"] = reasons
        return scores

    def _is_vague_title(self, title: str) -> bool:
        normalized = title.strip().lower()
        vague_titles = (
            "include:",
            "join as well",
            "help with that",
            "be a quick fix",
            "be indexed",
            "fix this today",
            "ensure these are tracked",
        )
        return len(normalized) < 12 or normalized.startswith(vague_titles)

    def _is_critical(self, task: dict, fallback: dict) -> bool:
        title = task.get("title", "") or ""
        text = f"{title} {task.get('description', '')}".lower()
        return (
            fallback.get("overall_score", 0) >= 8.0
            or (task.get("urgency") or "").lower() == "critical"
            or task.get("task_type") in ("incident", "security")
            or any(w in text for w in ("p0", "p1", "critical", "outage", "blocker", "blocked", "credentials", "ssl", "500 error", "down"))
        )
