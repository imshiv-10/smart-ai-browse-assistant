from fastapi import APIRouter, HTTPException
from ...models import SummaryRequest, SummaryResponse
from ...services.summarizer import SummarizerService

router = APIRouter()


@router.post("/summarize", response_model=dict)
async def summarize_page(request: SummaryRequest):
    """
    Summarize a web page's content.

    Returns a summary with key points, sentiment, and topics.
    """
    try:
        summarizer = SummarizerService()
        result = await summarizer.summarize(request.content)

        return {
            "success": True,
            "data": result.model_dump(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": str(e), "code": "SUMMARIZATION_ERROR"},
        )
