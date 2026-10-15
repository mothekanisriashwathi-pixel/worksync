from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./worksync.db"

    # JWT
    SECRET_KEY: str = "worksync-super-secret-jwt-key-2026-development"  # dev only, see check_production_settings
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_ENV: str = "development"

    # Submission uploads (local disk under worksync-backend/uploads/submissions)
    MAX_UPLOAD_MB: int = 10

    # GitHub (Optional token for higher API rate limits)
    GITHUB_TOKEN: str | None = None

    class Config:
        env_file = [
            str(BACKEND_DIR / ".env"),
            ".env",
        ]
        extra = "ignore"


DEFAULT_SECRET_KEY = "worksync-super-secret-jwt-key-2026-development"

settings = Settings()


def check_production_settings(s: Settings) -> None:
    """Refuse to run outside development with the publicly known default JWT secret."""
    if s.APP_ENV != "development" and s.SECRET_KEY == DEFAULT_SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be set in .env when APP_ENV is not 'development'.")
