from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime
from ...models import ChatRequest, ChatMessage
from ...services.llm_service import LLMService

router = APIRouter()


@router.post("/chat", response_model=dict)
async def chat_with_context(request: ChatRequest):
    """
    Chat with AI using page content as context.

    Maintains conversation history and uses page content to answer questions.
    """
    try:
        llm_service = LLMService()
        response_content = await llm_service.chat(
            messages=[msg.model_dump() for msg in request.messages],
            context=request.context.model_dump(),
        )

        response_message = ChatMessage(
            id=str(uuid4()),
            role="assistant",
            content=response_content,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "success": True,
            "data": {"message": response_message.model_dump()},
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": str(e), "code": "CHAT_ERROR"},
        )
