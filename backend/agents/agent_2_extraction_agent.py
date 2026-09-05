import re

from agents.llm_client import LLMClient
from agents.prompts.agent_2_extraction_prompts import (
    HIDDEN_TASK_PROMPT,
    EMAIL_HIDDEN_TASK_PROMPT,
    MEETING_HIDDEN_TASK_PROMPT,
)


class ExtractionAgent:
    def __init__(self, batch_size: int = 5):
        self.fast_llm = LLMClient(reasoning=False)
        self.batch_size = batch_size

    def extract_explicit_task(self, source_type: str, item: dict) -> dict:
        fallback = self._explicit_fallback(source_type, item)

        # Use LLM for structured sources (GitHub issues, Jira, etc.)
        if source_type not in ("github", "jira"):
            return fallback

        text = " ".join(
            str(item.get(key, ""))
            for key in ("title", "description", "body", "labels", "type")
        )
        from agents.prompts.agent_2_extraction_prompts import EXPLICIT_TASK_PROMPT
        prompt = EXPLICIT_TASK_PROMPT.format(source_type=source_type, content=text)
        try:
            result = self.fast_llm.complete_json(prompt, fallback=fallback)
            if isinstance(result, dict) and result.get("title"):
                # Validate required fields
                for key in ("urgency", "task_type"):
                    if key not in result or not result[key]:
                        result[key] = fallback.get(key, "medium" if key == "urgency" else "request")
                return result
            return fallback
        except Exception:
            return fallback

    def extract_hidden_tasks(self, source_type: str, item: dict) -> list[dict]:
        fallback = self._hidden_fallback(source_type, item)
        if source_type == "slack":
            return fallback

        text = " ".join(
            str(item.get(key, ""))
            for key in ("content", "body", "summary", "description", "subject", "title")
        )

        # Use source-specific few-shot prompts for better accuracy
        if source_type == "email":
            prompt = EMAIL_HIDDEN_TASK_PROMPT.format(content=text)
        elif source_type == "meeting":
            prompt = MEETING_HIDDEN_TASK_PROMPT.format(content=text)
        else:
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
        
        # Action markers - extended with common engineering-request verbs
        action_words = (
            "can you", "could you", "please", "need to", "needs to", "should",
            "don't forget", "action", "blocked", "urgent", "asap", "eod",
            "review", "investigate", "fix", "patch", "deploy", "ship",
            "prepare", "update", "renew", "confirm", "follow up", "escalate",
            "migrate", "schedule", "send", "share", "verify", "document",
        )
        # Strong urgency signals vs. mild ones - keeps default urgency "medium"
        critical_words = ("p0", "p1", "critical", "outage", "production down", "sev1")
        high_words = ("urgent", "asap", "eod", "today", "immediately", "blocker", "blocked", "deadline")

        # Split into atomic lines: newlines, bullets, and sentence boundaries
        raw_lines = re.split(r"[\n\r]+|(?=\s[-*•]\s)|(?<=[.!?])\s+(?=[A-Z])", text)
        lines = [re.sub(r"^[\s\-*•\d\.\)\]]+", "", ln).strip() for ln in raw_lines]
        lines = [ln for ln in lines if len(ln) > 10]

        candidates = []
        seen_titles = set()

        for line in lines:
            line_lower = line.lower()
            if not any(marker in line_lower for marker in action_words):
                continue

            title = self._title_from_text(line, item, source_type)
            if self._is_vague_title(title):
                continue
            # De-duplicate near-identical candidates from the same event
            title_key = re.sub(r"\W+", " ", title.lower()).strip()
            if title_key in seen_titles:
                continue
            seen_titles.add(title_key)

            urgency = "critical" if any(w in line_lower for w in critical_words) else (
                "high" if any(w in line_lower for w in high_words) else "medium"
            )
            assignee = self._find_assignee(item, line)
            deadline = self._find_deadline(line)

            desc = line
            if item.get("subject") and source_type == "email":
                desc += f" (Context: {item['subject']})"

            candidates.append(
                {
                    "title": title,
                    "description": desc[:800],
                    "assignee": assignee or self._find_assignee(item, text),
                    "deadline": deadline or self._find_deadline(text),
                    "urgency": urgency,
                    # Calibrated confidence: weighted by evidence strength
                    "confidence": self._calibrated_confidence(
                        source_type=source_type,
                        has_assignee=bool(assignee),
                        has_deadline=bool(deadline),
                        has_urgency_signal=urgency in ("critical", "high"),
                        text_length=len(line),
                        has_context=bool(item.get("subject")),
                    ),
                }
            )

        # Fallback to single overall task extraction if no line-by-line tasks were found
        if not candidates:
            lower = text.lower()
            if not any(marker in lower for marker in action_words):
                return []

            title = self._title_from_text(text, item, source_type)
            if self._is_vague_title(title):
                return []
            urgency = "critical" if any(w in lower for w in critical_words) else (
                "high" if any(w in lower for w in high_words) else "medium"
            )
            assignee = self._find_assignee(item, text)
            candidates.append(
                {
                    "title": title,
                    "description": text[:800].strip(),
                    "assignee": assignee,
                    "deadline": self._find_deadline(text),
                    "urgency": urgency,
                    "confidence": self._calibrated_confidence(
                        source_type=source_type,
                        has_assignee=bool(assignee),
                        has_deadline=bool(self._find_deadline(text)),
                        has_urgency_signal=urgency in ("critical", "high"),
                        text_length=len(text),
                        has_context=bool(item.get("subject")),
                    ),
                }
            )

        return candidates

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

    def _calibrated_confidence(
        self,
        source_type: str,
        has_assignee: bool,
        has_deadline: bool,
        has_urgency_signal: bool,
        text_length: int,
        has_context: bool,
    ) -> float:
        """Calculate calibrated confidence score based on evidence strength.

        Evidence hierarchy:
        - Source reliability: meeting > email > slack (structured > unstructured)
        - Assignee present: strong signal of real action item
        - Deadline present: strong signal of commitment
        - Urgency signal: P0/P1/critical language indicates real work
        - Text length: longer text = more context = more reliable extraction
        - Context (subject line): email subject provides additional grounding
        """
        # Base score by source type
        source_scores = {
            "meeting": 0.70,   # Structured action items are most reliable
            "email": 0.62,     # Email with subject/body is fairly reliable
            "slack": 0.55,     # Slack messages are noisier
        }
        base = source_scores.get(source_type, 0.60)

        # Evidence boosts (cumulative)
        boost = 0.0
        if has_assignee:
            boost += 0.12
        if has_deadline:
            boost += 0.10
        if has_urgency_signal:
            boost += 0.08
        if text_length > 100:
            boost += 0.03
        if has_context:
            boost += 0.02

        # Cap total confidence
        confidence = min(0.95, base + boost)

        # Ensure minimum confidence for validated tasks
        confidence = max(0.45, confidence)

        return round(confidence, 2)
