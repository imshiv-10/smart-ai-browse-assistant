import json
import httpx
from typing import Any
from ..config import get_settings
from ..models.prompts import (
    SUMMARIZE_SYSTEM,
    SUMMARIZE_USER,
    COMPARE_SYSTEM,
    COMPARE_USER,
    CHAT_SYSTEM,
    ANALYZE_SYSTEM,
    ANALYZE_USER,
    format_product_info,
    format_alternatives,
)

settings = get_settings()


class LLMService:
    """Service for interacting with LLM providers (Ollama, vLLM, OpenAI)."""

    def __init__(self):
        self.provider = settings.llm_provider
        self.model = settings.llm_model
        self.base_url = settings.llm_base_url
        self.api_key = settings.llm_api_key
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens

    async def health_check(self) -> bool:
        """Check if the LLM service is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                if self.provider == "ollama":
                    response = await client.get(f"{self.base_url}/api/tags")
                elif self.provider == "vllm":
                    response = await client.get(f"{self.base_url}/v1/models")
                else:  # OpenAI-compatible
                    response = await client.get(
                        f"{self.base_url}/v1/models",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                    )
                return response.status_code == 200
        except Exception:
            return False

    async def _call_ollama(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Call Ollama API."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                    "options": {
                        "temperature": self.temperature,
                        "num_predict": self.max_tokens,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def _call_openai_compatible(
        self,
        system_prompt: str,
        user_prompt: str,
        messages: list[dict] | None = None,
    ) -> str:
        """Call OpenAI-compatible API (vLLM, OpenAI, etc.)."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        if messages:
            chat_messages = [{"role": "system", "content": system_prompt}]
            chat_messages.extend(messages)
        else:
            chat_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": chat_messages,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _generate(
        self,
        system_prompt: str,
        user_prompt: str,
        messages: list[dict] | None = None,
    ) -> str:
        """Generate response using configured provider."""
        if self.provider == "ollama":
            return await self._call_ollama(system_prompt, user_prompt)
        else:
            return await self._call_openai_compatible(
                system_prompt, user_prompt, messages
            )

    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from LLM response."""
        # Try to extract JSON from the response
        try:
            # Find JSON block
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass

        # Return empty dict if parsing fails
        return {}

    async def summarize(self, content: dict) -> dict:
        """Summarize page content."""
        product_info = format_product_info(content.get("product"))

        user_prompt = SUMMARIZE_USER.format(
            title=content.get("title", ""),
            url=content.get("url", ""),
            page_type=content.get("page_type", "other"),
            content=content.get("text", "")[:8000],
            product_info=product_info,
        )

        response = await self._generate(SUMMARIZE_SYSTEM, user_prompt)
        parsed = self._parse_json_response(response)

        return {
            "summary": parsed.get("summary", response),
            "key_points": parsed.get("key_points", []),
            "sentiment": parsed.get("sentiment"),
            "topics": parsed.get("topics", []),
        }

    async def analyze(self, content: dict) -> dict:
        """Perform deep analysis of page content."""
        product_info = format_product_info(content.get("product"))

        user_prompt = ANALYZE_USER.format(
            title=content.get("title", ""),
            url=content.get("url", ""),
            page_type=content.get("page_type", "other"),
            content=content.get("text", "")[:8000],
            product_info=product_info,
        )

        response = await self._generate(ANALYZE_SYSTEM, user_prompt)
        parsed = self._parse_json_response(response)

        return {
            "summary": parsed.get("summary", response),
            "key_points": parsed.get("key_points", []),
            "sentiment": parsed.get("sentiment"),
            "topics": parsed.get("topics", []),
            "entities": parsed.get("entities", []),
            "questions": parsed.get("questions", []),
        }

    async def compare_products(
        self,
        current_product: dict,
        alternatives: list[dict],
    ) -> dict:
        """Compare current product with alternatives."""
        alternatives_text = format_alternatives(alternatives)

        user_prompt = COMPARE_USER.format(
            product_name=current_product.get("name", "Unknown"),
            product_price=current_product.get("price", "N/A"),
            product_currency=current_product.get("currency", "USD"),
            product_rating=current_product.get("rating", "N/A"),
            product_reviews=current_product.get("review_count", "N/A"),
            product_brand=current_product.get("brand", "Unknown"),
            alternatives=alternatives_text,
        )

        response = await self._generate(COMPARE_SYSTEM, user_prompt)
        parsed = self._parse_json_response(response)

        return {
            "verdict": parsed.get("verdict", "Unable to generate comparison"),
            "current_analysis": parsed.get(
                "current_analysis", {"pros": [], "cons": []}
            ),
            "alternatives_analysis": parsed.get("alternatives_analysis", []),
            "recommendation": parsed.get("recommendation"),
        }

    async def chat(self, messages: list[dict], context: dict) -> str:
        """Chat with context from page content."""
        product_info = format_product_info(context.get("product"))

        system_prompt = CHAT_SYSTEM.format(
            title=context.get("title", ""),
            url=context.get("url", ""),
            page_type=context.get("page_type", "other"),
            content=context.get("text", "")[:6000],
            product_info=product_info,
        )

        # Convert messages to the format expected by the API
        chat_messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages
            if msg["role"] in ("user", "assistant")
        ]

        return await self._generate(
            system_prompt,
            "",  # Empty user prompt, using messages instead
            messages=chat_messages,
        )
