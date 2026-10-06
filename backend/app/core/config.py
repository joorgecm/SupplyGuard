from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables (and .env files)."""

    model_config = SettingsConfigDict(
        # Later files take priority: backend/.env overrides the repo-root .env.
        env_file=("../.env", ".env"),
        extra="ignore",
    )

    app_name: str = "SupplyGuard API"
    database_url: str
    test_database_url: str | None = None

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
