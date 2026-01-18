# Smart Browse Assistant

AI-powered browser extension for webpage summaries and product comparisons.

## Features

- **Smart Summarization**: Automatically summarize any webpage with key points and sentiment analysis
- **Product Comparison**: Compare products with alternatives from across the web
- **Chat Interface**: Ask questions about the current page using AI
- **Cross-Browser Support**: Works on Chrome, Firefox, and Safari
- **Local LLM Support**: Use LM Studio for quick, offline responses
- **Privacy-Focused**: Process simple queries locally, complex ones via your own backend

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Extension (TS/React)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Content     │  │ Popup UI     │  │ Background Service      │ │
│  │ Script      │  │ (Chat)       │  │ Worker                  │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                                      │
          ▼ Local (simple queries)               ▼ Remote (complex)
┌─────────────────────┐              ┌─────────────────────────────┐
│ LM Studio Local     │              │ Python Backend (Docker)     │
│ - Qwen 2.5 7B       │              │ - FastAPI                   │
│ - Quick summaries   │              │ - Playwright scraper        │
└─────────────────────┘              │ - Ollama/vLLM integration   │
                                     └─────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose (for backend)
- LM Studio (optional, for local LLM)

### Extension Setup

```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:chrome  # Chrome
npm run build:firefox # Firefox
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Start with Docker Compose
docker-compose up -d

# Or run locally
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload
```

### Load Extension

**Chrome:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/chrome`

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/dist/firefox/manifest.json`

## Configuration

### Extension Settings

Access settings via the extension popup:

- **Backend URL**: API server endpoint (default: `http://localhost:8000`)
- **Local LLM URL**: LM Studio endpoint (default: `http://localhost:1234`)
- **Use Local LLM**: Toggle local processing for short content
- **Local LLM Threshold**: Character limit for local processing

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `ollama` | LLM provider (ollama, vllm, openai) |
| `LLM_MODEL` | `qwen2.5:7b` | Model to use |
| `LLM_BASE_URL` | `http://localhost:11434` | LLM API endpoint |
| `SCRAPER_HEADLESS` | `true` | Run browser in headless mode |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summarize` | POST | Summarize page content |
| `/api/analyze` | POST | Deep analysis of page |
| `/api/compare` | POST | Compare product with alternatives |
| `/api/chat` | POST | Chat with page context |
| `/health` | GET | Health check |

## Development

### Extension

```bash
cd extension
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Backend

```bash
cd backend
pip install -e ".[dev]"  # Install with dev dependencies
pytest                   # Run tests
black .                  # Format code
ruff check .             # Lint code
```

## Tech Stack

### Extension
- TypeScript
- React 18
- TailwindCSS
- Vite + CRXJS
- WebExtension Polyfill

### Backend
- Python 3.11+
- FastAPI
- Playwright
- BeautifulSoup4
- Pydantic

## License

MIT
