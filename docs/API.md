# API Documentation

Base URL: `http://localhost:8000`

## Endpoints

### Health Check

```
GET /health
```

Check API and LLM service status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "llm_status": "online"
}
```

---

### Summarize Page

```
POST /api/summarize
```

Generate a summary of webpage content.

**Request Body:**
```json
{
  "content": {
    "url": "https://example.com/article",
    "title": "Article Title",
    "description": "Article description",
    "text": "Full text content of the page...",
    "page_type": "article",
    "product": null
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "A concise summary of the content...",
    "key_points": [
      "First key point",
      "Second key point",
      "Third key point"
    ],
    "sentiment": "positive",
    "topics": ["technology", "AI"]
  }
}
```

---

### Analyze Page

```
POST /api/analyze
```

Perform deep analysis of webpage content.

**Request Body:**
```json
{
  "content": {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Page description",
    "text": "Full text content...",
    "page_type": "article"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Comprehensive summary...",
    "key_points": ["Point 1", "Point 2"],
    "sentiment": "neutral",
    "topics": ["topic1", "topic2"],
    "entities": ["Company X", "Person Y"],
    "questions": [
      "What is the main argument?",
      "How does this affect users?"
    ]
  }
}
```

---

### Compare Products

```
POST /api/compare
```

Compare a product with alternatives from across the web.

**Request Body:**
```json
{
  "url": "https://amazon.com/dp/B123456",
  "content": {
    "url": "https://amazon.com/dp/B123456",
    "title": "Product Name",
    "description": "Product description",
    "text": "Full page content...",
    "page_type": "product",
    "product": {
      "name": "Product Name",
      "price": 99.99,
      "currency": "USD",
      "images": ["https://..."],
      "description": "Product description",
      "rating": 4.5,
      "review_count": 1234,
      "availability": "in_stock",
      "brand": "Brand Name",
      "category": "Electronics"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_product": {
      "name": "Product Name",
      "price": 99.99,
      "currency": "USD",
      "rating": 4.5,
      "review_count": 1234
    },
    "alternatives": [
      {
        "name": "Alternative Product 1",
        "price": 89.99,
        "currency": "USD",
        "url": "https://...",
        "image": "https://...",
        "rating": 4.3,
        "source": "Amazon"
      }
    ],
    "verdict": "The current product offers good value...",
    "pros_cons_analysis": {
      "current": {
        "pros": ["Good build quality", "Fast shipping"],
        "cons": ["Higher price point"]
      },
      "alternatives": [
        {
          "name": "Alternative Product 1",
          "pros": ["Lower price"],
          "cons": ["Fewer features"]
        }
      ]
    },
    "recommendation": "Consider the current product for..."
  }
}
```

---

### Chat

```
POST /api/chat
```

Chat with AI using page content as context.

**Request Body:**
```json
{
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "What is this page about?",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "context": {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Description",
    "text": "Page content...",
    "page_type": "article"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-2",
      "role": "assistant",
      "content": "This page is about...",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  }
}
```

---

## Data Types

### PageContent

| Field | Type | Description |
|-------|------|-------------|
| url | string | Page URL |
| title | string | Page title |
| description | string | Meta description |
| text | string | Main text content |
| page_type | enum | "product", "article", "search", "other" |
| product | ProductInfo? | Product details (if applicable) |
| article | ArticleInfo? | Article details (if applicable) |

### ProductInfo

| Field | Type | Description |
|-------|------|-------------|
| name | string | Product name |
| price | number? | Price value |
| currency | string | Currency code (USD, EUR, etc.) |
| images | string[] | Image URLs |
| description | string | Product description |
| rating | number? | Rating (0-5) |
| review_count | number? | Number of reviews |
| availability | string | "in_stock", "out_of_stock", "unknown" |
| brand | string | Brand name |
| category | string | Product category |

### ChatMessage

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique message ID |
| role | enum | "user", "assistant", "system" |
| content | string | Message content |
| timestamp | string | ISO 8601 timestamp |

---

## Error Responses

All errors follow this format:

```json
{
  "detail": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| SUMMARIZATION_ERROR | Failed to generate summary |
| ANALYSIS_ERROR | Failed to analyze page |
| COMPARISON_ERROR | Failed to compare products |
| CHAT_ERROR | Failed to generate chat response |
| NO_PRODUCT_INFO | Page doesn't contain product information |

---

## Rate Limits

Currently no rate limits are enforced. For production deployments, consider implementing:
- Request rate limiting
- Token-based authentication
- Request size limits
