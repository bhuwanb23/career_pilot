import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'


@pytest.fixture(autouse=True)
def reset_llm():
    import services.llm_client as lc
    lc._provider = None
    yield
    lc._provider = None


@pytest.fixture
def mock_llm():
    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock()
    with patch("services.llm_client.get_llm_provider", return_value=mock_provider):
        yield mock_provider


class TestCareerMemoryService:
    def test_store_and_get(self, db_session):
        from services.career_memory import store_memory, get_memory_value
        store_memory(db_session, "preference", "work_style", "remote")
        assert get_memory_value(db_session, "preference", "work_style") == "remote"

    def test_upsert(self, db_session):
        from services.career_memory import store_memory, get_memory_value
        store_memory(db_session, "preference", "work_style", "remote")
        store_memory(db_session, "preference", "work_style", "hybrid")
        assert get_memory_value(db_session, "preference", "work_style") == "hybrid"

    def test_get_by_category(self, db_session):
        from services.career_memory import store_memory, get_memory_by_category
        store_memory(db_session, "skill", "python", "5 years")
        store_memory(db_session, "skill", "react", "3 years")
        store_memory(db_session, "preference", "work_style", "remote")
        skills = get_memory_by_category(db_session, "skill")
        assert len(skills) == 2

    def test_delete_memory(self, db_session):
        from services.career_memory import store_memory, delete_memory, get_memory_value
        store_memory(db_session, "test", "key", "value")
        mem = db_session.query(__import__("models", fromlist=["CareerMemory"]).CareerMemory).filter_by(key="key").first()
        assert delete_memory(db_session, mem.id)
        assert get_memory_value(db_session, "test", "key") is None

    def test_store_resume_version(self, db_session):
        from services.career_memory import store_resume_version, get_memory_by_category
        store_resume_version(db_session, {"skills": ["Python"], "summary": "Dev"}, 1)
        versions = get_memory_by_category(db_session, "version")
        assert len(versions) == 1
        assert "v1" in versions[0]["key"]

    def test_store_skill_snapshot(self, db_session):
        from services.career_memory import store_skill_snapshot, get_memory_by_category
        store_skill_snapshot(db_session, ["Python", "React", "SQL"])
        skills = get_memory_by_category(db_session, "skill")
        assert len(skills) == 1
        assert "Python" in skills[0]["value"]

    def test_store_preference(self, db_session):
        from services.career_memory import store_preference, get_memory_by_category
        store_preference(db_session, "work_style", "remote")
        prefs = get_memory_by_category(db_session, "preference")
        assert len(prefs) == 1
        assert prefs[0]["value"] == "remote"
        assert prefs[0]["source"] == "user"

    def test_store_goal(self, db_session):
        from services.career_memory import store_goal, get_memory_by_category
        store_goal(db_session, "Get into FAANG")
        goals = get_memory_by_category(db_session, "goal")
        assert len(goals) == 1
        assert "FAANG" in goals[0]["value"]

    def test_store_persona_selection(self, db_session):
        from services.career_memory import store_persona_selection, get_memory_value
        store_persona_selection(db_session, 1, "Backend Engineer")
        assert get_memory_value(db_session, "persona", "active_persona") == "Backend Engineer"

    def test_get_all_memory(self, db_session):
        from services.career_memory import store_memory, get_all_career_memory
        store_memory(db_session, "skill", "python", "5y")
        store_memory(db_session, "preference", "style", "remote")
        all_mem = get_all_career_memory(db_session)
        assert "skill" in all_mem
        assert "preference" in all_mem

    def test_get_memory_for_prompt(self, db_session):
        from services.career_memory import store_skill_snapshot, store_preference, store_goal, get_memory_for_prompt
        store_skill_snapshot(db_session, ["Python", "React"])
        store_preference(db_session, "work_style", "remote")
        store_goal(db_session, "Get into FAANG")
        prompt = get_memory_for_prompt(db_session)
        assert "Skills History" in prompt
        assert "User Preferences" in prompt
        assert "Career Goals" in prompt
        assert "FAANG" in prompt


class TestCareerMemoryAutoStorage:
    def test_resume_upload_stores_version(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        from services.career_memory import get_memory_by_category
        from database import SessionLocal
        db = SessionLocal()
        versions = get_memory_by_category(db, "version")
        assert len(versions) >= 1
        skills = get_memory_by_category(db, "skill")
        assert len(skills) >= 1
        db.close()

    def test_chat_preference_storage_works(self, client, mock_llm):
        from services.career_memory import store_preference, get_memory_by_category
        from database import SessionLocal
        db = SessionLocal()
        store_preference(db, "work_style", "remote")
        prefs = get_memory_by_category(db, "preference")
        assert len(prefs) == 1
        assert prefs[0]["value"] == "remote"
        db.close()


class TestCareerMemoryEndpoints:
    def test_list_all(self, client):
        r = client.get("/api/memory")
        assert r.status_code == 200

    def test_list_by_category(self, client):
        r = client.get("/api/memory/skill")
        assert r.status_code == 200

    def test_store_and_get(self, client):
        r = client.post("/api/memory", json={"category": "test", "key": "k", "value": "v"})
        assert r.status_code == 200
        r = client.get("/api/memory/test")
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_delete(self, client):
        r = client.post("/api/memory", json={"category": "test", "key": "k", "value": "v"})
        r = client.get("/api/memory/test")
        mem_id = r.json()[0]["id"]
        r = client.delete(f"/api/memory/{mem_id}")
        assert r.status_code == 200

    def test_context_view(self, client):
        r = client.get("/api/memory/context/view")
        assert r.status_code == 200
        assert "context" in r.json()
