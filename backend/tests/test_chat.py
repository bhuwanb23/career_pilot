from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

from models import ChatMessage


SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'

MOCK_LLM_RESPONSE = "I'm CareerPilot, your AI career assistant. How can I help you today?"


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
        yield "from CareerPilot!"

    mock_provider.generate_stream = mock_stream
    with patch("services.llm_client.get_llm_provider", return_value=mock_provider):
        yield mock_provider


def _create_profile(client, mock_llm):
    mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
    with open(SAMPLE_PDF, "rb") as f:
        client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})


class TestChatHistory:
    def test_history_empty(self, client):
        r = client.get("/api/chat/history")
        assert r.status_code == 200
        assert r.json() == []

    def test_history_with_session_id_filter(self, client, db_session):
        msg = ChatMessage(session_id="test-session-1", role="user", content="Hello")
        db_session.add(msg)
        db_session.commit()

        r = client.get("/api/chat/history?session_id=test-session-1")
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["session_id"] == "test-session-1"

    def test_history_excludes_other_sessions(self, client, db_session):
        db_session.add(ChatMessage(session_id="s1", role="user", content="msg1"))
        db_session.add(ChatMessage(session_id="s2", role="user", content="msg2"))
        db_session.commit()

        r = client.get("/api/chat/history?session_id=s1")
        assert len(r.json()) == 1
        assert r.json()[0]["content"] == "msg1"


class TestChatSessions:
    def test_sessions_empty(self, client):
        r = client.get("/api/chat/sessions")
        assert r.status_code == 200
        assert r.json() == []

    def test_sessions_lists_all(self, client, db_session):
        db_session.add(ChatMessage(session_id="s1", role="user", content="Hello"))
        db_session.add(ChatMessage(session_id="s1", role="assistant", content="Hi there"))
        db_session.add(ChatMessage(session_id="s2", role="user", content="Bye"))
        db_session.commit()

        r = client.get("/api/chat/sessions")
        assert r.status_code == 200
        sessions = r.json()
        assert len(sessions) == 2
        assert sessions[0]["session_id"] in ("s1", "s2")
        assert "message_count" in sessions[0]
        assert "last_message" in sessions[0]


class TestChatMessageStorage:
    def test_user_message_stored_with_session_id(self, client, mock_llm):
        _create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_LLM_RESPONSE
        from routers.chat import process_chat_message
        from database import SessionLocal
        from uuid import uuid4

        db = SessionLocal()
        session_id = str(uuid4())

        import asyncio
        asyncio.run(process_chat_message(db, session_id, "Hello"))

        msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
        assert len(msgs) >= 1
        user_msgs = [m for m in msgs if m.role == "user"]
        assert len(user_msgs) == 1
        assert user_msgs[0].content == "Hello"
        assert user_msgs[0].session_id == session_id
        db.close()

    def test_assistant_response_stored_actual_content(self, client, mock_llm):
        _create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_LLM_RESPONSE
        from routers.chat import process_chat_message
        from database import SessionLocal
        from uuid import uuid4

        db = SessionLocal()
        session_id = str(uuid4())

        import asyncio
        asyncio.run(process_chat_message(db, session_id, "What can you do?"))

        msgs = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id,
            ChatMessage.role == "assistant",
        ).all()
        assert len(msgs) == 1
        assert msgs[0].content != "Response sent"
        assert len(msgs[0].content) > 0
        db.close()


class TestRESTChatWorkflow:
    def test_hello_returns_general_chat(self, client, mock_llm):
        mock_llm.generate.return_value = "Hello! How can I help?"
        r = client.post("/api/chat", json={"content": "hello"})
        assert r.status_code == 200
        data = r.json()
        assert data["intent"] == "general_chat"
        assert len(data["response"]) > 0

    def test_show_profile_returns_content(self, client, mock_llm):
        _create_profile(client, mock_llm)
        r = client.post("/api/chat", json={"content": "show my profile"})
        assert r.status_code == 200
        data = r.json()
        assert data["intent"] == "show_profile"
        assert len(data["response"]) > 0
        assert "profile" in data["response"].lower() or "skills" in data["response"].lower()

    def test_llm_failure_returns_503(self, client, mock_llm):
        from services.exceptions import LLMProviderError
        mock_llm.generate.side_effect = LLMProviderError("Ollama down")
        r = client.post("/api/chat", json={"content": "hello"})
        assert r.status_code == 503
        assert "Ollama" in r.json()["detail"]


