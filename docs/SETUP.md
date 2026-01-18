# Setup Guide

## Prerequisites

### Required Software

1. **Node.js 18+** - JavaScript runtime
   ```bash
   # Check version
   node --version
   ```

2. **Python 3.11+** - Backend runtime
   ```bash
   # Check version
   python3 --version
   ```

3. **Docker & Docker Compose** - Container runtime
   ```bash
   # Check version
   docker --version
   docker-compose --version
   ```

### Optional Software

4. **LM Studio** - For local LLM support
   - Download from https://lmstudio.ai
   - Load a model like `Qwen2.5-7B-Instruct-GGUF`
   - Start the local server on port 1234

## Extension Setup

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Generate Icons

The extension needs PNG icons in multiple sizes. Generate them from the SVG:

```bash
# Using ImageMagick
cd extension/public/icons
for size in 16 32 48 128; do
  convert -background none -resize ${size}x${size} icon.svg icon${size}.png
done

# Or using rsvg-convert (librsvg)
for size in 16 32 48 128; do
  rsvg-convert -w $size -h $size icon.svg > icon${size}.png
done
```

### 3. Development Mode

```bash
npm run dev
```

This starts Vite with hot module replacement. The extension will auto-reload when you make changes.

### 4. Build for Production

```bash
# Chrome
npm run build:chrome

# Firefox
npm run build:firefox
```

### 5. Load Extension

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/dist/chrome` folder

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select `extension/dist/firefox/manifest.json`

**Safari:**
1. Requires Xcode and macOS
2. Run `xcrun safari-web-extension-converter extension/dist/safari`
3. Open the generated Xcode project
4. Build and run

## Backend Setup

### 1. Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` to configure:
- LLM provider and model
- API endpoints
- Scraper settings

### 2. Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The backend will be available at `http://localhost:8000`.

### 3. Local Development Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 4. Pull LLM Model (if using Ollama)

```bash
# If running Ollama locally
ollama pull qwen2.5:7b

# If using Docker
docker exec -it smart-browse-ollama ollama pull qwen2.5:7b
```

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "llm_status": "online"
}
```

### 2. Test Summarization

```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "url": "https://example.com",
      "title": "Test Page",
      "description": "A test",
      "text": "This is test content about AI and technology.",
      "page_type": "article"
    }
  }'
```

### 3. Test Extension

1. Open any webpage
2. Click the extension icon
3. Try the "Summary" tab to generate a summary
4. Try the "Chat" tab to ask questions

## Troubleshooting

### Extension Not Loading

- Check browser console for errors
- Verify manifest.json syntax
- Ensure all icon files exist

### Backend Connection Failed

- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS settings in `.env`
- Verify extension settings point to correct URL

### LLM Not Responding

- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Verify model is downloaded: `ollama list`
- Check Docker logs: `docker-compose logs ollama`

### Scraper Errors

- Playwright needs browser binaries: `playwright install chromium`
- Docker needs additional dependencies (handled in Dockerfile)
- Some sites may block automated access

## Development Tips

### Hot Reload

The extension uses Vite for fast development:
- Content scripts hot reload on save
- Popup UI updates automatically
- Background service worker may need manual reload

### Testing

```bash
# Extension
cd extension
npm run lint
npm run type-check

# Backend
cd backend
pytest
```

### Debugging

- **Extension**: Use browser DevTools (right-click extension popup → Inspect)
- **Background Script**: `chrome://extensions/` → click "Service Worker"
- **Backend**: Run with `--reload` flag for auto-restart
