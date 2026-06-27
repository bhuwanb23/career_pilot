class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""


class LLMTimeoutError(LLMProviderError):
    """Raised when an LLM request times out."""


class LLMRateLimitError(LLMProviderError):
    """Raised when rate limited by the LLM provider."""


class LLMConfigError(LLMProviderError):
    """Raised when LLM provider is misconfigured (e.g. missing API key)."""
