import logging
import sys
from app.core.config import settings

def setup_logging():
    """Configure logging for the application."""
    log_level = settings.LOG_LEVEL.upper()
    
    # Basic configuration for root logger
    logging.basicConfig(
        level=log_level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # If in development, try to use Rich for pretty printing
    if settings.ENVIRONMENT == "dev" or settings.ENVIRONMENT == "development":
        try:
            from rich.logging import RichHandler
            logging.getLogger().handlers = [
                RichHandler(
                    rich_tracebacks=True,
                    markup=True,
                    show_time=True,
                    show_path=False
                )
            ]
        except ImportError:
            pass  # Fallback to standard logging if rich is not installed

    # Set log levels for third-party libraries to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # We have our own middleware
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Get our app logger
    logger = logging.getLogger("quest_ai")
    logger.setLevel(log_level)
    
    return logger

logger = setup_logging()
