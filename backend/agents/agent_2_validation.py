import re
import logging

logger = logging.getLogger("taskpilot.task_validator")

# Noise titles that extraction sometimes produces
NOISE_PATTERNS = (
    r"^untitled",
    r"^test$",
    r"^see above$",
    r"^follow up$",
    r"^check this$",
    r"^todo$",
    r"^fix this$",
    r"^update$",
    r"^misc$",
    r"^note$",
    r"^reminder$",
)

# Minimum title length to be considered a real task
MIN_TITLE_LENGTH = 10

# Maximum title length (LLM sometimes generates very long titles)
MAX_TITLE_LENGTH = 200

# Valid urgency values
VALID_URGENCY = {"low", "medium", "high", "critical"}

# Duplicate detection within same extraction batch
_seen_titles: set = set()


class TaskValidator:
    """Post-processing validation layer for extracted tasks.

    Filters out noise, normalizes fields, and prevents duplicates
    within the same extraction batch.
    """

    def __init__(self):
        self._seen_titles = set()
        self.stats = {"total": 0, "passed": 0, "filtered": 0, "reasons": {}}

    def reset(self):
        """Reset seen titles between pipeline runs."""
        self._seen_titles.clear()
        self.stats = {"total": 0, "passed": 0, "filtered": 0, "reasons": {}}

    def validate(self, task: dict, source: str) -> dict | None:
        """Validate and normalize a single extracted task.

        Returns the cleaned task dict if valid, or None if it should be filtered out.
        """
        self.stats["total"] += 1
        title = (task.get("title") or "").strip()

        # --- Filter: too short ---
        if len(title) < MIN_TITLE_LENGTH:
            self._record_filter("title_too_short")
            return None

        # --- Filter: too long ---
        if len(title) > MAX_TITLE_LENGTH:
            task["title"] = title[:MAX_TITLE_LENGTH]

        # --- Filter: noise patterns ---
        title_lower = title.lower()
        if any(re.match(p, title_lower) for p in NOISE_PATTERNS):
            self._record_filter("noise_pattern")
            return None

        # --- Filter: pure punctuation/symbols ---
        cleaned = re.sub(r"[^a-zA-Z0-9]", "", title)
        if len(cleaned) < 5:
            self._record_filter("no_alphanumeric_content")
            return None

        # --- Filter: duplicate within same batch ---
        title_key = re.sub(r"\W+", " ", title_lower).strip()
        if title_key in self._seen_titles:
            self._record_filter("duplicate_in_batch")
            return None
        self._seen_titles.add(title_key)

        # --- Normalize urgency ---
        urgency = (task.get("urgency") or "medium").lower().strip()
        if urgency not in VALID_URGENCY:
            urgency = "medium"
        task["urgency"] = urgency

        # --- Normalize confidence ---
        confidence = task.get("confidence")
        if confidence is None:
            confidence = 0.7
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = 0.7
        confidence = max(0.0, min(1.0, confidence))
        task["confidence"] = confidence

        # --- Ensure description exists ---
        if not task.get("description"):
            task["description"] = title

        # --- Normalize assignee ---
        assignee = task.get("assignee")
        if assignee and isinstance(assignee, str):
            assignee = assignee.strip()
            if assignee.lower() in ("none", "null", "unknown", ""):
                assignee = None
        task["assignee"] = assignee

        # --- Normalize deadline ---
        deadline = task.get("deadline")
        if deadline and isinstance(deadline, str):
            deadline = deadline.strip()
            if deadline.lower() in ("none", "null", "n/a", ""):
                deadline = None
        task["deadline"] = deadline

        self.stats["passed"] += 1
        return task

    def validate_batch(self, tasks: list[dict], source: str) -> list[dict]:
        """Validate a batch of tasks, filtering out invalid ones."""
        validated = []
        for task in tasks:
            result = self.validate(task, source)
            if result is not None:
                validated.append(result)
        return validated

    def get_stats(self) -> dict:
        return self.stats.copy()

    def _record_filter(self, reason: str):
        self.stats["filtered"] += 1
        self.stats["reasons"][reason] = self.stats["reasons"].get(reason, 0) + 1
        logger.debug(f"Task filtered: {reason}")
