import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'

MOCK_PERSONAS = [
    {
        "persona_name": "Backend Engineer",
        "match_confidence": 0.85,
        "ai_summary": "Strong backend focus with Python and API development experience.",
        "highlighted_skills": ["Python", "FastAPI", "SQL"],
        "strengths": ["API design", "System architecture"],
        "missing_skills": ["Go", "Rust"],
        "suggested_focus": ["Learn Go for microservices", "Build a distributed system"],
        "experience_level_label": "mid-senior",
        "target_role_types": ["Backend Engineer", "API Developer"],
    },
    {
        "persona_name": "Frontend Engineer",
        "match_confidence": 0.60,
        "ai_summary": "Some frontend experience with React but primarily backend-focused.",
        "highlighted_skills": ["React", "JavaScript"],
        "strengths": ["Full-stack awareness"],
        "missing_skills": ["TypeScript", "CSS architecture", "Testing frameworks"],
        "suggested_focus": ["Deepen TypeScript skills", "Build a complex React app"],
        "experience_level_label": "mid",
        "target_role_types": ["Frontend Developer", "React Developer"],
    },
    {
        "persona_name": "Full Stack Engineer",
        "match_confidence": 0.85,
        "ai_summary": "Strong full-stack developer with Python and React experience.",
        "highlighted_skills": ["Python", "React", "Node.js", "SQL"],
        "strengths": ["End-to-end development", "API design"],
        "missing_skills": ["Cloud infrastructure"],
        "suggested_focus": ["Get AWS certification"],
        "experience_level_label": "senior",
        "target_role_types": ["Full Stack Developer"],
    },
    {
        "persona_name": "AI/ML Engineer",
        "match_confidence": 0.45,
        "ai_summary": "Limited ML experience but strong Python foundation.",
        "highlighted_skills": ["Python", "Data Analysis"],
        "strengths": ["Python proficiency", "Problem solving"],
        "missing_skills": ["TensorFlow", "PyTorch", "ML fundamentals"],
        "suggested_focus": ["Take ML course", "Build portfolio project"],
        "experience_level_label": "junior",
        "target_role_types": ["ML Engineer", "Data Scientist"],
    },
    {
        "persona_name": "Data Engineer",
        "match_confidence": 0.55,
        "ai_summary": "Some data pipeline experience, needs more depth.",
        "highlighted_skills": ["Python", "SQL", "ETL"],
        "strengths": ["Data handling", "Scripting"],
        "missing_skills": ["Spark", "Airflow", "Data modeling"],
        "suggested_focus": ["Learn Spark", "Build data pipeline project"],
        "experience_level_label": "mid",
        "target_role_types": ["Data Engineer", "Analytics Engineer"],
    },
]

MOCK_PERSONAS_RESPONSE = json.dumps(MOCK_PERSONAS)


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


class TestPersonaGenerator:
    @pytest.mark.asyncio
    async def test_generates_all_personas(self, mock_llm):
        mock_llm.generate.return_value = MOCK_PERSONAS_RESPONSE
        from services.persona_generator import generate_personas
        result = await generate_personas({"skills": ["Python"]})
        assert len(result) == 5
        assert result[0]["persona_name"] == "Backend Engineer"
        assert result[0]["match_confidence"] == 0.85

    @pytest.mark.asyncio
    async def test_generates_custom_personas(self, mock_llm):
        mock_llm.generate.return_value = json.dumps([MOCK_PERSONAS[0]])
        from services.persona_generator import generate_personas
        result = await generate_personas({"skills": ["Python"]}, ["Backend Engineer"])
        assert len(result) == 1
        assert result[0]["persona_name"] == "Backend Engineer"

    @pytest.mark.asyncio
    async def test_fallback_on_bad_json(self, mock_llm):
        mock_llm.generate.return_value = "not json"
        from services.persona_generator import generate_personas
        result = await generate_personas({"skills": []})
        assert result == []


