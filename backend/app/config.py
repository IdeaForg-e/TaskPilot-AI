import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
BASE_DIR = os.path.dirname(BACKEND_DIR)

# Prefer the backend-local env file because that is what the dev server and IDE
# setup use for this project. Keep root .env as a harmless fallback.
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_FAST: str = os.getenv("GROQ_MODEL_FAST", "openai/gpt-oss-20b")
    GROQ_MODEL_REASONING: str = os.getenv("GROQ_MODEL_REASONING", "qwen/qwen3.6-27b")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL_FAST: str = os.getenv("NVIDIA_MODEL_FAST", "meta/llama-3.1-8b-instruct")
    NVIDIA_MODEL_REASONING: str = os.getenv("NVIDIA_MODEL_REASONING", "meta/llama-3.3-70b-instruct")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskpilot.db")
    DATA_DIR: str = os.path.join(BASE_DIR, "data")

settings = Settings()
