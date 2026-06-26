import json
from typing import AsyncGenerator

import httpx

from config import OLLAMA_BASE_URL, OLLAMA_MODEL


async def generate(prompt: str, system: str = "") -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()["response"]


async def generate_stream(prompt: str, system: str = "") -> AsyncGenerator[str, None]:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=120,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                chunk = json.loads(line)
                text = chunk.get("response", "")
                if text:
                    yield text


async def health_check() -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            return resp.status_code == 200
    except Exception:
        return False
