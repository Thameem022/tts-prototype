import os
import json
import base64
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Load .env from the backend directory if present
try:
	from dotenv import load_dotenv
	_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
	load_dotenv(os.path.join(_BACKEND_DIR, '.env'))
except Exception:
	# dotenv is optional; ignore if not installed
	pass


app = FastAPI()

# Allow frontend access (restrict origins in production)
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


INWORLD_API_KEY = os.getenv("INWORLD_API_KEY")
TTS_URL = "https://api.inworld.ai/tts/v1/voice:stream"


async def _stream_inworld_tts(payload: dict) -> AsyncIterator[str]:
	if not INWORLD_API_KEY:
		raise RuntimeError("Missing INWORLD_API_KEY environment variable")

	headers = {
		"Authorization": f"Basic {INWORLD_API_KEY}",
		"Content-Type": "application/json",
	}

	async with httpx.AsyncClient(timeout=None) as client:
		async with client.stream("POST", TTS_URL, json=payload, headers=headers) as response:
			response.raise_for_status()
			async for line in response.aiter_lines():
				if not line:
					continue
				yield line


@app.websocket("/ws/tts")
async def tts_websocket(ws: WebSocket):
	await ws.accept()
	try:
		data = await ws.receive_text()
		payload = json.loads(data)

		async for line in _stream_inworld_tts(payload):
			try:
				chunk = json.loads(line)
				# Expect { result: { audioContent: base64 } }
				audio_chunk = chunk["result"]["audioContent"]
				await ws.send_text(audio_chunk)
			except Exception:
				# If the line isn't a JSON audio chunk, ignore silently
				continue

		await ws.close()
	except Exception as e:
		# Send error back to client in JSON format
		await ws.send_text(json.dumps({"error": str(e)}))
		await ws.close()


