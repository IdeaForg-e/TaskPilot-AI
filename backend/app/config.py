import os
import shutil
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
BASE_DIR = os.path.dirname(BACKEND_DIR)

# Prefer backend-local env file
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)

IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

db_env = os.getenv("DATABASE_URL", "")
if IS_SERVERLESS:
    # On Vercel, force SQLite to /tmp/taskpilot.db to prevent read-only directory errors
    if not db_env or "sqlite" in db_env:
        DATABASE_URL = "sqlite:////tmp/taskpilot.db"
    else:
        DATABASE_URL = db_env
    DATA_DIR = os.getenv("DATA_DIR", "/tmp/data")
else:
    DATABASE_URL = db_env or "sqlite:///./taskpilot.db"
    DATA_DIR = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))

class Settings:
    IS_SERVERLESS: bool = IS_SERVERLESS
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_FAST: str = os.getenv("GROQ_MODEL_FAST", "openai/gpt-oss-20b")
    GROQ_MODEL_REASONING: str = os.getenv("GROQ_MODEL_REASONING", "openai/gpt-oss-120b")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL_FAST: str = os.getenv("NVIDIA_MODEL_FAST", "nvidia/nemotron-3.5-lightning-30b-a3b")
    NVIDIA_MODEL_REASONING: str = os.getenv("NVIDIA_MODEL_REASONING", "nvidia/nemotron-3-super-120b-a12b")
    DATABASE_URL: str = DATABASE_URL
    DATA_DIR: str = DATA_DIR

settings = Settings()

def ensure_data_seeded():
    source_dir = os.path.join(BASE_DIR, "data")
    target_dir = settings.DATA_DIR
    if os.path.abspath(source_dir) != os.path.abspath(target_dir) and os.path.exists(source_dir):
        try:
            os.makedirs(target_dir, exist_ok=True)
            for fname in os.listdir(source_dir):
                if fname.endswith(".json"):
                    src_file = os.path.join(source_dir, fname)
                    dst_file = os.path.join(target_dir, fname)
                    if not os.path.exists(dst_file) and os.path.isfile(src_file):
                        shutil.copy2(src_file, dst_file)
        except Exception:
            pass

ensure_data_seeded()
