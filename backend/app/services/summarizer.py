from ..models import PageContent, SummaryResponse, AnalyzeResponse
from .llm_service import LLMService


class SummarizerService:
    """Service for summarizing and analyzing page content."""

    def __init__(self):
        self.llm = LLMService()

    async def summarize(self, content: PageContent) -> SummaryResponse:
        """
        Generate a summary of the page content.

        Args:
            content: Extracted page content

        Returns:
            Summary with key points, sentiment, and topics
        """
        result = await self.llm.summarize(content.model_dump())

        return SummaryResponse(
            summary=result.get("summary", ""),
            key_points=result.get("key_points", []),
            sentiment=result.get("sentiment"),
            topics=result.get("topics", []),
        )

    async def analyze(self, content: PageContent) -> AnalyzeResponse:
        """
        Perform deep analysis of page content.

        Args:
            content: Extracted page content

        Returns:
            Detailed analysis including entities and questions
        """
        result = await self.llm.analyze(content.model_dump())

        return AnalyzeResponse(
            summary=result.get("summary", ""),
            key_points=result.get("key_points", []),
            sentiment=result.get("sentiment"),
            topics=result.get("topics", []),
            entities=result.get("entities", []),
            questions=result.get("questions", []),
        )
