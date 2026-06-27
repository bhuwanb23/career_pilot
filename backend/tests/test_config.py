from config import settings


def test_settings_defaults():
    assert settings.LLM_PROVIDER == "ollama"
    assert settings.OLLAMA_BASE_URL == "http://localhost:11434"
    assert settings.OLLAMA_MODEL == "llama3.2:1b"
    assert settings.GEMINI_MODEL == "gemini-2.0-flash"
    assert settings.MAX_UPLOAD_SIZE_MB == 5
    assert settings.LOG_LEVEL == "INFO"


def test_cors_origin_list():
    origins = settings.cors_origin_list
    assert isinstance(origins, list)
    assert "http://localhost:5173" in origins
    assert "http://localhost:3000" in origins


def test_gemini_api_key_empty_by_default():
    assert settings.GEMINI_API_KEY == ""
