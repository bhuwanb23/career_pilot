# Ollama Timeout Fix

## Error
`LLMTimeoutError: Ollama request timed out`
`Agent loop: unparseable LLM response at step 0`

## Root Cause
Ollama is timing out when processing requests. This could be because:
1. Ollama is overloaded
2. Model is too large for system resources
3. Timeout is too short (currently 120 seconds)

## Fix Options
1. Increase timeout in llm_client.py
2. Use a smaller model
3. Add better error handling and fallback

## Key Files
- services/llm_client.py (timeout settings)
- config.py (model settings)
- routers/chat.py (error handling)
