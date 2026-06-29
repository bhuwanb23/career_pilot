from datetime import datetime, timezone

from services.career_pilot_score import (
    compute_career_pilot_score,
    compute_competition_score,
    compute_fit_score,
    compute_readiness_score,
    compute_timing_score,
)


PROFILE = {
    "skills": ["Python", "React", "Docker", "JavaScript", "SQL"],
    "summary": "Experienced developer",
    "experience": [{"role": "Dev"}, {"role": "Dev"}],
    "projects": [{"title": "App"}],
    "education": [{"degree": "BS CS"}],
}

JD_DATA = {
    "job_description": "Python React Docker developer remote role",
    "role": "Senior Developer",
}


class TestCareerPilotScore:
    def test_fit_score_range(self):
        score = compute_fit_score(PROFILE, JD_DATA)
        assert 0 <= score <= 100

    def test_timing_score_recent_application(self):
        app = {"created_at": datetime.now(timezone.utc).isoformat()}
        score = compute_timing_score(app)
        assert score >= 75

    def test_competition_score_range(self):
        score = compute_competition_score(JD_DATA)
        assert 0 <= score <= 100

    def test_readiness_score_with_complete_profile(self):
        score = compute_readiness_score(PROFILE, JD_DATA)
        assert score >= 70

    def test_overall_score_has_all_dimensions(self):
        result = compute_career_pilot_score(PROFILE, JD_DATA)
        assert "fit" in result
        assert "timing" in result
        assert "competition" in result
        assert "readiness" in result
        assert "overall" in result
        assert 0 <= result["overall"] <= 100
