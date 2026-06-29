import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'

MOCK_PROFILE_RESPONSE = json.dumps({
    "ai_summary": "Senior software engineer with 5+ years of full-stack development experience, specializing in Python and React ecosystems.",
    "experience_level": "senior",
    "tech_stack": [
        {"category": "Frontend", "tools": ["React", "JavaScript"]},
        {"category": "Backend", "tools": ["Python", "FastAPI"]},
    ],
    "interests": ["AI/ML", "Open Source", "Cloud Architecture"],
    "strengths": ["Full-stack development", "System design", "API development"],
    "weaknesses": ["Limited team leadership experience", "No cloud certifications"],
})


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


class TestProfileGeneratorService:
    @pytest.mark.asyncio
    async def test_generates_enriched_profile(self, mock_llm):
        mock_llm.generate.return_value = MOCK_PROFILE_RESPONSE
        from services.profile_generator import generate_career_profile
        result = await generate_career_profile({"skills": ["Python"], "experience": []})
        assert result["ai_summary"] != ""
        assert result["experience_level"] == "senior"
        assert len(result["tech_stack"]) == 2
        assert len(result["interests"]) == 3
        assert len(result["strengths"]) == 3
        assert len(result["weaknesses"]) == 2

    @pytest.mark.asyncio
    async def test_fallback_on_bad_json(self, mock_llm):
        mock_llm.generate.return_value = "not json"
        from services.profile_generator import generate_career_profile
        result = await generate_career_profile({"skills": []})
        assert result["ai_summary"] == ""
        assert result["tech_stack"] == []

    def test_profile_needs_generation(self):
        from services.profile_generator import profile_needs_generation
        assert profile_needs_generation(None) is False

        class MockProfile:
            ai_summary = ""
            experience_level = ""
        assert profile_needs_generation(MockProfile()) is True

        MockProfile.ai_summary = "Already generated"
        assert profile_needs_generation(MockProfile()) is False


class TestProfileGenerationEndpoint:
    def _create_profile(self, client, mock_llm):
        mock_llm.generate.return_value = MOCK_RESUME_RESPONSE
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})

    def test_generate_profile(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_PROFILE_RESPONSE
        r = client.post("/api/profile/generate")
        assert r.status_code == 200
        data = r.json()
        assert data["ai_summary"] != ""
        assert data["experience_level"] == "senior"
        assert len(data["tech_stack"]) == 2
        assert len(data["interests"]) == 3
        assert len(data["strengths"]) == 3
        assert len(data["weaknesses"]) == 2
        assert data["profile_generated_at"] is not None

    def test_generate_profile_no_resume(self, client):
        r = client.post("/api/profile/generate")
        assert r.status_code == 400

    def test_profile_includes_new_fields(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        r = client.get("/api/profile")
        assert r.status_code == 200
        data = r.json()
        assert "ai_summary" in data
        assert "experience_level" in data
        assert "tech_stack" in data
        assert "interests" in data
        assert "strengths" in data
        assert "weaknesses" in data


class TestProfileServiceNewFields:
    def test_create_with_ai_fields(self, db_session):
        from services.profile_service import create_or_update_profile, get_profile
        data = {
            "ai_summary": "AI generated summary",
            "experience_level": "senior",
            "tech_stack": [{"category": "Backend", "tools": ["Python"]}],
            "interests": ["AI"],
            "strengths": ["Python"],
            "weaknesses": ["No certs"],
        }
        profile = create_or_update_profile(db_session, data)
        assert profile.ai_summary == "AI generated summary"
        assert profile.experience_level == "senior"
        assert profile.get_tech_stack() == [{"category": "Backend", "tools": ["Python"]}]
        assert profile.get_interests() == ["AI"]
        assert profile.get_strengths() == ["Python"]
        assert profile.get_weaknesses() == ["No certs"]

    def test_profile_to_dict_includes_ai_fields(self, db_session):
        from services.profile_service import create_or_update_profile, profile_to_dict
        create_or_update_profile(db_session, {
            "ai_summary": "Test",
            "experience_level": "mid",
            "tech_stack": [],
            "interests": [],
            "strengths": [],
            "weaknesses": [],
        })
        profile = __import__("services.profile_service", fromlist=["get_profile"]).get_profile(db_session)
        d = profile_to_dict(profile)
        assert d["ai_summary"] == "Test"
        assert d["experience_level"] == "mid"
        assert d["tech_stack"] == []
        assert d["interests"] == []
        assert d["strengths"] == []
        assert d["weaknesses"] == []


class TestAutoGenerationOnUpload:
    def test_upload_auto_generates_profile(self, client, mock_llm):
        mock_llm.generate.side_effect = [MOCK_RESUME_RESPONSE, MOCK_PROFILE_RESPONSE]
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})
        r = client.get("/api/profile")
        assert r.status_code == 200
        data = r.json()
        assert data["ai_summary"] != ""
        assert data["experience_level"] == "senior"
