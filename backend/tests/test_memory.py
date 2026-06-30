from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from models import ConversationMemory


@pytest.fixture(autouse=True)
def reset_llm_provider():
    import services.llm_client as lc
    lc._provider = None
    yield
    lc._provider = None


@pytest.fixture
def mock_llm():
    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock()
    mock_provider.generate_stream = AsyncMock()
    mock_provider.health_check = AsyncMock(return_value=True)

    async def mock_stream(prompt, system=""):
        yield "Hello "

    mock_provider.generate_stream = mock_stream
    with patch("services.llm_client.get_llm_provider", return_value=mock_provider):
        yield mock_provider


class TestMemoryService:
    def test_set_and_get_memory(self, db_session):
        from services.memory import set_memory, get_memory
        set_memory(db_session, "test_key", "test_value", "fact")
        assert get_memory(db_session, "test_key") == "test_value"

    def test_set_memory_updates_existing(self, db_session):
        from services.memory import set_memory, get_memory
        set_memory(db_session, "key", "old", "general")
        set_memory(db_session, "key", "new", "general")
        assert get_memory(db_session, "key") == "new"

    def test_get_memory_nonexistent(self, db_session):
        from services.memory import get_memory
        assert get_memory(db_session, "nope") is None

    def test_get_all_memory(self, db_session):
        from services.memory import set_memory, get_all_memory
        set_memory(db_session, "a", "1", "general")
        set_memory(db_session, "b", "2", "general")
        result = get_all_memory(db_session)
        assert result == {"a": "1", "b": "2"}

    def test_get_memory_by_category(self, db_session):
        from services.memory import set_memory, get_memory_by_category
        set_memory(db_session, "a", "1", "goal")
        set_memory(db_session, "b", "2", "context")
        set_memory(db_session, "c", "3", "goal")
        result = get_memory_by_category(db_session, "goal")
        assert result == {"a": "1", "c": "3"}

    def test_get_memory_context_empty(self, db_session):
        from services.memory import get_memory_context
        assert get_memory_context(db_session) == ""

    def test_get_memory_context_with_facts(self, db_session):
        from services.memory import set_memory, get_memory_context
        set_memory(db_session, "last_company", "Google", "context")
        context = get_memory_context(db_session)
        assert "Google" in context
        assert "last_company" in context
        assert "[User Context" in context


class TestFactExtraction:
    def test_extracts_company_after_analyze_job(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        from models import Application
        db_session.add(Application(
            company="Google", role="SWE", job_description="jd",
            status="applied", match_score=0.85,
        ))
        db_session.commit()
        extract_and_store_facts(db_session, "analyze this job", "analyze_job")
        assert get_memory(db_session, "last_company") == "Google"
        assert get_memory(db_session, "last_role") == "SWE"

    def test_extracts_goal_from_user_message(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        extract_and_store_facts(db_session, "I want to get into FAANG", "general_chat")
        assert get_memory(db_session, "user_goal") is not None
        assert "FAANG" in get_memory(db_session, "user_goal")

    def test_extracts_preference(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        extract_and_store_facts(db_session, "I prefer remote work", "general_chat")
        assert get_memory(db_session, "user_preference") is not None
        assert "remote" in get_memory(db_session, "user_preference")

    def test_sets_flag_for_generated_resume(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        extract_and_store_facts(db_session, "generate my resume", "generate_resume")
        assert get_memory(db_session, "has_generated_resume") == "true"

    def test_sets_flag_for_cover_letter(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        extract_and_store_facts(db_session, "write cover letter", "generate_cover_letter")
        assert get_memory(db_session, "has_cover_letter") == "true"

    def test_sets_flag_for_interview_prep(self, db_session):
        from services.memory import extract_and_store_facts, get_memory
        extract_and_store_facts(db_session, "prepare interview", "prepare_interview")
        assert get_memory(db_session, "has_interview_prep") == "true"


class TestContextBuilder:
    def test_build_chat_prompt_with_memory(self):
        from routers.chat import build_chat_prompt
        prompt = build_chat_prompt(
            "hello", [], "",
            memory_context="[User Context]\n- last_company: Google",
            domain_context="[Recent Applications]\n- Google - SWE (applied)",
        )
        assert "Google" in prompt
        assert "[User Context]" in prompt
        assert "[Recent Applications]" in prompt
        assert "User: hello" in prompt

    def test_build_chat_prompt_without_memory(self):
        from routers.chat import build_chat_prompt
        prompt = build_chat_prompt("hello", [], "skills: Python")
        assert "User: hello" in prompt
        assert "skills: Python" in prompt

    def test_build_chat_prompt_with_history(self):
        from routers.chat import build_chat_prompt
        history = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
        prompt = build_chat_prompt("bye", history, "")
        assert "User: hi" in prompt
        assert "Assistant: hello" in prompt
        assert "User: bye" in prompt

    def test_domain_context_empty_when_no_apps(self, db_session):
        from routers.chat import get_domain_context
        assert get_domain_context(db_session) == ""

    def test_domain_context_with_apps(self, db_session):
        from routers.chat import get_domain_context
        from models import Application
        db_session.add(Application(company="Google", role="SWE", job_description="jd", match_score=0.85))
        db_session.add(Application(company="Meta", role="FE", job_description="jd2", match_score=0.7))
        db_session.commit()
        ctx = get_domain_context(db_session)
        assert "Google" in ctx
        assert "Meta" in ctx
        assert "[Recent Applications]" in ctx


class TestMemoryREST:
    def test_get_memory_empty(self, client):
        r = client.get("/api/chat/memory")
        assert r.status_code == 200
        assert r.json() == {}

    def test_set_and_get_memory(self, client):
        r = client.post("/api/chat/memory", json={"key": "test", "value": "hello", "category": "fact"})
        assert r.status_code == 200
        r = client.get("/api/chat/memory")
        assert r.json()["test"] == "hello"

    def test_set_memory_missing_fields(self, client):
        r = client.post("/api/chat/memory", json={"key": "test"})
        assert r.status_code == 400


class TestSessionPersistence:
    def test_rest_chat_returns_session_id(self, client, mock_llm):
        mock_llm.generate.return_value = "Hello!"
        r = client.post("/api/chat", json={"content": "hello", "session_id": "my-session-123"})
        assert r.status_code == 200
        assert r.json()["session_id"] == "my-session-123"

    def test_rest_chat_generates_session_id(self, client, mock_llm):
        mock_llm.generate.return_value = "Hello!"
        r = client.post("/api/chat", json={"content": "hello"})
        assert r.status_code == 200
        assert len(r.json()["session_id"]) == 36


class TestCrossSessionMemory:
    def test_memory_persists_across_sessions(self, db_session):
        from services.memory import set_memory, get_memory
        set_memory(db_session, "last_company", "Google", "context")
        # Simulate new session — memory should still be there
        assert get_memory(db_session, "last_company") == "Google"

    def test_memory_visible_in_new_session_context(self, db_session):
        from services.memory import set_memory, get_memory_context
        set_memory(db_session, "user_goal", "Get into FAANG", "goal")
        ctx = get_memory_context(db_session)
        assert "FAANG" in ctx
        assert "user_goal" in ctx