class TestPersonaService:
    def test_create_persona(self, db_session):
        from models import CareerProfile
        from services.persona_service import create_persona
        profile = CareerProfile()
        db_session.add(profile)
        db_session.commit()

        persona = create_persona(db_session, profile.id, MOCK_PERSONAS[0])
        assert persona.persona_name == "Backend Engineer"
        assert persona.persona_slug == "backend-engineer"
        assert persona.match_confidence == 0.85
        assert persona.get_highlighted_skills() == ["Python", "FastAPI", "SQL"]

    def test_get_personas(self, db_session):
        from models import CareerProfile
        from services.persona_service import create_persona, get_personas
        profile = CareerProfile()
        db_session.add(profile)
        db_session.commit()

        create_persona(db_session, profile.id, MOCK_PERSONAS[0])
        create_persona(db_session, profile.id, MOCK_PERSONAS[1])

        personas = get_personas(db_session, profile.id)
        assert len(personas) == 2
        assert personas[0].match_confidence >= personas[1].match_confidence

    def test_delete_persona(self, db_session):
        from models import CareerProfile
        from services.persona_service import create_persona, delete_persona, get_persona
        profile = CareerProfile()
        db_session.add(profile)
        db_session.commit()

        persona = create_persona(db_session, profile.id, MOCK_PERSONAS[0])
        assert delete_persona(db_session, persona.id)
        assert get_persona(db_session, persona.id) is None

    def test_delete_nonexistent(self, db_session):
        from services.persona_service import delete_persona
        assert not delete_persona(db_session, 9999)

    def test_persona_to_dict(self, db_session):
        from models import CareerProfile
        from services.persona_service import create_persona, persona_to_dict
        profile = CareerProfile()
        db_session.add(profile)
        db_session.commit()

        persona = create_persona(db_session, profile.id, MOCK_PERSONAS[2])
        d = persona_to_dict(persona)
        assert d["persona_name"] == "Full Stack Engineer"
        assert d["match_confidence"] == 0.85
        assert isinstance(d["highlighted_skills"], list)
        assert isinstance(d["missing_skills"], list)
        assert isinstance(d["suggested_focus"], list)


class TestPersonaEndpoints:
    def _create_profile(self, client, mock_llm):
        mock_llm.generate.return_value = '{"summary": "Dev", "skills": ["Python"], "projects": [], "education": [], "experience": []}'
        with open(SAMPLE_PDF, "rb") as f:
            client.post("/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")})

    def test_generate_personas(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_PERSONAS_RESPONSE
        r = client.post("/api/personas/generate", json={"persona_names": ["Backend Engineer", "Frontend Engineer"]})
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 5
        assert len(data["personas"]) == 5

    def test_generate_personas_no_profile(self, client):
        r = client.post("/api/personas/generate", json={})
        assert r.status_code == 400

    def test_list_personas(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_PERSONAS_RESPONSE
        client.post("/api/personas/generate", json={})
        r = client.get("/api/personas")
        assert r.status_code == 200
        assert len(r.json()) == 5

    def test_list_personas_empty(self, client):
        r = client.get("/api/personas")
        assert r.status_code == 200
        assert r.json() == []

    def test_get_persona(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_PERSONAS_RESPONSE
        client.post("/api/personas/generate", json={})
        r = client.get("/api/personas")
        persona_id = r.json()[0]["id"]
        r = client.get(f"/api/personas/{persona_id}")
        assert r.status_code == 200
        assert r.json()["persona_name"] == "Backend Engineer"

    def test_get_persona_404(self, client):
        r = client.get("/api/personas/9999")
        assert r.status_code == 404

    def test_delete_persona(self, client, mock_llm):
        self._create_profile(client, mock_llm)
        mock_llm.generate.return_value = MOCK_PERSONAS_RESPONSE
        client.post("/api/personas/generate", json={})
        r = client.get("/api/personas")
        persona_id = r.json()[0]["id"]
        r = client.delete(f"/api/personas/{persona_id}")
        assert r.status_code == 200
        r = client.get("/api/personas")
        assert len(r.json()) == 4
