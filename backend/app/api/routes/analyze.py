from fastapi import APIRouter, HTTPException
from ...models import AnalyzeRequest, AnalyzeResponse
from ...services.summarizer import SummarizerService

router = APIRouter()


@router.post("/analyze", response_model=dict)
async def analyze_page(request: AnalyzeRequest):
    """
    Perform deep analysis of a web page's content.

    Returns detailed analysis including entities, questions, and more.
    """
    try:
        summarizer = SummarizerService()
        result = await summarizer.analyze(request.content)

        return {
            "success": True,
            "data": result.model_dump(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": str(e), "code": "ANALYSIS_ERROR"},
        )
