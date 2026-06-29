import pytest
from datetime import datetime, timezone
from unittest.mock import patch

from models import Application, ApplicationStatus
from services.application_management import (
    apply_status_update,
    normalize_status,
    query_applications,
    validate_status,
    build_timeline,
    record_activity,
)
from services.careerops import sync_application_to_tracker, CAREEROPS_STATUS_MAP
from services.analytics import get_phase6_snapshot


class TestStatusNormalization:
    def test_canonical_statuses(self):
        assert validate_status("draft") == "draft"
        assert validate_status("applied") == "applied"
        assert validate_status("assessment") == "assessment"

    def test_legacy_aliases(self):
        assert normalize_status("saved") == "draft"
        assert normalize_status("screening") == "assessment"

    def test_invalid_status_raises(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_status("invalid")


class TestApplicationManagement:
    def test_apply_status_update_sets_milestones(self, db_session):
        app = Application(
            company="Acme",
            role="Engineer",
            job_description="Build things",
            status="draft",
        )
        db_session.add(app)
        db_session.commit()
        db_session.refresh(app)

        apply_status_update(db_session, app, "applied")
        db_session.commit()
        assert app.status == "applied"
        assert app.applied_at is not None

        apply_status_update(db_session, app, "interview")
        db_session.commit()
        assert app.interview_at is not None

    def test_record_activity_and_timeline(self, db_session):
        app = Application(
            company="Beta",
            role="Dev",
            job_description="Code",
            status="draft",
        )
        db_session.add(app)
        db_session.commit()
        db_session.refresh(app)

        record_activity(db_session, app.id, "note", "Follow up next week")
        db_session.commit()

        timeline = build_timeline(db_session, app.id)
        assert len(timeline) >= 2
        kinds = {e["kind"] for e in timeline}
        assert "note" in kinds
        assert "milestone" in kinds

    def test_query_applications_search(self, db_session):
        app1 = Application(company="Google", role="SWE", job_description="Python", status="draft")
        app2 = Application(company="Meta", role="PM", job_description="Product", status="applied")
        db_session.add_all([app1, app2])
        db_session.commit()

        results = query_applications(db_session, q="google")
        assert len(results) == 1
        assert results[0].company == "Google"

    def test_query_applications_sort_score(self, db_session):
        app1 = Application(
            company="Low", role="A", job_description="x", status="draft",
            score_overall=30.0,
        )
        app2 = Application(
            company="High", role="B", job_description="x", status="draft",
            score_overall=90.0,
        )
        db_session.add_all([app1, app2])
        db_session.commit()

        results = query_applications(db_session, sort="score_desc")
        assert results[0].company == "High"


class TestCareerOpsSync:
    def test_sync_creates_tracker_row(self, tmp_path):
        app = Application(
            id=1,
            company="TestCo",
            role="Engineer",
            job_description="JD",
            status="applied",
            score_overall=80.0,
            notes="Test note",
            created_at=datetime(2026, 1, 15, tzinfo=timezone.utc),
        )
        with patch("services.careerops.get_workspace_path", return_value=tmp_path):
            result = sync_application_to_tracker(app)
            assert result["action"] == "created"
            tracker = tmp_path / "data" / "applications.md"
            assert tracker.exists()
            content = tracker.read_text(encoding="utf-8")
            assert "TestCo" in content
            assert "Applied" in content

    def test_status_mapping(self):
        assert CAREEROPS_STATUS_MAP["draft"] == "Evaluated"
        assert CAREEROPS_STATUS_MAP["interview"] == "Interview"


class TestAnalyticsSnapshot:
    def test_phase6_snapshot(self, db_session):
        apps = [
            Application(company="A", role="R", job_description="x", status="draft", score_overall=70),
            Application(company="B", role="R", job_description="x", status="interview", score_overall=80),
            Application(company="C", role="R", job_description="x", status="rejected", score_overall=50),
        ]
        db_session.add_all(apps)
        db_session.commit()

        snapshot = get_phase6_snapshot(db_session)
        assert snapshot["total_applications"] == 3
        assert snapshot["interviews"] == 1
        assert snapshot["rejections"] == 1
        assert snapshot["active_applications"] == 2
        assert snapshot["avg_career_pilot_score"] > 0
