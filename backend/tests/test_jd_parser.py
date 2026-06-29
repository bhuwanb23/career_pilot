from services.jd_parser import parse_jd


SAMPLE_JD = """
Acme Corp is hiring a Senior Python Developer.

Requirements:
- 5+ years Python experience
- React and Docker experience
- AWS cloud skills

Nice to have:
- Kubernetes experience

Location: San Francisco, CA
Remote work available.
"""


class TestJDPParser:
    def test_parse_returns_required_keys(self):
        result = parse_jd(SAMPLE_JD)
        assert "company" in result
        assert "role" in result
        assert "skills" in result
        assert "requirements" in result
        assert "is_remote" in result

    def test_extracts_skills(self):
        result = parse_jd(SAMPLE_JD)
        skills_lower = [s.lower() for s in result["skills"]]
        assert "python" in skills_lower
        assert "docker" in skills_lower

    def test_detects_remote(self):
        result = parse_jd(SAMPLE_JD)
        assert result["is_remote"] is True

    def test_extracts_company_from_url(self):
        result = parse_jd("Some job text", url="https://careers.google.com/jobs/123")
        assert result["company"] == "Careers"

    def test_senior_experience_level(self):
        result = parse_jd(SAMPLE_JD)
        assert result["experience_level"] == "senior"

    def test_empty_jd_returns_defaults(self):
        result = parse_jd("")
        assert result["company"] == "Unknown"
        assert result["role"] == "Unknown Role"
