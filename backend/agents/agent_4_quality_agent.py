from agents.llm_client import LLMClient
from agents.prompts.agent_4_quality_prompts import QUALITY_PROMPT


class QualityAgent:
    def __init__(self):
        self.fast_llm = LLMClient(reasoning=False)

    def evaluate(self, title: str, description: str, task_type: str, assignee: str, deadline: str, is_critical: bool = False) -> dict:
        fallback = self._fallback(title, description, task_type, assignee, deadline)
        if not is_critical:
            return fallback

        prompt = QUALITY_PROMPT.format(
            title=title,
            description=description,
            task_type=task_type,
            assignee=assignee,
            deadline=deadline
        )
        try:
            result = self.fast_llm.complete_json(prompt, fallback=fallback)
            if not isinstance(result, dict):
                return fallback
            
            for field in ["clear_title", "reproduction_steps", "error_logs", "environment", "expected_behavior", "severity", "assignee"]:
                if field not in result:
                    result[field] = fallback[field]
                else:
                    try:
                        result[field] = float(result[field])
                    except (ValueError, TypeError):
                        result[field] = fallback[field]
                        
            if "overall_score" not in result:
                result["overall_score"] = fallback["overall_score"]
            else:
                try:
                    result["overall_score"] = float(result["overall_score"])
                except (ValueError, TypeError):
                    result["overall_score"] = fallback["overall_score"]
            
            if "missing_info" not in result:
                result["missing_info"] = fallback["missing_info"]
            if "clarification_questions" not in result:
                result["clarification_questions"] = fallback["clarification_questions"]
            if "actionability" not in result:
                result["actionability"] = fallback["actionability"]
                
            return result
        except Exception:
            return fallback

    def _fallback(self, title: str, description: str, task_type: str, assignee: str, deadline: str) -> dict:
        desc = description or ""
        lower = f"{title} {desc}".lower()
        clear_title = 90 if len(title or "") > 18 and "this issue" not in lower else 35
        reproduction = 80 if any(w in lower for w in ("steps", "symptoms", "error", "timeline")) else 25
        error_logs = 85 if any(w in lower for w in ("error", "stack", "logs", "alert")) else 30
        environment = 80 if any(w in lower for w in ("production", "staging", "ios", "android", "ci/cd")) else 35
        expected = 80 if any(w in lower for w in ("expected", "actual", "acceptance", "criteria")) else 35
        severity = 90 if any(w in lower for w in ("critical", "p0", "p1", "high", "urgent")) else 55
        assignee_score = 85 if assignee else 20
        scores = [clear_title, reproduction, error_logs, environment, expected, severity, assignee_score]
        overall = round(sum(scores) / len(scores), 1)

        missing = []
        if clear_title < 50:
            missing.append("specific title")
        if reproduction < 50 and task_type in ("bug", "incident"):
            missing.append("reproduction steps or incident timeline")
        if error_logs < 50 and task_type in ("bug", "incident"):
            missing.append("error logs")
        if environment < 50:
            missing.append("environment")
        if not assignee:
            missing.append("owner")

        # Context-aware realistic question generation
        questions = []
        if clear_title < 50:
            questions.append("The current title is too brief. Could you specify the exact component and issue to improve tracking?")
        if not assignee:
            questions.append("No primary owner is assigned. Who on the engineering team should take ownership of this task?")
        if environment < 50:
            if "database" in lower or "timeout" in lower:
                questions.append("Please specify if this database timeout is occurring in the Production database cluster or Staging.")
            elif "ssl" in lower or "cert" in lower:
                questions.append("Which environment's SSL endpoint is expiring? Please provide the domain name (e.g., api.company.com).")
            else:
                questions.append("Please clarify the target environment (Production, Staging, or CI/CD pipeline) where this issue is active.")
        if reproduction < 50 and task_type in ("bug", "incident"):
            if "login" in lower:
                questions.append("Could you outline the step-by-step auth flow or network payloads that trigger the login failure?")
            elif "upload" in lower or "500" in lower:
                questions.append("Please provide the exact steps to reproduce the 500 error during upload, including payload details.")
            else:
                questions.append("Please outline the step-by-step reproduction path or event timeline that led to this error.")
        if error_logs < 50 and task_type in ("bug", "incident"):
            if "database" in lower or "timeout" in lower:
                questions.append("Please attach the database connection pool stack traces showing the connection timeout.")
            else:
                questions.append("Please attach the corresponding server console logs or system stack trace from the failure window.")

        if not questions:
            questions = [f"Please provide clarified details for the missing {item}." for item in missing[:3]]

        actionability = "actionable"
        if overall < 55:
            actionability = "needs_info"
        if "blocked" in lower:
            actionability = "blocked"

        return {
            "clear_title": clear_title,
            "reproduction_steps": reproduction,
            "error_logs": error_logs,
            "environment": environment,
            "expected_behavior": expected,
            "severity": severity,
            "assignee": assignee_score,
            "overall_score": overall,
            "missing_info": missing,
            "clarification_questions": questions[:3],
            "actionability": actionability,
        }
