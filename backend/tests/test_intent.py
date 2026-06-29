from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

import pytest


SAMPLE_PDF = Path(__file__).resolve().parent.parent / "samples" / "sample_resume_john.pdf"

MOCK_RESUME_RESPONSE = '{"summary": "Experienced developer", "skills": ["Python", "React"], "projects": [], "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}], "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}]}'


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


class TestKeywordDetection:
    def test_upload_resume(self):
        from routers.chat import detect_intent
        assert detect_intent("upload my resume") == "upload_resume"
        assert detect_intent("parse my resume") == "upload_resume"
        assert detect_intent("upload pdf") == "upload_resume"

    def test_generate_resume(self):
        from routers.chat import detect_intent
        assert detect_intent("generate my resume") == "generate_resume"
        assert detect_intent("write me a resume") == "generate_resume"
        assert detect_intent("create a new resume") == "generate_resume"
        assert detect_intent("build my resume for Google") == "generate_resume"

    def test_generate_cover_letter(self):
        from routers.chat import detect_intent
        assert detect_intent("write a cover letter") == "generate_cover_letter"
        assert detect_intent("draft cover letter for Amazon") == "generate_cover_letter"
        assert detect_intent("I need a cover letter") == "generate_cover_letter"

    def test_generate_recruiter_msg(self):
        from routers.chat import detect_intent
        assert detect_intent("write a linkedin message") == "generate_recruiter_msg"
        assert detect_intent("draft a recruiter message") == "generate_recruiter_msg"
        assert detect_intent("cold email for Meta") == "generate_recruiter_msg"
        assert detect_intent("dm the recruiter") == "generate_recruiter_msg"

    def test_generate_followup(self):
        from routers.chat import detect_intent
        assert detect_intent("write a followup message") == "generate_followup"
        assert detect_intent("send a follow-up") == "generate_followup"
        assert detect_intent("nudge them about my application") == "generate_followup"
        assert detect_intent("nudge the recruiter") == "generate_recruiter_msg"

    def test_show_outreach_due(self):
        from routers.chat import detect_intent
        assert detect_intent("what followups are overdue") == "show_outreach_due"
        assert detect_intent("show due cadence") == "show_outreach_due"

    def test_analyze_job(self):
        from routers.chat import detect_intent
        assert detect_intent("analyze this job description") == "analyze_job"
        assert detect_intent("analyze this role") == "analyze_job"

    def test_prepare_interview(self):
        from routers.chat import detect_intent
        assert detect_intent("prepare for my interview") == "prepare_interview"
        assert detect_intent("interview prep for Google") == "prepare_interview"
        assert detect_intent("mock interview please") == "prepare_interview"

    def test_show_applications(self):
        from routers.chat import detect_intent
        assert detect_intent("show my applications") == "show_applications"
        assert detect_intent("list my applications") == "show_applications"
        assert detect_intent("application tracker") == "show_applications"
        assert detect_intent("kanban board") == "show_applications"

    def test_show_profile(self):
        from routers.chat import detect_intent
        assert detect_intent("my skills are") == "show_profile"
        assert detect_intent("my experience") == "show_profile"
        assert detect_intent("career profile") == "show_profile"
        assert detect_intent("check my profile") == "show_profile"

    def test_placement_analytics(self):
        from routers.chat import detect_intent
        assert detect_intent("show me my analytics") == "placement_analytics"
        assert detect_intent("how am i doing") == "placement_analytics"
        assert detect_intent("placement stats") == "placement_analytics"
        assert detect_intent("progress report") == "placement_analytics"
        assert detect_intent("job search stats") == "placement_analytics"

    def test_general_chat_fallback(self):
        from routers.chat import detect_intent
        assert detect_intent("hello there") == "general_chat"
        assert detect_intent("what is 2+2") == "general_chat"
        assert detect_intent("tell me a joke") == "general_chat"

    def test_resume_collision_upload_vs_generate(self):
        from routers.chat import detect_intent
        assert detect_intent("upload resume") == "upload_resume"
        assert detect_intent("generate resume") == "generate_resume"
        assert detect_intent("create my resume") == "generate_resume"
        assert detect_intent("parse my resume") == "upload_resume"


