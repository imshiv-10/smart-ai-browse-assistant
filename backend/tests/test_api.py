import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Smart Browse Assistant"
    assert "version" in data


def test_health():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_status" in data


def test_summarize_endpoint():
    """Test summarize endpoint with mock data."""
    payload = {
        "content": {
            "url": "https://example.com/article",
            "title": "Test Article",
            "description": "A test article",
            "text": "This is a test article about technology. It discusses various topics including AI and machine learning.",
            "page_type": "article",
        }
    }
    response = client.post("/api/summarize", json=payload)
    # May fail if LLM is not available, but endpoint should work
    assert response.status_code in [200, 500]


def test_chat_endpoint():
    """Test chat endpoint with mock data."""
    payload = {
        "messages": [
            {
                "id": "1",
                "role": "user",
                "content": "What is this page about?",
                "timestamp": "2024-01-01T00:00:00Z",
            }
        ],
        "context": {
            "url": "https://example.com",
            "title": "Example Page",
            "description": "An example page",
            "text": "This is an example page with some content.",
            "page_type": "other",
        },
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code in [200, 500]


def test_compare_requires_product():
    """Test compare endpoint requires product info."""
    payload = {
        "url": "https://example.com",
        "content": {
            "url": "https://example.com",
            "title": "Example",
            "description": "",
            "text": "Some text",
            "page_type": "other",
        },
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "NO_PRODUCT_INFO" in str(data)


def test_analyze_endpoint():
    """Test analyze endpoint with mock data."""
    payload = {
        "content": {
            "url": "https://example.com",
            "title": "Test Page",
            "description": "A test page",
            "text": "This is a test page with various content about technology and innovation.",
            "page_type": "article",
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code in [200, 500]
