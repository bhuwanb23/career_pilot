import json
import logging
from typing import AsyncGenerator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import settings
from services.exceptions import LLMConfigError, LLMProviderError, LLMTimeoutError

logger = logging.getLogger(__name__)


class OllamaProvider:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=settings.OLLAMA_BASE_URL,
            timeout=120,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)),
        reraise=True,
    )
    async def generate(self, prompt: str, system: str = "") -> str:
        payload = {"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system

        logger.debug("Ollama generate: model=%s prompt_len=%d", settings.OLLAMA_MODEL, len(prompt))
        try:
            resp = await self._client.post("/api/generate", json=payload)
            resp.raise_for_status()
            result = resp.json()["response"]
            logger.debug("Ollama response: len=%d", len(result))
            return result
        except httpx.TimeoutException as e:
            raise LLMTimeoutError(f"Ollama request timed out: {e}") from e
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                raise
            raise LLMProviderError(f"Ollama error {e.response.status_code}: {e}") from e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)),
        reraise=True,
    )
    async def generate_stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        payload = {"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": True}
        if system:
            payload["system"] = system

        logger.debug("Ollama stream: model=%s prompt_len=%d", settings.OLLAMA_MODEL, len(prompt))
        try:
            async with self._client.stream("POST", "/api/generate", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    chunk = json.loads(line)
                    text = chunk.get("response", "")
                    if text:
                        yield text
        except httpx.TimeoutException as e:
            raise LLMTimeoutError(f"Ollama stream timed out: {e}") from e
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                raise
            raise LLMProviderError(f"Ollama stream error {e.response.status_code}: {e}") from e

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get("/api/tags", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False


class GeminiProvider:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise LLMConfigError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(settings.GEMINI_MODEL)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def generate(self, prompt: str, system: str = "") -> str:
        import google.generativeai as genai

        model = self._model
        if system:
            model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                system_instruction=system,
            )

        logger.debug("Gemini generate: model=%s prompt_len=%d", settings.GEMINI_MODEL, len(prompt))
        try:
            response = await model.generate_content_async(prompt)
            result = response.text
            logger.debug("Gemini response: len=%d", len(result))
            return result
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                raise LLMProviderError(f"Gemini rate limit: {e}") from e
            raise LLMProviderError(f"Gemini error: {e}") from e

    async def generate_stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        import google.generativeai as genai

        model = self._model
        if system:
            model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                system_instruction=system,
            )

        logger.debug("Gemini stream: model=%s prompt_len=%d", settings.GEMINI_MODEL, len(prompt))
        try:
            response = await model.generate_content_async(prompt, stream=True)
            async for chunk in response.async_iter():
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                raise LLMProviderError(f"Gemini stream rate limit: {e}") from e
            raise LLMProviderError(f"Gemini stream error: {e}") from e

    async def health_check(self) -> bool:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)
            models = genai.list_models()
            return True
        except Exception:
            return False


_provider = None


def get_llm_provider():
    global _provider
    if _provider is None:
        if settings.LLM_PROVIDER == "gemini":
            _provider = GeminiProvider()
        else:
            _provider = OllamaProvider()
        logger.info("LLM provider initialized: %s", settings.LLM_PROVIDER)
    return _provider


async def generate(prompt: str, system: str = "") -> str:
    return await get_llm_provider().generate(prompt, system)


async def generate_stream(prompt: str, system: str = "") -> AsyncGenerator[str, None]:
    async for chunk in get_llm_provider().generate_stream(prompt, system):
        yield chunk


async def health_check() -> bool:
    return await get_llm_provider().health_check()
