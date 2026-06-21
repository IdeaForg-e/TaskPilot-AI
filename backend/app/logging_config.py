import logging
import sys
import os

def setup_logging():
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Define log file path OUTSIDE the backend directory so watchfiles doesn't detect changes
    import app.config as cfg
    log_dir = os.path.join(cfg.settings.DATA_DIR, "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "taskpilot.log")
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, encoding="utf-8")
        ]
    )
    
    # Configure logging for uvicorn
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    logger = logging.getLogger("taskpilot")
    logger.info(f"Logging initialized. Writing log file to {log_file}")
    return logger

logger = logging.getLogger("taskpilot")