class TestLLMClassification:
    def test_classify_intent_with_llm_returns_valid_intent(self):
        import asyncio
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"intent": "generate_resume", "confidence": 0.95}'
            result = asyncio.run(classify_intent_with_llm("I need a new resume"))
            assert result["intent"] == "generate_resume"

    def test_classify_intent_low_confidence_falls_back(self):
        import asyncio
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"intent": "analyze_job", "confidence": 0.3}'
            result = asyncio.run(classify_intent_with_llm("something vague"))
            assert result["intent"] == "general_chat"

    def test_classify_intent_invalid_json_falls_back(self):
        import asyncio
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "not valid json"
            result = asyncio.run(classify_intent_with_llm("something"))
            assert result["intent"] == "general_chat"

    def test_classify_intent_llm_error_falls_back(self):
        import asyncio
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.side_effect = Exception("LLM unavailable")
            result = asyncio.run(classify_intent_with_llm("something"))
            assert result["intent"] == "general_chat"


class TestNewServiceImports:
    def test_resume_generator_imports(self):
        from services.resume_generator import generate_resume, resume_to_pdf
        assert callable(generate_resume)
        assert callable(resume_to_pdf)

    def test_cover_letter_imports(self):
        from services.cover_letter import generate_cover_letter
        assert callable(generate_cover_letter)

    def test_recruiter_msg_imports(self):
        from services.recruiter_msg import generate_recruiter_msg
        assert callable(generate_recruiter_msg)

    def test_analytics_imports(self):
        from services.analytics import get_raw_analytics, get_analytics_summary
        assert callable(get_raw_analytics)
        assert callable(get_analytics_summary)


class TestAnalyticsRaw:
    def test_empty_analytics(self, client, db_session):
        from services.analytics import get_raw_analytics
        result = get_raw_analytics(db_session)
        assert result["total_applications"] == 0
        assert result["avg_match_score"] == 0.0
        assert result["status_breakdown"] == {}

    def test_analytics_with_data(self, client, db_session, mock_llm):
        from models import Application
        db_session.add(Application(company="A", role="Dev", job_description="jd1", status="applied", match_score=0.7))
        db_session.add(Application(company="B", role="Dev", job_description="jd2", status="interview", match_score=0.9))
        db_session.add(Application(company="C", role="PM", job_description="jd3", status="applied", match_score=0.5))
        db_session.commit()

        from services.analytics import get_raw_analytics
        result = get_raw_analytics(db_session)
        assert result["total_applications"] == 3
        assert result["status_breakdown"]["applied"] == 2
        assert result["status_breakdown"]["interview"] == 1
        assert result["avg_match_score"] > 0
        assert len(result["top_companies"]) == 3


class TestResumePDF:
    def test_resume_to_pdf_produces_bytes(self):
        from services.resume_generator import resume_to_pdf
        data = {
            "name": "John Doe",
            "contact": "john@example.com | 555-0123",
            "summary": "Experienced developer",
            "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}],
            "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}],
            "skills": ["Python", "React"],
            "projects": [{"name": "ProjectX", "description": "A web app", "tech": ["FastAPI"]}],
        }
        pdf = resume_to_pdf(data)
        assert isinstance(pdf, (bytes, bytearray))
        assert len(pdf) > 100
        assert bytes(pdf[:4]) == b"%PDF"


class TestIntentPriority:
    def test_upload_before_generate(self):
        from routers.chat import detect_intent
        assert detect_intent("upload resume") == "upload_resume"

    def test_generate_not_upload(self):
        from routers.chat import detect_intent
        assert detect_intent("generate resume") == "generate_resume"

    def test_analyze_before_general(self):
        from routers.chat import detect_intent
        assert detect_intent("analyze this job") == "analyze_job"

    def test_interview_before_general(self):
        from routers.chat import detect_intent
        assert detect_intent("prepare interview") == "prepare_interview"
