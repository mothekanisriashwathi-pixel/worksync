# Loads environment variables for the application.
# Actual values are set in the .env file (never committed).
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
