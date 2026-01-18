"""LLM prompts for various tasks."""

SUMMARIZE_SYSTEM = """You are a helpful assistant that summarizes web pages concisely and accurately.
Your summaries should be informative, well-structured, and highlight the most important information."""

SUMMARIZE_USER = """Please summarize the following web page content.

Title: {title}
URL: {url}
Page Type: {page_type}

Content:
{content}

{product_info}

Provide your response as JSON with this structure:
{{
    "summary": "A 2-3 sentence summary of the main content",
    "key_points": ["key point 1", "key point 2", "key point 3"],
    "sentiment": "positive" | "negative" | "neutral",
    "topics": ["topic1", "topic2"]
}}

Only return valid JSON, no additional text."""

COMPARE_SYSTEM = """You are an expert product analyst who compares products objectively.
You provide detailed, balanced comparisons highlighting strengths and weaknesses of each option.
Be specific and data-driven in your analysis."""

COMPARE_USER = """Compare the following product with its alternatives.

Current Product:
- Name: {product_name}
- Price: {product_currency} {product_price}
- Rating: {product_rating}/5 ({product_reviews} reviews)
- Brand: {product_brand}

Alternatives:
{alternatives}

Provide your analysis as JSON with this structure:
{{
    "verdict": "A brief overall verdict (1-2 sentences)",
    "current_analysis": {{
        "pros": ["pro 1", "pro 2"],
        "cons": ["con 1", "con 2"]
    }},
    "alternatives_analysis": [
        {{
            "name": "Alternative name",
            "pros": ["pro 1", "pro 2"],
            "cons": ["con 1", "con 2"]
        }}
    ],
    "recommendation": "Your recommendation based on value, quality, and price"
}}

Only return valid JSON, no additional text."""

CHAT_SYSTEM = """You are a helpful assistant that helps users understand and interact with web pages.
You have access to the following page content:

Title: {title}
URL: {url}
Page Type: {page_type}

Content:
{content}

{product_info}

Answer questions about this page helpfully and accurately.
If asked about something not on the page, say so clearly.
Be concise but thorough in your responses."""

ANALYZE_SYSTEM = """You are an expert content analyst who provides deep insights into web content.
You identify key themes, extract entities, and generate thoughtful questions about the content."""

ANALYZE_USER = """Provide a deep analysis of the following web page content.

Title: {title}
URL: {url}
Page Type: {page_type}

Content:
{content}

{product_info}

Provide your analysis as JSON with this structure:
{{
    "summary": "A comprehensive 3-4 sentence summary",
    "key_points": ["detailed key point 1", "detailed key point 2", "detailed key point 3"],
    "sentiment": "positive" | "negative" | "neutral",
    "topics": ["main topic 1", "main topic 2", "main topic 3"],
    "entities": ["person/company/product names mentioned"],
    "questions": ["Interesting question about the content 1", "Question 2", "Question 3"]
}}

Only return valid JSON, no additional text."""


def format_product_info(product: dict | None) -> str:
    """Format product info for prompts."""
    if not product:
        return ""

    lines = ["Product Information:"]
    if product.get("name"):
        lines.append(f"- Name: {product['name']}")
    if product.get("price"):
        lines.append(f"- Price: {product.get('currency', 'USD')} {product['price']}")
    if product.get("rating"):
        reviews = product.get("review_count", "N/A")
        lines.append(f"- Rating: {product['rating']}/5 ({reviews} reviews)")
    if product.get("brand"):
        lines.append(f"- Brand: {product['brand']}")
    if product.get("availability"):
        lines.append(f"- Availability: {product['availability']}")
    if product.get("description"):
        desc = product["description"][:500]
        lines.append(f"- Description: {desc}")

    return "\n".join(lines)


def format_alternatives(alternatives: list[dict]) -> str:
    """Format alternatives list for prompts."""
    if not alternatives:
        return "No alternatives found."

    lines = []
    for i, alt in enumerate(alternatives, 1):
        alt_lines = [f"\nAlternative {i}:"]
        alt_lines.append(f"- Name: {alt.get('name', 'Unknown')}")
        if alt.get("price"):
            alt_lines.append(f"- Price: {alt.get('currency', 'USD')} {alt['price']}")
        if alt.get("rating"):
            alt_lines.append(f"- Rating: {alt['rating']}/5")
        alt_lines.append(f"- Source: {alt.get('source', 'Unknown')}")
        lines.extend(alt_lines)

    return "\n".join(lines)
