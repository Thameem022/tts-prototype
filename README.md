# Realtime TTS Web App

This app streams TTS audio from Inworld via a FastAPI WebSocket backend and plays it in a React frontend using the Web Audio API. Everything can be built and served in a single Docker container (Nginx + Uvicorn).

## Prerequisites
- Docker (for containerized run)
- Node.js 20 and Python 3.11 (for local dev) — optional
- Inworld API key (Base64 Basic token) set as `INWORLD_API_KEY`

## Configuration via .env
Create a `.env` file inside the `backend/` folder:

```
# backend/.env
# INWORLD_API_KEY should be the Base64 token only (do not include the word "Basic")
INWORLD_API_KEY=YOUR_BASE64_BASIC_TOKEN
```

The backend automatically loads `backend/.env` at startup.

## Local Development (two processes)

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend (Vite):
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click Speak.

## Docker (single container)

Build and run using the env file (preferred):
```bash
cd "$(dirname "$0")"
docker build -t tts-webapp .
docker run -p 8080:80 \
  -v "$PWD/backend/.env":/backend/.env:ro \
  tts-webapp
```

Open http://localhost:8080

Alternatively, you can still pass the env inline:
```bash
docker run -p 8080:80 -e INWORLD_API_KEY=YOUR_BASE64_BASIC_TOKEN tts-webapp
```

## Notes
- The backend exposes a WebSocket at `/ws/tts`.
- The frontend connects to the same host and path and streams base64 PCM chunks.
- Ensure your `INWORLD_API_KEY` is the Base64 Basic token only.

## Gemini Chat Bot

We added a simple Gemini chat endpoint and UI alongside the TTS demo.

Backend:
- Endpoint: `POST /api/gemini/chat`
- Env: set `GEMINI_API_KEY` in `backend/.env` (copy from `backend/env.sample`)
- Dependency: `google-generativeai` is included in `backend/requirements.txt`

Example request body:

```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "model": "gemini-1.5-flash"
}
```

Frontend:
- The chat UI lives in `frontend/src/App.jsx` under the "Gemini Chat" section.
- Client helper `sendGeminiChat` is exported from `frontend/src/voices.js`.
