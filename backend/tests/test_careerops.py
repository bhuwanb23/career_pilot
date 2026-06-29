import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestCareerOpsService:
    def test_sync_resume_creates_cv_md(self, db_session):
        from services.profile_service import create_or_update_profile
        from services.careerops import sync_resume_to_careerops, get_workspace_path

        create_or_update_profile(db_session, {
            "personal": {"name": "John Doe", "email": "john@test.com", "phone": "555-0123", "location": "SF"},
            "summary": "Experienced developer",
            "skills": ["Python", "React"],
            "experience": [{"company": "TechCorp", "role": "SE", "dates": "2022-2024", "bullets": ["Built APIs"]}],
            "education": [{"school": "UC Berkeley", "degree": "BS CS", "year": "2020"}],
            "certifications": [{"name": "AWS", "issuer": "Amazon", "year": "2023"}],
            "languages": [{"language": "English", "proficiency": "Native"}],
            "ai_summary": "Senior developer with full-stack experience",
            "experience_level": "senior",
            "tech_stack": [{"category": "Backend", "tools": ["Python"]}],
            "interests": ["AI/ML"],
            "strengths": ["Full-stack"],
            "weaknesses": ["No certs"],
        })

        from services.profile_service import get_profile, profile_to_dict
        profile = get_profile(db_session)
        profile_dict = profile_to_dict(profile)

        cv_path = sync_resume_to_careerops(profile_dict)
        assert cv_path.exists()
        content = cv_path.read_text()
        assert "John Doe" in content
        assert "john@test.com" in content
        assert "Python" in content
        assert "TechCorp" in content
        assert "Senior developer" in content

    def test_sync_config_creates_profile_yml(self, db_session):
        from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
        from services.careerops import sync_config

        create_or_update_profile(db_session, {
            "personal": {"name": "John", "email": "john@test.com"},
            "skills": ["Python"],
        })

        profile = get_profile(db_session)
        profile_dict = profile_to_dict(profile)

        config_path = sync_config(profile_dict)
        assert config_path.exists()
        content = config_path.read_text()
        assert "John" in content
        assert "python" in content.lower()

    def test_sync_all(self, db_session):
        from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
        from services.careerops import sync_all

        create_or_update_profile(db_session, {"personal": {"name": "Test"}, "skills": ["A"]})
        profile = get_profile(db_session)
        profile_dict = profile_to_dict(profile)

        result = sync_all(profile_dict)
        assert "cv_path" in result
        assert "config_path" in result
        assert "workspace" in result

    def test_get_workspace_info(self):
        from services.careerops import get_workspace_info
        info = get_workspace_info()
        assert "path" in info
        assert "files" in info
        assert "cv_exists" in info

    def test_cv_markdown_includes_all_sections(self, db_session):
        from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
        from services.careerops import sync_resume_to_careerops

        create_or_update_profile(db_session, {
            "personal": {"name": "Test", "email": "t@t.com"},
            "summary": "Summary text",
            "skills": ["Python"],
            "experience": [{"company": "C", "role": "R", "dates": "2022-2024", "bullets": ["Did stuff"]}],
            "education": [{"school": "Uni", "degree": "BS", "year": "2020"}],
            "projects": [{"name": "Proj", "description": "Desc", "tech": ["FastAPI"]}],
            "certifications": [{"name": "AWS", "issuer": "Amazon", "year": "2023"}],
            "languages": [{"language": "English", "proficiency": "Native"}],
            "ai_summary": "AI summary",
            "experience_level": "senior",
            "tech_stack": [{"category": "Backend", "tools": ["Python"]}],
            "interests": ["AI"],
            "strengths": ["Strong"],
            "weaknesses": ["No certs"],
        })

        profile = get_profile(db_session)
        profile_dict = profile_to_dict(profile)
        cv_path = sync_resume_to_careerops(profile_dict)
        content = cv_path.read_text()

        assert "## Summary" in content
        assert "## Skills" in content
        assert "## Experience" in content
        assert "## Education" in content
        assert "## Projects" in content
        assert "## Certifications" in content
        assert "## Languages" in content
        assert "## Strengths" in content
        assert "## Technical Skills" in content


class TestCareerOpsEndpoints:
    def test_sync_endpoint(self, client, db_session):
        from services.profile_service import create_or_update_profile
        create_or_update_profile(db_session, {"personal": {"name": "Test"}, "skills": ["A"]})

        r = client.post("/api/careerops/sync")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "synced"
        assert "cv_path" in data

    def test_sync_no_profile(self, client):
        r = client.post("/api/careerops/sync")
        assert r.status_code == 400

    def test_scan_endpoint(self, client):
        r = client.post("/api/careerops/scan", json={"portals": ["greenhouse"]})
        assert r.status_code == 200
        assert r.json()["status"] == "scan_complete"

    def test_evaluate_endpoint(self, client):
        r = client.post("/api/careerops/evaluate", json={"company": "Google", "role": "SWE"})
        assert r.status_code == 200
        assert "score" in r.json()

    def test_workspace_endpoint(self, client):
        r = client.get("/api/careerops/workspace")
        assert r.status_code == 200
        assert "path" in r.json()


class TestCareerOpsTools:
    def test_careerops_sync_tool_registered(self):
        from services.tool_registry import registry
        tool = registry.get("careerops_sync")
        assert tool is not None
        assert tool.category == "CareerOps"

    def test_careerops_scan_tool_registered(self):
        from services.tool_registry import registry
        tool = registry.get("careerops_scan")
        assert tool is not None

    def test_careerops_evaluate_tool_registered(self):
        from services.tool_registry import registry
        tool = registry.get("careerops_evaluate")
        assert tool is not None
