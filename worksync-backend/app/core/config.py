from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./worksync.db"

    # JWT
    SECRET_KEY: str = "worksync-super-secret-jwt-key-2026-development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_ENV: str = "development"

    # GitHub (Optional token for higher API rate limits)
    GITHUB_TOKEN: str | None = None

    class Config:
        env_file = [
            str(BACKEND_DIR / ".env"),
            ".env",
        ]
        extra = "ignore"


settings = Settings()
