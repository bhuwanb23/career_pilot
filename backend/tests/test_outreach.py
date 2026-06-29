from datetime import datetime, timezone

import pytest

from models import Application, ApplicationStatus
from services.outreach import mark_step_sent, seed_default_sequence


class TestOutreachSequence:
    def test_seed_default_sequence(self):
        app = Application(
            company="Acme",
            role="Dev",
            job_description="JD",
            status=ApplicationStatus.APPLIED.value,
            applied_at=datetime.now(timezone.utc),
            recruiter_msg="Hello recruiter",
        )
        seq = seed_default_sequence(app)
        assert len(seq["steps"]) == 3
        assert seq["steps"][0]["id"] == "initial"
        assert seq["steps"][0]["status"] == "sent"
        assert seq["steps"][0]["message"] == "Hello recruiter"

    def test_seed_empty_without_recruiter_msg(self):
        app = Application(
            company="Beta",
            role="Eng",
            job_description="JD",
            status=ApplicationStatus.APPLIED.value,
            applied_at=datetime.now(timezone.utc),
        )
        seq = seed_default_sequence(app)
        assert seq["steps"][0]["status"] == "pending"

    def test_mark_step_sent(self, db_session):
        app = Application(
            company="Gamma",
            role="PM",
            job_description="JD",
            status=ApplicationStatus.APPLIED.value,
            applied_at=datetime.now(timezone.utc),
        )
        db_session.add(app)
        db_session.commit()
        seed_default_sequence(app)
        app.set_outreach_sequence({
            **app.get_outreach_sequence(),
            "steps": [
                {
                    "id": "initial",
                    "type": "initial",
                    "channel": "linkedin",
                    "status": "draft",
                    "message": "Hi there",
                    "due_at": None,
                    "sent_at": None,
                },
                {"id": "follow_up_1", "type": "follow_up", "channel": "linkedin", "status": "pending", "message": "", "due_at": None, "sent_at": None},
                {"id": "thank_you", "type": "thank_you", "channel": "email", "status": "pending", "message": "", "due_at": None, "sent_at": None},
            ],
        })
        db_session.commit()

        result = mark_step_sent(db_session, app, "initial")
        assert result["steps"][0]["status"] == "sent"
        assert app.recruiter_msg == "Hi there"

    def test_maybe_seed_on_applied(self, db_session):
        from services.application_management import apply_status_update

        app = Application(
            company="Delta",
            role="Dev",
            job_description="JD",
            status=ApplicationStatus.DRAFT.value,
        )
        db_session.add(app)
        db_session.commit()
        apply_status_update(db_session, app, ApplicationStatus.APPLIED.value)
        db_session.commit()
        db_session.refresh(app)
        assert len(app.get_outreach_sequence().get("steps", [])) == 3


class TestOutreachDashboard:
    def test_dashboard_lists_applied_apps(self, db_session, client):
        app = Application(
            company="Echo",
            role="Dev",
            job_description="JD",
            status=ApplicationStatus.APPLIED.value,
            applied_at=datetime.now(timezone.utc),
        )
        db_session.add(app)
        db_session.commit()
        seed_default_sequence(app)
        db_session.commit()

        r = client.get("/api/outreach/dashboard")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        assert any(i["application_id"] == app.id for i in data["items"])

    def test_due_endpoint(self, db_session, client):
        app = Application(
            company="Foxtrot",
            role="Dev",
            job_description="JD",
            status=ApplicationStatus.APPLIED.value,
            applied_at=datetime.now(timezone.utc) - __import__("datetime").timedelta(days=10),
        )
        db_session.add(app)
        db_session.commit()

        r = client.get("/api/outreach/due")
        assert r.status_code == 200
        assert isinstance(r.json()["items"], list)
