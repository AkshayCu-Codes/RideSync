from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="BACKEND_", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5176,http://127.0.0.1:5176"

    @property
    def allowed_cors_origins(self) -> list[str]:
        """Return the configured comma-separated origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the process lifetime."""
    return Settings()
