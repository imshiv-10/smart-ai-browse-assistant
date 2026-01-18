from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App settings
    app_name: str = "Smart Browse Assistant"
    debug: bool = False

    # CORS settings
    cors_origins: list[str] = ["*"]

    # LLM settings
    llm_provider: str = "ollama"  # Options: ollama, vllm, openai
    llm_model: str = "qwen2.5:7b"
    llm_base_url: str = "http://localhost:11434"
    llm_api_key: str = ""  # For OpenAI/Anthropic
    llm_temperature: float = 0.7
    llm_max_tokens: int = 4096

    # Scraper settings
    scraper_headless: bool = True
    scraper_timeout: int = 30000
    scraper_max_pages: int = 5

    # Cache settings
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
