import json
import logging
import os
import re
from typing import Any

import httpx

from app.config import settings

try:
    from groq import Groq
except Exception:  # pragma: no cover - fallback keeps the demo alive
    Groq = None


class LLMClient:
    diagnostics = []
    failed_providers = set()

    def __init__(self, reasoning: bool = False):
        self.reasoning = reasoning
        self.timeout = 90 if reasoning else 30
        self.max_tokens = 4096 if reasoning else 2000
        self.providers = self._build_providers()

    def _build_providers(self):
        providers = []
        if settings.GROQ_API_KEY:
            providers.append(
                {
                    "name": "groq",
                    "api_key": settings.GROQ_API_KEY,
                    "model": settings.GROQ_MODEL_REASONING
                    if self.reasoning
                    else settings.GROQ_MODEL_FAST,
                }
            )
        return providers

    def complete_json(self, prompt: str, fallback: Any, temperature: float = 0.1) -> Any:
        logger = logging.getLogger("taskpilot.llm_client")
        if os.getenv("TASKPILOT_DISABLE_LLM") == "1":
            self._add_diagnostic(
                "warning",
                "LLM calls are disabled with TASKPILOT_DISABLE_LLM=1. Using deterministic fallback output.",
            )
            logger.debug("LLM disabled by TASKPILOT_DISABLE_LLM; using deterministic fallback")
            return fallback
        if not self.providers:
            self._add_diagnostic(
                "warning",
                "No LLM API keys are configured. Add GROQ_API_KEY in backend/.env.",
            )
            logger.debug("No LLM providers configured; using deterministic fallback")
            return fallback

        for provider in self.providers:
            if provider["name"] in self.failed_providers:
                continue
            try:
                if provider["name"] == "groq":
                    content = self._complete_groq(provider, prompt, temperature)
                    return parse_json(content)
            except Exception as exc:
                message = f"LLM provider {provider['name']} failed: {self._safe_error(exc)}"
                logger.error(message)
                self._add_diagnostic("warning", message)
                self.failed_providers.add(provider["name"])

        self._add_diagnostic("warning", "All configured LLM providers failed. Fallback output was used.")
        return fallback

    def complete_text(self, prompt: str, temperature: float = 0.5) -> str:
        logger = logging.getLogger("taskpilot.llm_client")
        if os.getenv("TASKPILOT_DISABLE_LLM") == "1":
            self._add_diagnostic(
                "warning",
                "LLM calls are disabled with TASKPILOT_DISABLE_LLM=1. Chat responses are limited.",
            )
            return "LLM queries are disabled in development mode."
        if not self.providers:
            self._add_diagnostic(
                "warning",
                "No LLM API keys are configured. Add GROQ_API_KEY in backend/.env.",
            )
            logger.warning("No LLM providers configured for text completion")
            return "No LLM provider is configured for this environment."

        for provider in self.providers:
            if provider["name"] in self.failed_providers:
                continue
            try:
                if provider["name"] == "groq":
                    content = self._complete_groq(provider, prompt, temperature)
                    return content
            except Exception as exc:
                message = f"LLM provider {provider['name']} text completion failed: {self._safe_error(exc)}"
                logger.error(message)
                self._add_diagnostic("warning", message)
                self.failed_providers.add(provider["name"])

        self._add_diagnostic("warning", "All configured LLM providers failed for chat.")
        return "I am sorry, but all my LLM service endpoints are currently unreachable."

    def _complete_groq(self, provider: dict, prompt: str, temperature: float) -> str:
        if Groq is None:
            raise RuntimeError("groq package is not installed")
        client = Groq(api_key=provider["api_key"], timeout=self.timeout, max_retries=0)
        response = client.chat.completions.create(
            model=provider["model"],
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=self.max_tokens,
        )
        return response.choices[0].message.content

    def _system_prompt(self) -> str:
        if self.reasoning:
            return (
                "You are a careful TaskPilot reasoning agent. Think through evidence, "
                "tradeoffs, duplicates, urgency, and planning constraints privately. "
                "Return only the requested JSON or plain answer, with no markdown."
            )
        return (
            "You are a precise TaskPilot extraction agent. Be concise, preserve source "
            "facts, avoid hallucination, and return only the requested JSON or answer."
        )

    @classmethod
    def reset_diagnostics(cls) -> None:
        cls.diagnostics = []
        cls.failed_providers = set()

    @classmethod
    def get_diagnostics(cls) -> list[dict]:
        return cls.diagnostics[-20:]

    @classmethod
    def _add_diagnostic(cls, level: str, message: str) -> None:
        item = {"level": level, "message": message}
        if item not in cls.diagnostics:
            cls.diagnostics.append(item)

    def _safe_error(self, exc: Exception) -> str:
        text = str(exc) or exc.__class__.__name__
        text = re.sub(r"(gsk|nvapi)-[A-Za-z0-9_\-]+", "[redacted-api-key]", text)
        return text[:300]


def clean_json_lines(json_str: str) -> str:
    lines = json_str.splitlines()
    for i, line in enumerate(lines):
        parts = line.split(':', 1)
        if len(parts) == 2:
            key, val = parts
            val_stripped = val.strip()
            if val_stripped.startswith('"'):
                first_q = val.find('"')
                last_q = val.rfind('"')
                if first_q != -1 and last_q != -1 and first_q < last_q:
                    prefix = val[:first_q + 1]
                    suffix = val[last_q:]
                    content = val[first_q + 1:last_q]
                    escaped_content = []
                    for idx, char in enumerate(content):
                        if char == '"':
                            backslash_count = 0
                            k = idx - 1
                            while k >= 0 and content[k] == '\\':
                                backslash_count += 1
                                k -= 1
                            if backslash_count % 2 == 0:
                                escaped_content.append('\\"')
                            else:
                                escaped_content.append('"')
                        else:
                            escaped_content.append(char)
                    lines[i] = key + ':' + prefix + "".join(escaped_content) + suffix
    return "\n".join(lines)


def parse_json(text: str) -> Any:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        try:
            repaired = clean_json_lines(cleaned)
            return json.loads(repaired)
        except Exception:
            pass

        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            matched_text = match.group(1)
            try:
                return json.loads(matched_text)
            except json.JSONDecodeError:
                try:
                    repaired = clean_json_lines(matched_text)
                    return json.loads(repaired)
                except Exception:
                    pass
        raise

