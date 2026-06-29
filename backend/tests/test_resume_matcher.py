from services.resume_matcher import match_resume_to_jd, get_match_summary


PROFILE = {
    "skills": ["Python", "React", "Docker", "Git", "SQL"],
    "experience": [{"role": "Dev", "company": "A"}, {"role": "Dev", "company": "B"}],
    "projects": [{"title": "App"}],
}

JD_DATA = {
    "skills": ["python", "react", "docker", "kubernetes", "aws"],
    "job_description": "Senior Python Developer with React and Docker",
    "role": "Senior Python Developer",
}


class TestResumeMatcher:
    def test_match_returns_percentage(self):
        result = match_resume_to_jd(PROFILE, JD_DATA)
        assert 0 <= result["match_percentage"] <= 100

    def test_matched_and_missing_skills(self):
        result = match_resume_to_jd(PROFILE, JD_DATA)
        assert "python" in [s.lower() for s in result["matched_skills"]]
        assert "kubernetes" in result["missing_skills"]

    def test_strengths_and_weaknesses(self):
        result = match_resume_to_jd(PROFILE, JD_DATA)
        assert len(result["strengths"]) > 0
        assert len(result["recommendation"]) > 0

    def test_empty_profile(self):
        result = match_resume_to_jd({}, JD_DATA)
        assert result["match_percentage"] == 0

    def test_match_summary(self):
        match = match_resume_to_jd(PROFILE, JD_DATA)
        summary = get_match_summary(match)
        assert "Match" in summary or "match" in summary.lower()
