import os
import sys
import logging
from pathlib import Path
from logging.handlers import RotatingFileHandler

# Centralized log directory: apps/backend/logs/app.log or root logs/
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR = BASE_DIR / "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE_PATH = str(LOG_DIR / "app.log")

# Production log format: Timestamp | Level | Module:Function:Line - Message
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def get_logger(name: str = "docmind") -> logging.Logger:
    """Return a standardized logger instance configured with console and rotating file handlers."""
    logger_instance = logging.getLogger(name)

    if not logger_instance.handlers:
        logger_instance.setLevel(logging.INFO)
        formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

        # 1. Console Handler (stdout)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        logger_instance.addHandler(console_handler)

        # 2. Rotating File Handler (10MB max, 5 backups)
        file_handler = RotatingFileHandler(
            LOG_FILE_PATH,
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        logger_instance.addHandler(file_handler)

    return logger_instance

logger = get_logger("docmind")
