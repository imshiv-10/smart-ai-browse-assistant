from fastapi import APIRouter, HTTPException
from ...models import CompareRequest, CompareResponse, ProductInfo
from ...services.product_extractor import ProductExtractorService
from ...services.scraper import ScraperService
from ...services.llm_service import LLMService

router = APIRouter()


@router.post("/compare", response_model=dict)
async def compare_product(request: CompareRequest):
    """
    Compare a product with alternatives from across the web.

    Scrapes alternative products and provides AI-powered comparison.
    """
    try:
        content = request.content

        # Ensure we have product info
        if not content.product:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "No product information found on this page",
                    "code": "NO_PRODUCT_INFO",
                },
            )

        product = content.product

        # Build search query
        search_query = f"{product.name} alternatives"
        if product.brand:
            search_query = f"{product.name} vs {product.brand} alternatives"

        # Scrape for alternatives
        scraper = ScraperService()
        alternatives = await scraper.search_product_alternatives(
            query=search_query,
            current_product_name=product.name,
            max_results=5,
        )

        # Get LLM comparison analysis
        llm_service = LLMService()
        analysis = await llm_service.compare_products(
            current_product=product.model_dump(),
            alternatives=[alt.model_dump() for alt in alternatives],
        )

        return {
            "success": True,
            "data": {
                "current_product": product.model_dump(),
                "alternatives": [alt.model_dump() for alt in alternatives],
                "verdict": analysis.get("verdict", "Unable to generate verdict"),
                "pros_cons_analysis": {
                    "current": analysis.get("current_analysis", {"pros": [], "cons": []}),
                    "alternatives": analysis.get("alternatives_analysis", []),
                },
                "recommendation": analysis.get("recommendation"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": str(e), "code": "COMPARISON_ERROR"},
        )
