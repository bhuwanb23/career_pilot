import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from models import Application, InterviewPrep
from services.interview_prep import normalize_prep_result, prep_to_model_fields
from services.interview_kit import get_dashboard_items, apply_prep_to_model


MOCK_LLM_RESULT = {
    "company_intel": {
        "overview": "Acme builds cloud tools",
        "products": "SaaS platform",
        "tech_stack": "Python, AWS",
        "role_expectations": "Backend development",
        "culture": "Fast-paced startup",
        "recent_news": "Series B funding",
    },
    "questions": [
        {"question": "Why Acme?", "answer": "Great fit", "category": "company"},
        {"question": "Python experience?", "answer": "5 years", "category": "technical"},
    ],
    "star_answers": [
        {
            "theme": "Leadership",
            "situation": "Team project",
            "task": "Lead delivery",
            "action": "Coordinated team",
            "result": "Shipped on time",
        }
    ],
    "prep_notes": {
        "topics_to_revise": ["System design"],
        "important_skills": ["Python"],
        "resume_highlights": ["API project"],
        "questions_to_ask": ["Team structure?"],
        "checklist": ["Review resume"],
    },
    "ai_suggestions": [
        {"text": "Revise Docker", "priority": "high", "category": "technical"},
    ],
}


class TestNormalizePrepResult:
    def test_full_result(self):
        result = normalize_prep_result(MOCK_LLM_RESULT)
        assert result["company_summary"] == "Acme builds cloud tools"
        assert result["company_intel"]["tech_stack"] == "Python, AWS"
        assert len(result["questions"]) == 2
        assert result["questions"][0]["category"] == "company"
        assert result["star_answers"][0]["theme"] == "Leadership"
        assert "System design" in result["prep_notes"]["topics_to_revise"]
        assert len(result["ai_suggestions"]) == 1

    def test_legacy_company_summary_only(self):
        result = normalize_prep_result({
            "company_summary": "Legacy summary",
            "questions": [{"question": "Q", "answer": "A"}],
            "star_answers": [],
        })
        assert result["company_intel"]["overview"] == "Legacy summary"
        assert result["questions"][0]["category"] == "behavioral"

    def test_invalid_category_defaults(self):
        result = normalize_prep_result({
            "questions": [{"question": "Q", "answer": "A", "category": "invalid"}],
        })
        assert result["questions"][0]["category"] == "behavioral"


class TestPrepToModelFields:
    def test_maps_all_fields(self):
        fields = prep_to_model_fields(MOCK_LLM_RESULT)
        assert "company_intel" in fields
        assert "prep_notes" in fields
        assert "ai_suggestions" in fields


class TestInterviewKitDashboard:
    def test_dashboard_includes_interview_apps(self, db_session):
        app1 = Application(
            company="Acme", role="Dev", job_description="JD",
            status="interview", score_overall=80.0,
            interview_at=datetime.now(timezone.utc),
        )
        app2 = Application(
            company="Beta", role="PM", job_description="JD",
            status="draft",
        )
        db_session.add_all([app1, app2])
        db_session.commit()

        items = get_dashboard_items(db_session)
        assert len(items) == 1
        assert items[0]["company"] == "Acme"
        assert items[0]["has_prep"] is False

    def test_dashboard_shows_has_prep(self, db_session):
        app = Application(
            company="Gamma", role="Eng", job_description="JD",
            status="interview",
        )
        db_session.add(app)
        db_session.commit()
        prep = InterviewPrep(application_id=app.id, company_summary="Summary")
        prep.set_questions([])
        db_session.add(prep)
        db_session.commit()

        items = get_dashboard_items(db_session)
        assert items[0]["has_prep"] is True


class TestApplyPrepToModel:
    def test_applies_all_json_fields(self, db_session):
        app = Application(company="X", role="Y", job_description="Z", status="interview")
        db_session.add(app)
        db_session.commit()

        prep = InterviewPrep(application_id=app.id)
        fields = prep_to_model_fields(MOCK_LLM_RESULT)
        apply_prep_to_model(prep, fields)
        db_session.add(prep)
        db_session.commit()

        assert prep.company_summary == "Acme builds cloud tools"
        assert prep.get_company_intel()["tech_stack"] == "Python, AWS"
        assert len(prep.get_ai_suggestions()) == 1
