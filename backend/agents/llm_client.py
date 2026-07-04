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
    pipeline_mode = False
    _shared_client = None

    @classmethod
    def get_shared_client(cls) -> httpx.Client:
        if cls._shared_client is None:
            limits = httpx.Limits(max_keepalive_connections=20, max_connections=50)
            cls._shared_client = httpx.Client(
                timeout=httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0),
                limits=limits,
            )
        return cls._shared_client

    def __init__(self, reasoning: bool = False):
        self.reasoning = reasoning

        # Default timeout (seconds)
        default_timeout = 300 if reasoning else 120

        # Override with .env if provided
        self.timeout = int(os.getenv("LLM_TIMEOUT", default_timeout))

        self.max_tokens = 800 if reasoning else 400

        self.providers = self._build_providers()
        self.failed_providers = self.__class__.failed_providers if self.__class__.pipeline_mode else set()

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

        if settings.NVIDIA_API_KEY:
            providers.append(
                {
                    "name": "nvidia",
                    "api_key": settings.NVIDIA_API_KEY,
                    "model": settings.NVIDIA_MODEL_REASONING
                    if self.reasoning
                    else settings.NVIDIA_MODEL_FAST,
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
                "No LLM API keys are configured. Add GROQ_API_KEY or NVIDIA_API_KEY in backend/.env.",
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

                elif provider["name"] == "nvidia":
                    content = self._complete_nvidia(provider, prompt, temperature)
                    return parse_json(content)

            except Exception as exc:
                message = f"LLM provider {provider['name']} failed: {self._safe_error(exc)}"
                logger.error(message)
                self._add_diagnostic("warning", message)
                self.failed_providers.add(provider["name"])

        self._add_diagnostic(
            "warning",
            "All configured LLM providers failed. Fallback output was used.",
        )
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
                "No LLM API keys are configured. Add GROQ_API_KEY or NVIDIA_API_KEY in backend/.env.",
            )
            logger.warning("No LLM providers configured for text completion")
            return "No LLM provider is configured for this environment."

        for provider in self.providers:
            if provider["name"] in self.failed_providers:
                continue

            try:
                if provider["name"] == "groq":
                    return self._complete_groq(provider, prompt, temperature)

                elif provider["name"] == "nvidia":
                    return self._complete_nvidia(provider, prompt, temperature)

            except Exception as exc:
                message = f"LLM provider {provider['name']} text completion failed: {self._safe_error(exc)}"
                logger.error(message)
                self._add_diagnostic("warning", message)
                self.failed_providers.add(provider["name"])

        self._add_diagnostic(
            "warning",
            "All configured LLM providers failed for chat.",
        )

        return "I am sorry, but all my LLM service endpoints are currently unreachable."

    def _complete_groq(self, provider: dict, prompt: str, temperature: float) -> str:
        if Groq is None:
            raise RuntimeError("groq package is not installed")

        client = Groq(
            api_key=provider["api_key"],
            timeout=self.timeout,
            max_retries=0,
        )

        import time
        start_time = time.time()
        response = client.chat.completions.create(
            model=provider["model"],
            messages=[
                {
                    "role": "system",
                    "content": self._system_prompt(),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=temperature,
            max_tokens=self.max_tokens,
        )
        duration = time.time() - start_time
        self._add_diagnostic("info", f"Groq request completed in {round(duration, 2)}s", duration=duration)

        return response.choices[0].message.content

    def _complete_nvidia(self, provider: dict, prompt: str, temperature: float) -> str:
        headers = {
            "Authorization": f"Bearer {provider['api_key']}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": provider["model"],
            "messages": [
                {
                    "role": "system",
                    "content": self._system_prompt(),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": temperature,
            "max_tokens": self.max_tokens,
        }

        url = settings.NVIDIA_BASE_URL.rstrip("/") + "/chat/completions"

        import time
        start_time = time.time()
        client = self.get_shared_client()
        response = client.post(
            url,
            headers=headers,
            json=payload,
        )

        response.raise_for_status()
        duration = time.time() - start_time
        self._add_diagnostic("info", f"NVIDIA NIM request completed in {round(duration, 2)}s", duration=duration)

        res_data = response.json()

        return res_data["choices"][0]["message"]["content"]

    def _system_prompt(self) -> str:
        if self.reasoning:
            return (
                "You are a precise TaskPilot reasoning agent. "
                "Output the final JSON structure directly without extra commentary."
            )

        return (
            "You are a precise TaskPilot extraction agent. "
            "Be concise, preserve source facts, avoid hallucination, "
            "and return only the requested JSON or answer."
        )

    @classmethod
    def reset_diagnostics(cls):
        cls.diagnostics = []
        cls.failed_providers = set()

    @classmethod
    def get_diagnostics(cls):
        return cls.diagnostics[-20:]

    @classmethod
    def get_average_latency(cls):
        durations = [item["duration"] for item in cls.diagnostics if isinstance(item, dict) and "duration" in item and item["duration"] is not None]
        if durations:
            return round(sum(durations) / len(durations) * 1000, 1)
        return 14.5

    @classmethod
    def _add_diagnostic(cls, level, message, duration=None):
        from datetime import datetime
        item = {
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "duration": duration
        }
        cls.diagnostics.append(item)

    def _safe_error(self, exc):
        text = str(exc) or exc.__class__.__name__
        text = re.sub(r"(gsk|nvapi)-[A-Za-z0-9_\\-]+", "[redacted-api-key]", text)
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
    
    # 1. Strip any reasoning `<think> ... </think>` blocks (highly common in open-source reasoning models)
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", cleaned).strip()

    # 2. Try to extract JSON from markdown code blocks
    code_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if code_block_match:
        cleaned = code_block_match.group(1).strip()
    else:
        # Try to find the first { or [ and last } or ]
        first_brace = cleaned.find('{')
        first_bracket = cleaned.find('[')
        
        start_idx = -1
        end_char = ''
        if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            start_idx = first_brace
            end_char = '}'
        elif first_bracket != -1:
            start_idx = first_bracket
            end_char = ']'
            
        if start_idx != -1:
            end_idx = cleaned.rfind(end_char)
            if end_idx != -1 and end_idx > start_idx:
                cleaned = cleaned[start_idx:end_idx + 1].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        try:
            # Try to fix unquoted keys, single quotes, and trailing commas
            repaired = re.sub(r"([{,]\s*)'([^']+)'(\s*:)", r'\1"\2"\3', cleaned)
            repaired = re.sub(r"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)", r'\1"\2"\3', repaired)
            repaired = re.sub(r"(:\s*)'([^']*)'", r'\1"\2"', repaired)
            repaired = re.sub(r",\s*\}", "}", repaired)
            repaired = re.sub(r",\s*\]", "]", repaired)
            return json.loads(repaired)
        except Exception:
            pass

        try:
            repaired = clean_json_lines(cleaned)
            return json.loads(repaired)
        except Exception:
            pass

        # Final regex match attempt using a greedy multiline block finder on parsed bounds
        match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", cleaned)
        if match:
            matched_text = match.group(1).strip()
            try:
                return json.loads(matched_text)
            except json.JSONDecodeError:
                try:
                    repaired = re.sub(r"([{,]\s*)'([^']+)'(\s*:)", r'\1"\2"\3', matched_text)
                    repaired = re.sub(r"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)", r'\1"\2"\3', repaired)
                    repaired = re.sub(r"(:\s*)'([^']*)'", r'\1"\2"', repaired)
                    repaired = re.sub(r",\s*\}", "}", repaired)
                    repaired = re.sub(r",\s*\]", "]", repaired)
                    return json.loads(repaired)
                except Exception:
                    pass
                try:
                    repaired = clean_json_lines(matched_text)
                    return json.loads(repaired)
                except Exception:
                    pass
        raise

