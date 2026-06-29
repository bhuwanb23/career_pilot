"""Follow-up cadence rules ported from career-ops-src/followup-cadence.mjs."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models import Application, ApplicationActivity, ApplicationStatus
from services.application_management import effective_score

DEFAULT_CADENCE = {
    "applied_first": 7,
    "applied_subsequent": 7,
    "applied_max_followups": 2,
    "responded_initial": 1,
    "responded_subsequent": 3,
    "interview_thankyou": 1,
}

ACTIONABLE_STATUSES = {
    ApplicationStatus.APPLIED.value,
    ApplicationStatus.ASSESSMENT.value,
    ApplicationStatus.INTERVIEW.value,
}

CADENCE_STATUS_MAP = {
    ApplicationStatus.APPLIED.value: "applied",
    ApplicationStatus.ASSESSMENT.value: "responded",
    ApplicationStatus.INTERVIEW.value: "interview",
}


def _utc_date(dt: datetime | None) -> datetime | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def days_between(start: datetime, end: datetime) -> int:
    s = _utc_date(start)
    e = _utc_date(end)
    if not s or not e:
        return 0
    return (e.date() - s.date()).days


def add_days(dt: datetime, days: int) -> datetime:
    base = _utc_date(dt) or datetime.now(timezone.utc)
    return base + timedelta(days=days)


def compute_urgency(
    status: str,
    days_since_apply: int,
    days_since_last_followup: int | None,
    followup_count: int,
    cadence: dict | None = None,
) -> str:
    c = {**DEFAULT_CADENCE, **(cadence or {})}
    cadence_status = CADENCE_STATUS_MAP.get(status, status)

    if cadence_status == "applied":
        if followup_count >= c["applied_max_followups"]:
            return "cold"
        if followup_count == 0 and days_since_apply >= c["applied_first"]:
            return "overdue"
        if followup_count > 0 and days_since_last_followup is not None and days_since_last_followup >= c["applied_subsequent"]:
            return "overdue"
        return "waiting"

    if cadence_status == "responded":
        if days_since_apply < c["responded_initial"]:
            return "urgent"
        if days_since_apply >= c["responded_subsequent"]:
            return "overdue"
        return "waiting"

    if cadence_status == "interview":
        if days_since_apply >= c["interview_thankyou"]:
            return "overdue"
        return "waiting"

    return "waiting"


def compute_next_due_at(
    app: Application,
    followup_count: int,
    last_followup_at: datetime | None,
    cadence: dict | None = None,
) -> datetime | None:
    c = {**DEFAULT_CADENCE, **(cadence or {})}
    cadence_status = CADENCE_STATUS_MAP.get(app.status, app.status)
    anchor = _utc_date(app.applied_at) or _utc_date(app.created_at)
    if not anchor:
        return None

    if cadence_status == "applied":
        if followup_count >= c["applied_max_followups"]:
            return None
        if followup_count == 0:
            return add_days(anchor, c["applied_first"])
        if last_followup_at:
            return add_days(last_followup_at, c["applied_subsequent"])
        return add_days(anchor, c["applied_first"])

    if cadence_status == "responded":
        if last_followup_at:
            return add_days(last_followup_at, c["responded_subsequent"])
        return add_days(anchor, c["responded_subsequent"])

    if cadence_status == "interview":
        interview_anchor = _utc_date(app.interview_at) or anchor
        return add_days(interview_anchor, c["interview_thankyou"])

    return None


def count_followups(activities: list[ApplicationActivity]) -> tuple[int, datetime | None]:
    """Return (followup_count, last_followup_at) from outreach_sent activities."""
    sent = [
        a for a in activities
        if a.kind == "outreach_sent"
    ]
    followups = [
        a for a in sent
        if a.get_meta().get("step_type") in ("follow_up", "thank_you")
        or a.get_meta().get("step_id", "").startswith("follow_up")
    ]
    count = len(followups) if followups else max(0, len(sent) - 1)
    last_at = None
    if sent:
        latest = max(sent, key=lambda a: a.created_at or datetime.min.replace(tzinfo=timezone.utc))
        last_at = latest.created_at
    return count, last_at


def analyze_application(app: Application, activities: list[ApplicationActivity]) -> dict:
    now = datetime.now(timezone.utc)
    anchor = _utc_date(app.applied_at) or _utc_date(app.created_at)
    days_since_apply = days_between(anchor, now) if anchor else 0
    followup_count, last_followup_at = count_followups(activities)
    days_since_last = days_between(last_followup_at, now) if last_followup_at else None
    urgency = compute_urgency(app.status, days_since_apply, days_since_last, followup_count)
    next_due = compute_next_due_at(app, followup_count, last_followup_at)
    return {
        "urgency": urgency,
        "next_due_at": next_due,
        "followup_count": followup_count,
        "days_since_apply": days_since_apply,
    }


def get_actionable_apps(db: Session) -> list[Application]:
    return (
        db.query(Application)
        .filter(Application.status.in_(list(ACTIONABLE_STATUSES)))
        .order_by(Application.applied_at.asc().nullslast(), Application.created_at.desc())
        .all()
    )


def get_app_activities(db: Session, app_id: int) -> list[ApplicationActivity]:
    return (
        db.query(ApplicationActivity)
        .filter(ApplicationActivity.application_id == app_id)
        .order_by(ApplicationActivity.created_at.desc())
        .all()
    )


def build_dashboard_items(db: Session) -> list[dict]:
    items = []
    for app in get_actionable_apps(db):
        activities = get_app_activities(db, app.id)
        analysis = analyze_application(app, activities)
        seq = app.get_outreach_sequence()
        steps = seq.get("steps") or []
        completed = sum(1 for s in steps if s.get("status") == "sent")
        items.append({
            "application_id": app.id,
            "company": app.company,
            "role": app.role,
            "status": app.status,
            "score_overall": effective_score(app),
            "urgency": analysis["urgency"],
            "next_due_at": analysis["next_due_at"],
            "followup_count": analysis["followup_count"],
            "steps_completed": completed,
            "steps_total": len(steps),
            "applied_at": app.applied_at,
        })
    return items


def build_due_items(db: Session) -> list[dict]:
    return [i for i in build_dashboard_items(db) if i["urgency"] in ("overdue", "urgent")]
