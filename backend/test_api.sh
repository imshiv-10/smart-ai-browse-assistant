#!/bin/bash

echo "Testing /api/summarize..."
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"content": {"url": "https://example.com", "title": "Test Page", "text": "AI is transforming industries worldwide with machine learning.", "page_type": "article"}}'

echo ""
echo ""
echo "Testing /api/chat..."
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"id": "1", "role": "user", "content": "What is this about?", "timestamp": "2024-01-01T00:00:00Z"}], "context": {"url": "https://example.com", "title": "AI Article", "text": "Artificial intelligence is revolutionizing technology.", "page_type": "article"}}'

echo ""
