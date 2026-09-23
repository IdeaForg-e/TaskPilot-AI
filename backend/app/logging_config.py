import logging
import sys
import os

def setup_logging():
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    handlers = [logging.StreamHandler(sys.stdout)]
    
    # Only attach FileHandler if write permissions are available and not on Vercel
    if not os.getenv("VERCEL") and not os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        try:
            import app.config as cfg
            log_dir = os.path.join(cfg.settings.DATA_DIR, "..", "logs")
            os.makedirs(log_dir, exist_ok=True)
            log_file = os.path.join(log_dir, "taskpilot.log")
            handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
        except Exception:
            pass

    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=handlers,
        force=True
    )
    
    # Configure logging for uvicorn
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    logger = logging.getLogger("taskpilot")
    logger.info("Logging initialized.")
    return logger

logger = logging.getLogger("taskpilot")
