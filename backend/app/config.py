"""
Application configuration.

Centralizes all environment-driven settings so the rest of the codebase
never reads `os.environ` directly. Values fall back to sane development
defaults when a .env file is not present.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve important directories relative to this file so the app works
# regardless of the current working directory it is launched from.
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    # Still attempt to load a .env from CWD as a fallback.
    load_dotenv()


class Settings:
    """Simple settings container populated from environment variables."""

    # --- General ---
    APP_NAME: str = os.getenv("APP_NAME", "AI Communication Coach")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # --- Database ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'app.db'}"
    )

    # --- Auth / JWT ---
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "dev-secret-key-change-this-in-production-please"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")  # 7 days
    )

    # --- CORS ---
    FRONTEND_ORIGINS: list = os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")

    # --- File storage ---
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")

    # --- Whisper / Speech-to-text ---
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "tiny")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

    # --- language_tool_python ---
    LANGUAGE_TOOL_LANG: str = os.getenv("LANGUAGE_TOOL_LANG", "en-US")


settings = Settings()

# Ensure required directories exist at import time.
(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
