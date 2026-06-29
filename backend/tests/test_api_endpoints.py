import json
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'

MOCK_JOB_RESPONSE = '{"company": "TestCorp", "role": "Developer", "match_score": 0.85, "match_analysis": "Good match", "cover_letter": "Dear Hiring Manager...", "recruiter_msg": "Hi, I am interested..."}'

MOCK_INTERVIEW_RESPONSE = '{"company_summary": "TestCorp is a tech company", "questions": [{"question": "Tell me about yourself", "answer": "I am a developer"}], "star_answers": [{"situation": "At work", "task": "Build API", "action": "Did it", "result": "Success"}]}'


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
    mock_provider.health_check = AsyncMock(return_value=True)
    with patch("services.llm_client.get_llm_provider", return_value=mock_provider):
        yield mock_provider


class TestHealthEndpoint:
    def test_health(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "provider" in data
        assert "llm" in data


class TestProfileEndpoints:
    def test_get_profile_empty(self, client):
        r = client.get("/api/profile")
        assert r.status_code == 404

    def test_upload_resume(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            r = client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        assert r.status_code == 200
        assert r.json()["upload_id"] is not None

    def test_get_profile_after_upload(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        r = client.get("/api/profile")
        assert r.status_code == 200
        assert isinstance(r.json()["skills"], list)

    def test_update_profile(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        r = client.put("/api/profile", json={"summary": "Updated"})
        assert r.status_code == 200
        assert r.json()["summary"] == "Updated"


class TestApplicationEndpoints:
    def _create_profile(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})

    def test_list_empty(self, client):
        r = client.get("/api/applications")
        assert r.status_code == 200
        assert r.json() == []

    def test_analyze_job(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        assert r.status_code == 200
        assert r.json()["company"] == "TestCorp"

    def test_get_application(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        app_id = r.json()["id"]
        r = client.get(f"/api/applications/{app_id}")
        assert r.status_code == 200

    def test_update_application(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        app_id = r.json()["id"]
        r = client.patch(f"/api/applications/{app_id}", json={"status": "interview"})
        assert r.status_code == 200
        assert r.json()["status"] == "interview"

    def test_delete_application(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        app_id = r.json()["id"]
        r = client.delete(f"/api/applications/{app_id}")
        assert r.status_code == 200
        r = client.get("/api/applications")
        assert len(r.json()) == 0


class TestCoverLetterEndpoint:
    def _create_app(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        return r.json()["id"]

    def test_generate_cover_letter(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = "Dear Hiring Manager, I am excited to apply..."
        r = client.post("/api/cover-letter", json={"application_id": app_id})
        assert r.status_code == 200
        data = r.json()
        assert "cover_letter" in data
        assert data["application_id"] == app_id

    def test_cover_letter_404(self, client):
        r = client.post("/api/cover-letter", json={"application_id": 9999})
        assert r.status_code == 404

    def test_cover_letter_no_profile(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        from database import SessionLocal
        from models import CareerProfile
        db = SessionLocal()
        db.query(CareerProfile).delete()
        db.commit()
        db.close()
        r = client.post("/api/cover-letter", json={"application_id": app_id})
        assert r.status_code == 400


class TestInterviewKitEndpoint:
    def _create_app(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        return r.json()["id"]

    def test_generate_interview_kit(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        r = client.post("/api/interview/kit", json={"application_id": app_id})
        assert r.status_code == 200
        data = r.json()
        assert data["company"] == "TestCorp"
        assert data["cached"] is False
        assert "interview_prep" in data

    def test_interview_kit_cached(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        client.post("/api/interview/kit", json={"application_id": app_id})
        r = client.post("/api/interview/kit", json={"application_id": app_id})
        assert r.status_code == 200
        assert r.json()["cached"] is True

    def test_interview_kit_404(self, client):
        r = client.post("/api/interview/kit", json={"application_id": 9999})
        assert r.status_code == 404


class TestToolsEndpoints:
    def test_list_tools(self, client):
        r = client.get("/api/tools")
        assert r.status_code == 200
        assert len(r.json()) >= 10

    def test_get_tool(self, client):
        r = client.get("/api/tools/job_analyze")
        assert r.status_code == 200
        assert r.json()["name"] == "job_analyze"

    def test_list_categories(self, client):
        r = client.get("/api/tools/categories")
        assert r.status_code == 200
        assert "Resume" in r.json()


class TestPipelineEndpoints:
    def test_get_all_pipelines(self, client):
        r = client.get("/api/pipeline")
        assert r.status_code == 200
        assert "applications" in r.json()

    def test_get_pipeline_for_app(self, client, db_session):
        from models import Application
        app = Application(company="Test", role="Dev", job_description="jd")
        db_session.add(app)
        db_session.commit()
        r = client.get(f"/api/pipeline/{app.id}")
        assert r.status_code == 200
        assert r.json()["current_stage"] == "resume_uploaded"


class TestMemoryEndpoints:
    def test_get_memory(self, client):
        r = client.get("/api/chat/memory")
        assert r.status_code == 200

    def test_set_memory(self, client):
        r = client.post("/api/chat/memory", json={"key": "test", "value": "hello"})
        assert r.status_code == 200
        r = client.get("/api/chat/memory")
        assert r.json()["test"] == "hello"


class TestChatHistory:
    def test_history_empty(self, client):
        r = client.get("/api/chat/history")
        assert r.status_code == 200
        assert r.json() == []

    def test_sessions_empty(self, client):
        r = client.get("/api/chat/sessions")
        assert r.status_code == 200
        assert r.json() == []


class TestRESTChat:
    def test_chat_returns_response(self, client, mock_llm):
        mock_llm.generate.return_value = "Hello! How can I help you today?"
        r = client.post("/api/chat", json={"content": "hello"})
        assert r.status_code == 200
        data = r.json()
        assert "session_id" in data
        assert "intent" in data
        assert "response" in data
        assert len(data["response"]) > 0

    def test_chat_empty_content(self, client):
        r = client.post("/api/chat", json={"content": ""})
        assert r.status_code == 400

    def test_chat_stores_messages(self, client, mock_llm):
        mock_llm.generate.return_value = "Test response"
        r = client.post("/api/chat", json={"content": "test message"})
        session_id = r.json()["session_id"]
        r = client.get(f"/api/chat/history?session_id={session_id}")
        assert r.status_code == 200
        messages = r.json()
        assert len(messages) >= 2


class TestInterviewEndpoints:
    def _create_app(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        return r.json()["id"]

    def test_prepare_interview(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        r = client.post(f"/api/interview/prepare/{app_id}")
        assert r.status_code == 200
        assert len(r.json()["questions"]) > 0

    def test_get_interview_prep(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        client.post(f"/api/interview/prepare/{app_id}")
        r = client.get(f"/api/interview/{app_id}")
        assert r.status_code == 200

    def test_update_interview_notes(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        client.post(f"/api/interview/prepare/{app_id}")
        r = client.put(f"/api/interview/{app_id}", json={"notes": "Focus on system design"})
        assert r.status_code == 200
        assert r.json()["notes"] == "Focus on system design"
