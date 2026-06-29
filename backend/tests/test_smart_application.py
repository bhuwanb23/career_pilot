from unittest.mock import AsyncMock, patch

import pytest

from services.smart_application import run_smart_application


MOCK_RESULT = {
    "jd": {"company": "Acme", "role": "Developer", "skills": ["python"]},
    "match": {"match_percentage": 75, "matched_skills": ["python"], "missing_skills": ["go"]},
    "score": {"fit": 80, "timing": 85, "competition": 65, "readiness": 70, "overall": 76.5},
    "llm": {},
    "recommendations": [{"text": "Apply today", "priority": "high", "category": "timing"}],
    "company": "TestCorp",
    "role": "Developer",
    "match_score": 0.85,
    "match_analysis": "Good match",
    "cover_letter": "Dear Hiring Manager",
    "recruiter_msg": "Hi there",
}


class TestSmartApplicationOrchestrator:
    def test_run_smart_application_returns_all_sections(self):
        import asyncio
        with patch("services.smart_application.analyze_job", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {
                "company": "TestCorp",
                "role": "Developer",
                "match_score": 0.85,
                "match_analysis": "Strong fit",
                "cover_letter": "Dear Hiring Manager",
                "recruiter_msg": "Hello",
            }
            result = asyncio.run(run_smart_application(
                "Senior Python Developer at Acme. Python React Docker required.",
                "",
                {"skills": ["Python", "React", "Docker"], "experience": [{}, {}], "projects": [{}], "summary": "Dev"},
            ))
        assert "score" in result
        assert "match" in result
        assert "recommendations" in result
        assert result["score"]["overall"] > 0
