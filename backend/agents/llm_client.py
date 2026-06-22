from typing import Any
class LLMClient:
    diagnostics = []

    def __init__(self, reasoning: bool = False):
        self.reasoning = reasoning

        # Default timeout (seconds)
        default_timeout = 300 if reasoning else 120

        # Override with .env if provided
        self.timeout = int(os.getenv("LLM_TIMEOUT", default_timeout))

        self.max_tokens = 3000 if reasoning else 1500

        self.providers = self._build_providers()
        self.failed_providers = set()

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

        timeout = httpx.Timeout(
            connect=30,
            read=self.timeout,
            write=30,
            pool=30,
        )

        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                url,
                headers=headers,
                json=payload,
            )

            response.raise_for_status()

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

    @classmethod
    def get_diagnostics(cls):
        return cls.diagnostics[-20:]

    @classmethod
    def _add_diagnostic(cls, level, message):
        item = {
            "level": level,
            "message": message,
        }

        if item not in cls.diagnostics:
            cls.diagnostics.append(item)

    def _safe_error(self, exc):
        text = str(exc) or exc.__class__.__name__
        text = re.sub(r"(gsk|nvapi)-[A-Za-z0-9_\\-]+", "[redacted-api-key]", text)
        return text[:300]
