"""Application configuration loaded from environment variables / .env file."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with .env file support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Luxe Estates API"
    app_version: str = "2.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://neondb_owner:npg_GEwy51WAmHDJ@ep-long-waterfall-azzs0qit.c-3.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
    ]

    # JWT / Auth
    secret_key: str = "luxe-estates-super-secret-key-change-in-production"
    access_token_expire_minutes: int = 480  # 8 hours

    # Email (Resend)
    resend_api_key: str = ""

    # Frontend URL (for password reset links)
    frontend_url: str = "http://localhost:3000"


settings = Settings()
