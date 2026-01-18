from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ProductInfo(BaseModel):
    """Product information extracted from a page."""

    name: str
    price: Optional[float] = None
    currency: str = "USD"
    images: list[str] = Field(default_factory=list)
    description: str = ""
    rating: Optional[float] = None
    review_count: Optional[int] = None
    availability: str = "unknown"
    brand: str = ""
    category: str = ""


class ArticleInfo(BaseModel):
    """Article information extracted from a page."""

    author: str = ""
    publish_date: str = ""
    reading_time: int = 0


class PageContent(BaseModel):
    """Content extracted from a webpage."""

    url: str
    title: str
    description: str = ""
    text: str
    page_type: Literal["product", "article", "search", "other"] = "other"
    extracted_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    product: Optional[ProductInfo] = None
    article: Optional[ArticleInfo] = None


class ChatMessage(BaseModel):
    """A chat message."""

    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SummaryRequest(BaseModel):
    """Request for page summarization."""

    content: PageContent


class SummaryResponse(BaseModel):
    """Response with page summary."""

    summary: str
    key_points: list[str] = Field(default_factory=list)
    sentiment: Optional[Literal["positive", "negative", "neutral"]] = None
    topics: list[str] = Field(default_factory=list)


class ProductAlternative(BaseModel):
    """An alternative product found via scraping."""

    name: str
    price: Optional[float] = None
    currency: str = "USD"
    url: str
    image: Optional[str] = None
    rating: Optional[float] = None
    source: str = ""


class ProsConsAnalysis(BaseModel):
    """Pros and cons analysis for a product."""

    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)


class AlternativeAnalysis(BaseModel):
    """Analysis for an alternative product."""

    name: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)


class ProsConsResult(BaseModel):
    """Complete pros/cons analysis result."""

    current: ProsConsAnalysis
    alternatives: list[AlternativeAnalysis] = Field(default_factory=list)


class CompareRequest(BaseModel):
    """Request for product comparison."""

    url: str
    content: PageContent


class CompareResponse(BaseModel):
    """Response with product comparison."""

    current_product: ProductInfo
    alternatives: list[ProductAlternative] = Field(default_factory=list)
    verdict: str
    pros_cons_analysis: ProsConsResult
    recommendation: Optional[str] = None


class ChatRequest(BaseModel):
    """Request for chat completion."""

    messages: list[ChatMessage]
    context: PageContent


class ChatResponse(BaseModel):
    """Response with chat message."""

    message: ChatMessage


class AnalyzeRequest(BaseModel):
    """Request for deep page analysis."""

    content: PageContent


class AnalyzeResponse(BaseModel):
    """Response with detailed page analysis."""

    summary: str
    key_points: list[str] = Field(default_factory=list)
    sentiment: Optional[Literal["positive", "negative", "neutral"]] = None
    topics: list[str] = Field(default_factory=list)
    entities: list[str] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str = "1.0.0"
    llm_status: str = "unknown"
