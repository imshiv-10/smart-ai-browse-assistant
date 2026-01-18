"""API dependencies for dependency injection."""

from functools import lru_cache
from ..config import Settings, get_settings
from ..services.llm_service import LLMService
from ..services.scraper import ScraperService
from ..services.summarizer import SummarizerService


@lru_cache()
def get_llm_service() -> LLMService:
    """Get cached LLM service instance."""
    return LLMService()


@lru_cache()
def get_scraper_service() -> ScraperService:
    """Get cached scraper service instance."""
    return ScraperService()


@lru_cache()
def get_summarizer_service() -> SummarizerService:
    """Get cached summarizer service instance."""
    return SummarizerService()


def get_settings_dep() -> Settings:
    """Get settings as a dependency."""
    return get_settings()
