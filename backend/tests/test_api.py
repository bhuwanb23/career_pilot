from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

import pytest


SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"


MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'


MOCK_JOB_RESPONSE = '{"company": "TestCorp", "role": "Developer", "match_score": 0.85, "match_analysis": "Good match", "cover_letter": "Dear Hiring Manager...", "recruiter_msg": "Hi, I am interested..."}'


MOCK_INTERVIEW_RESPONSE = '{"company_summary": "TestCorp is a tech company", "questions": [{"question": "Tell me about yourself", "answer": "I am a developer"}], "star_answers": [{"situation": "At work", "task": "Build API", "action": "Did it", "result": "Success"}]}'


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
    mock_provider.health_check = AsyncMock(return_value=True)
    with patch("services.llm_client.get_llm_provider", return_value=mock_provider):
        yield mock_provider


class TestHealthEndpoint:
    def test_health_returns_200(self, client, mock_llm):
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "provider" in data
        assert "llm" in data


class TestProfileEndpoints:
    def test_profile_empty_returns_404(self, client):
        r = client.get("/api/profile")
        assert r.status_code == 404

    def test_upload_resume_creates_profile(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            r = client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        assert r.status_code == 200
        data = r.json()
        assert data["upload_id"] is not None
        assert data["status"] == "parsed"
        assert data["profile_id"] is not None

    def test_upload_non_pdf_rejected(self, client):
        r = client.post("/api/resume/upload", files={"file": ("resume.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_profile_returns_after_upload(self, client, mock_llm):
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
        r = client.put("/api/profile", json={"summary": "Updated summary"})
        assert r.status_code == 200
        assert r.json()["summary"] == "Updated summary"


class TestApplicationEndpoints:
    def _create_profile(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})

    def test_list_empty(self, client):
        r = client.get("/api/applications")
        assert r.status_code == 200
        assert r.json() == []

    def test_analyze_job_creates_application(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={
            "job_description": "Looking for a developer",
            "url": "https://example.com/job/1",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["company"] == "TestCorp"
        assert data["role"] == "Developer"
        assert data["match_score"] > 0
        assert data["score_overall"] > 0
        assert data["status"] == "draft"

    def test_analyze_job_without_profile_fails(self, client, mock_llm):
        r = client.post("/api/jobs/analyze", json={
            "job_description": "Looking for a developer",
        })
        assert r.status_code == 400

    def test_get_application(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        r = client.post("/api/jobs/analyze", json={"job_description": "Dev role"})
        app_id = r.json()["id"]
        r = client.get(f"/api/applications/{app_id}")
        assert r.status_code == 200
        assert r.json()["id"] == app_id

    def test_get_application_404(self, client):
        r = client.get("/api/applications/9999")
        assert r.status_code == 404

    def test_update_application_status(self, client, mock_llm):
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

    def test_filter_by_status(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_JOB_RESPONSE
        client.post("/api/jobs/analyze", json={"job_description": "Role 1"})
        client.post("/api/jobs/analyze", json={"job_description": "Role 2"})
        r = client.get("/api/applications?status=draft")
        assert r.status_code == 200
        assert len(r.json()) == 2
        r = client.get("/api/applications?status=interview")
        assert len(r.json()) == 0


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
        data = r.json()
        assert len(data["company_summary"]) > 0
        assert isinstance(data["questions"], list)

    def test_prepare_interview_existing_returns_cached(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        r1 = client.post(f"/api/interview/prepare/{app_id}")
        r2 = client.post(f"/api/interview/prepare/{app_id}")
        assert r1.json()["id"] == r2.json()["id"]

    def test_get_prep(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        client.post(f"/api/interview/prepare/{app_id}")
        r = client.get(f"/api/interview/{app_id}")
        assert r.status_code == 200

    def test_update_notes(self, client, mock_llm):
        app_id = self._create_app(client, mock_llm)
        mock_llm.generate.return_value = MOCK_INTERVIEW_RESPONSE
        client.post(f"/api/interview/prepare/{app_id}")
        r = client.put(f"/api/interview/{app_id}", json={"notes": "Focus on system design"})
        assert r.status_code == 200
        assert r.json()["notes"] == "Focus on system design"

    def test_get_prep_404(self, client):
        r = client.get("/api/interview/9999")
        assert r.status_code == 404


class TestChatEndpoints:
    def test_chat_history_empty(self, client):
        r = client.get("/api/chat/history")
        assert r.status_code == 200
        assert r.json() == []
