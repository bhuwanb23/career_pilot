from datetime import datetime, timedelta, timezone

import pytest

from models import Application, ApplicationStatus
from services.followup_cadence import (
    DEFAULT_CADENCE,
    compute_next_due_at,
    compute_urgency,
)


class TestComputeUrgency:
    def test_applied_overdue_first_followup(self):
        assert compute_urgency("applied", 8, None, 0) == "overdue"

    def test_applied_waiting(self):
        assert compute_urgency("applied", 3, None, 0) == "waiting"

    def test_applied_cold_after_max(self):
        assert compute_urgency("applied", 20, 10, DEFAULT_CADENCE["applied_max_followups"]) == "cold"

    def test_assessment_urgent(self):
        assert compute_urgency(ApplicationStatus.ASSESSMENT.value, 0, None, 0) == "urgent"

    def test_assessment_overdue(self):
        assert compute_urgency(ApplicationStatus.ASSESSMENT.value, 5, None, 0) == "overdue"

    def test_interview_waiting(self):
        assert compute_urgency(ApplicationStatus.INTERVIEW.value, 0, None, 0) == "waiting"


class TestComputeNextDueAt:
    def test_applied_first_due(self):
        now = datetime.now(timezone.utc)
        app = Application(
            company="X", role="Y", job_description="Z",
            status=ApplicationStatus.APPLIED.value,
            applied_at=now,
        )
        due = compute_next_due_at(app, 0, None)
        assert due is not None
        assert (due.date() - now.date()).days == DEFAULT_CADENCE["applied_first"]

    def test_applied_cold_no_due(self):
        now = datetime.now(timezone.utc)
        app = Application(
            company="X", role="Y", job_description="Z",
            status=ApplicationStatus.APPLIED.value,
            applied_at=now - timedelta(days=30),
        )
        due = compute_next_due_at(app, DEFAULT_CADENCE["applied_max_followups"], now)
        assert due is None
