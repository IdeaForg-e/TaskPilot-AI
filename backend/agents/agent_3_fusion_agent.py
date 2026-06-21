import json
import os
from difflib import SequenceMatcher

from agents.llm_client import LLMClient
from agents.prompts.agent_3_fusion_prompts import FUSION_PROMPT


class FusionAgent:
    def __init__(self):
        self.reasoning_llm = LLMClient(reasoning=True)
        # Try to locate the data directory relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(current_dir)
        self.cache_path = os.path.join(project_dir, "data", "fusion_cache.json")
        self.cache = {}
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
            except Exception:
                self.cache = {}

    def _get_cache_key(self, title_a: str, desc_a: str, title_b: str, desc_b: str) -> str:
        # Create a stable, sorted key based on the titles and descriptions
        pair = sorted([(title_a or "", desc_a or ""), (title_b or "", desc_b or "")])
        return f"{pair[0][0]}||{pair[0][1]}####{pair[1][0]}||{pair[1][1]}"

    def check_duplicate(self, task_a: dict, task_b: dict) -> dict:
        fallback = self._fallback(task_a, task_b)
        if fallback["confidence"] >= 0.70:
            return fallback

        if fallback["confidence"] < 0.55:
            return {
                "is_duplicate": False,
                "confidence": fallback["confidence"]
            }

        title_a = f"{task_a.get('title', '')} [Assignee: {task_a.get('assignee') or 'None'}, Platform: {task_a.get('source_platform') or 'Unknown'}]"
        desc_a = (task_a.get("description") or "")[:700]
        title_b = f"{task_b.get('title', '')} [Assignee: {task_b.get('assignee') or 'None'}, Platform: {task_b.get('source_platform') or 'Unknown'}]"
        desc_b = (task_b.get("description") or "")[:700]

        cache_key = self._get_cache_key(title_a, desc_a, title_b, desc_b)
        if cache_key in self.cache:
            return self.cache[cache_key]

        prompt = FUSION_PROMPT.format(
            title_a=title_a,
            desc_a=desc_a,
            title_b=title_b,
            desc_b=desc_b,
        )
        result = self.reasoning_llm.complete_json(prompt, fallback=fallback, temperature=0.1)

        if isinstance(result, dict):
            self.cache[cache_key] = result
            try:
                os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
                with open(self.cache_path, "w", encoding="utf-8") as f:
                    json.dump(self.cache, f, indent=2, ensure_ascii=False)
            except Exception:
                pass

        return result if isinstance(result, dict) else fallback

    def _fallback(self, task_a: dict, task_b: dict) -> dict:
        title_a = task_a.get("title", "")
        title_b = task_b.get("title", "")
        ratio = SequenceMatcher(None, title_a.lower(), title_b.lower()).ratio()
        tokens_a = set(title_a.lower().replace("#", "").split())
        tokens_b = set(title_b.lower().replace("#", "").split())
        overlap = len(tokens_a & tokens_b) / max(len(tokens_a | tokens_b), 1)
        confidence = max(ratio, overlap)

        assignee_a = task_a.get("assignee")
        assignee_b = task_b.get("assignee")
        if assignee_a and assignee_b and assignee_a.strip().lower() != assignee_b.strip().lower():
            confidence -= 0.15

        platform_a = task_a.get("source_platform")
        platform_b = task_b.get("source_platform")
        if platform_a and platform_b and platform_a != platform_b:
            confidence -= 0.05

        deadline_a = task_a.get("deadline")
        deadline_b = task_b.get("deadline")
        if deadline_a and deadline_b and deadline_a != deadline_b:
            confidence -= 0.10

        duplicate = confidence > 0.62
        return {
            "is_duplicate": duplicate,
            "confidence": max(0.0, confidence),
            "merged_title": title_a if len(title_a) >= len(title_b) else title_b,
            "merged_description": " ".join(
                part
                for part in (task_a.get("description"), task_b.get("description"))
                if part
            )[:1800],
        }