class TestConversationContext:
    def test_history_includes_previous_messages(self, client, db_session):
        session_id = "ctx-test-session"
        from datetime import datetime, timezone
        t1 = datetime(2025, 1, 1, tzinfo=timezone.utc)
        t2 = datetime(2025, 1, 2, tzinfo=timezone.utc)
        t3 = datetime(2025, 1, 3, tzinfo=timezone.utc)
        db_session.add(ChatMessage(session_id=session_id, role="user", content="What is Python?", created_at=t1))
        db_session.add(ChatMessage(session_id=session_id, role="assistant", content="Python is a programming language.", created_at=t2))
        db_session.add(ChatMessage(session_id=session_id, role="user", content="What is React?", created_at=t3))
        db_session.commit()

        from routers.chat import get_conversation_history
        history = get_conversation_history(db_session, session_id)
        assert len(history) == 3
        assert history[0]["role"] == "user"
        assert history[0]["content"] == "What is Python?"
        assert history[1]["role"] == "assistant"
        assert history[2]["role"] == "user"

    def test_history_excludes_placeholder_messages(self, client, db_session):
        session_id = "placeholder-test"
        db_session.add(ChatMessage(session_id=session_id, role="user", content="Hello"))
        db_session.add(ChatMessage(session_id=session_id, role="assistant", content="Response sent"))
        db_session.commit()

        from routers.chat import get_conversation_history
        history = get_conversation_history(db_session, session_id)
        assert len(history) == 1
        assert history[0]["content"] == "Hello"

    def test_build_chat_prompt_without_history(self):
        from routers.chat import build_chat_prompt
        prompt = build_chat_prompt("Hello", [], "")
        assert "User: Hello" in prompt

    def test_build_chat_prompt_with_history(self):
        from routers.chat import build_chat_prompt
        history = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"},
        ]
        prompt = build_chat_prompt("How are you?", history, "")
        assert "[Recent Conversation]" in prompt
        assert "User: Hi" in prompt
        assert "Assistant: Hello!" in prompt
        assert "User: How are you?" in prompt

    def test_build_chat_prompt_with_profile(self):
        from routers.chat import build_chat_prompt
        prompt = build_chat_prompt("Hello", [], '{"skills": ["Python"]}')
        assert "[User Profile]" in prompt
        assert "Python" in prompt


class TestIntentDetection:
    def test_intent_upload_resume(self):
        from routers.chat import detect_intent
        assert detect_intent("upload my resume") == "upload_resume"
        assert detect_intent("parse my resume") == "upload_resume"

    def test_intent_analyze_job(self):
        from routers.chat import detect_intent
        assert detect_intent("analyze this job description") == "analyze_job"
        assert detect_intent("analyze this role") == "analyze_job"

    def test_intent_prepare_interview(self):
        from routers.chat import detect_intent
        assert detect_intent("prepare for interview") == "prepare_interview"
        assert detect_intent("interview prep") == "prepare_interview"

    def test_intent_show_applications(self):
        from routers.chat import detect_intent
        assert detect_intent("show my applications") == "show_applications"
        assert detect_intent("list tracker") == "show_applications"

    def test_intent_show_profile(self):
        from routers.chat import detect_intent
        assert detect_intent("check my profile") == "show_profile"
        assert detect_intent("my skills") == "show_profile"
        assert detect_intent("my experience") == "show_profile"

    def test_intent_general_chat(self):
        from routers.chat import detect_intent
        assert detect_intent("hello there") == "general_chat"
        assert detect_intent("what is 2+2") == "general_chat"
