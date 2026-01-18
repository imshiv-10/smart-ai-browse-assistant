from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .api.routes import analyze, compare, summarize, chat
from .services.llm_service import LLMService
from .models import HealthResponse


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup/shutdown events."""
    # Startup
    print(f"Starting {settings.app_name}...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered web page analysis and product comparison API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(summarize.router, prefix="/api", tags=["Summarization"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(compare.router, prefix="/api", tags=["Comparison"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API and LLM health status."""
    llm_service = LLMService()
    llm_healthy = await llm_service.health_check()

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        llm_status="online" if llm_healthy else "offline",
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
