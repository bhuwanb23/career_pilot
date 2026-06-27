import pytest

from services.exceptions import (
    LLMConfigError,
    LLMProviderError,
    LLMRateLimitError,
    LLMTimeoutError,
)


def test_exceptions_inherit_from_base():
    assert issubclass(LLMTimeoutError, LLMProviderError)
    assert issubclass(LLMRateLimitError, LLMProviderError)
    assert issubclass(LLMConfigError, LLMProviderError)
    assert issubclass(LLMProviderError, Exception)


def test_exceptions_catch_as_base():
    with pytest.raises(LLMProviderError):
        raise LLMTimeoutError("timeout")

    with pytest.raises(LLMProviderError):
        raise LLMRateLimitError("rate limited")

    with pytest.raises(LLMProviderError):
        raise LLMConfigError("missing key")


def test_exceptions_carry_message():
    e = LLMTimeoutError("connection timed out")
    assert str(e) == "connection timed out"

    e = LLMConfigError("GEMINI_API_KEY is required")
    assert "GEMINI_API_KEY" in str(e)
