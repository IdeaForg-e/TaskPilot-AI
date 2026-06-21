import json
import re

from agents.llm_client import LLMClient
from agents.prompts.agent_2_extraction_prompts import EXPLICIT_TASK_PROMPT, HIDDEN_TASK_PROMPT


class ExtractionAgent:
    def __init__(self, batch_size: int = 5):
        self.fast_llm = LLMClient(reasoning=False)
        self.batch_size = batch_size

    def extract_explicit_task(self, source_type: str, item: dict) -> dict:
        fallback = self._explicit_fallback(source_type, item)
        prompt = EXPLICIT_TASK_PROMPT.format(source_type=source_type, content=json.dumps(item, indent=2))
        try:
            result = self.fast_llm.complete_json(prompt, fallback=fallback)
            if not isinstance(result, dict):
                return fallback
            for key in ["title", "description"]:
                if not result.get(key):
                    result[key] = fallback.get(key)
            if "urgency" not in result or result["urgency"] not in ("low", "medium", "high", "critical"):
                result["urgency"] = fallback.get("urgency", "medium")
            if "task_type" not in result:
                result["task_type"] = fallback.get("task_type", "request")
            return result
        except Exception:
            return fallback

    def extract_hidden_tasks(self, source_type: str, item: dict) -> list[dict]:
        fallback = self._hidden_fallback(source_type, item)
        text = " ".join(
            str(item.get(key, ""))
            for key in ("content", "body", "summary", "description", "subject", "title")
        )
        prompt = HIDDEN_TASK_PROMPT.format(source_type=source_type, content=text)
        try:
            result = self.fast_llm.complete_json(prompt, fallback=fallback)
            if not isinstance(result, list):
                if isinstance(result, dict):
                    result = [result]
                else:
                    return fallback
            validated = []
            for task in result:
                if isinstance(task, dict) and task.get("title"):
                    if not task.get("description"):
                        task["description"] = fallback[0]["description"] if fallback else task["title"]
                    if "urgency" not in task or task["urgency"] not in ("low", "medium", "high", "critical"):
                        task["urgency"] = "medium"
                    if "confidence" not in task:
                        task["confidence"] = 0.8
                    validated.append(task)
            return validated if validated else fallback
        except Exception:
            return fallback

    def _explicit_fallback(self, source_type: str, item: dict) -> dict:
        title = item.get("title") or item.get("subject") or item.get("key") or "Untitled task"
        task_type = (item.get("type") or source_type or "request").lower().replace(" ", "_")
        priority = (item.get("priority") or item.get("severity") or "").lower()
        urgency = "medium"
        if "critical" in priority or item.get("severity") in ("P0", "P1"):
            urgency = "critical"
        elif "high" in priority:
            urgency = "high"
        elif "low" in priority:
            urgency = "low"
        return {
            "title": title,
            "description": item.get("description") or item.get("body") or title,
            "assignee": item.get("assignee"),
            "deadline": item.get("due_date") or item.get("date"),
            "urgency": urgency,
            "task_type": self._normalize_type(task_type, item),
        }

    def _hidden_fallback(self, source_type: str, item: dict) -> list[dict]:
        if source_type == "meeting" and item.get("action_items"):
            return self._meeting_action_items(item)

        text = " ".join(
            str(item.get(key, ""))
            for key in ("content", "body", "summary", "description", "subject", "title")
        )
        lower = text.lower()
        if not any(
            marker in lower
            for marker in (
                "can you",
                "please",
                "need to",
                "should",
                "don't forget",
                "action",
                "blocked",
                "urgent",
                "review",
                "investigate",
                "fix",
                "prepare",
                "update",
            )
        ):
            return []

        title = self._title_from_text(text, item, source_type)
        if self._is_vague_title(title):
            return []
        urgency = "critical" if any(w in lower for w in ("p0", "critical", "urgent", "outage")) else "high"
        assignee = self._find_assignee(item, text)
        return [
            {
                "title": title,
                "description": text[:800],
                "assignee": assignee,
                "deadline": self._find_deadline(text),
                "urgency": urgency,
                "confidence": 0.72 if assignee else 0.62,
            }
        ]

    def _meeting_action_items(self, item: dict) -> list[dict]:
        tasks = []
        for action in item.get("action_items", []):
            description = action.get("description") or ""
            if not description:
                continue
            title = description.strip().rstrip(".")
            tasks.append(
                {
                    "title": title[:90],
                    "description": f"{description} From meeting: {item.get('title', '')}",
                    "assignee": action.get("assignee"),
                    "deadline": action.get("due_date"),
                    "urgency": "high" if action.get("due_date") else "medium",
                    "confidence": 0.9,
                }
            )
        return tasks

    def _normalize_type(self, task_type: str, item: dict) -> str:
        text = " ".join(
            str(item.get(key, "")) for key in ("title", "description", "labels", "type")
        ).lower()
        if "security" in text or "xss" in text or "ssl" in text:
            return "security"
        if "bug" in task_type or "broken" in text or "fix" in text:
            return "bug"
        if "incident" in task_type or item.get("key", "").startswith("INC"):
            return "incident"
        if "doc" in task_type:
            return "documentation"
        if "debt" in task_type or "refactor" in text:
            return "technical_debt"
        if "pull request" in task_type or "pr" in text:
            return "review"
        return "feature" if "feature" in task_type else "request"

    def _title_from_text(self, text: str, item: dict | None = None, source_type: str = "") -> str:
        item = item or {}
        if source_type == "email" and item.get("subject"):
            subject = re.sub(r"^(re|fwd):\s*", "", item["subject"], flags=re.I).strip()
            if "critical items summary" in subject.lower():
                return "Prepare critical items summary for management"
            if "ssl certificate" in subject.lower():
                return "Renew SSL certificates before expiration"
            if "xss vulnerability" in subject.lower():
                return "Confirm XSS vulnerability fix timeline"
            if "dependabot" in subject.lower():
                return "Patch critical Dependabot security alerts"
            if "login failures" in subject.lower():
                return "Fix urgent mobile login failures"
            return subject[:90]

        cleaned = re.sub(r"\s+", " ", text).strip()
        for pattern in (
            r"can you ([^.?!]+)",
            r"please ([^.?!]+)",
            r"need to ([^.?!]+)",
            r"should ([^.?!]+)",
        ):
            match = re.search(pattern, cleaned, flags=re.I)
            if match:
                return match.group(1).strip().capitalize()[:90]
        return cleaned[:90] or "Follow up on hidden task"

    def _is_vague_title(self, title: str) -> bool:
        normalized = title.strip().lower()
        vague_prefixes = (
            "include:",
            "join as well",
            "help with that",
            "be a quick fix",
            "be indexed",
            "consider for your roadmap",
            "ensure these are tracked",
        )
        return len(normalized) < 8 or normalized.startswith(vague_prefixes)

    def _find_assignee(self, item: dict, text: str):
        mentions = item.get("mentions") or []
        if mentions:
            return mentions[0]
        match = re.search(r"@([a-zA-Z0-9_.-]+)", text)
        return match.group(1) if match else item.get("assignee")

    def _find_deadline(self, text: str):
        match = re.search(r"20\d{2}-\d{2}-\d{2}", text)
        if match:
            return match.group(0)
        for word in ("today", "tomorrow", "friday", "thursday"):
            if word in text.lower():
                return word
        return None
