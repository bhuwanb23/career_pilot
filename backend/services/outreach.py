"""Outreach sequence orchestrator — seed, generate, mark-sent."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Application, ApplicationStatus
from services.application_management import record_activity
from services.follow_up_msg import generate_follow_up_msg
from services.followup_cadence import (
    add_days,
    analyze_application,
    compute_next_due_at,
    get_app_activities,
)
from services.profile_service import get_profile, profile_to_dict


def _empty_sequence() -> dict:
    return {"steps": [], "followup_count": 0}


def _iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _parse_iso(val: str | None) -> datetime | None:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def seed_default_sequence(app: Application) -> dict:
    existing = app.get_outreach_sequence()
    if existing.get("steps"):
        return existing

    now = datetime.now(timezone.utc)
    anchor = app.applied_at or app.created_at or now
    initial_msg = app.recruiter_msg or ""

    steps = [
        {
            "id": "initial",
            "type": "initial",
            "channel": "linkedin",
            "status": "sent" if initial_msg else "pending",
            "message": initial_msg,
            "due_at": _iso(now),
            "sent_at": _iso(now) if initial_msg else None,
        },
        {
            "id": "follow_up_1",
            "type": "follow_up",
            "channel": "linkedin",
            "status": "pending",
            "message": "",
            "due_at": _iso(add_days(anchor, 7)),
            "sent_at": None,
        },
        {
            "id": "thank_you",
            "type": "thank_you",
            "channel": "email",
            "status": "pending",
            "message": "",
            "due_at": _iso(add_days(app.interview_at or anchor, 1)) if app.status == ApplicationStatus.INTERVIEW.value else None,
            "sent_at": None,
        },
    ]

    seq = {"steps": steps, "followup_count": 1 if initial_msg else 0}
    app.set_outreach_sequence(seq)
    return seq


def get_sequence_state(db: Session, app: Application) -> dict:
    seq = app.get_outreach_sequence()
    if not seq.get("steps"):
        seq = seed_default_sequence(app)
        db.commit()
        db.refresh(app)

    activities = get_app_activities(db, app.id)
    analysis = analyze_application(app, activities)
    return {
        "application_id": app.id,
        "company": app.company,
        "role": app.role,
        "status": app.status,
        "urgency": analysis["urgency"],
        "next_due_at": analysis["next_due_at"],
        "followup_count": analysis["followup_count"],
        "steps": seq.get("steps") or [],
    }


def save_sequence_steps(app: Application, steps: list[dict]) -> dict:
    seq = app.get_outreach_sequence() or _empty_sequence()
    seq["steps"] = steps
    app.set_outreach_sequence(seq)
    return seq


def _find_step(steps: list[dict], step_id: str | None, step_type: str | None) -> dict | None:
    for s in steps:
        if step_id and s.get("id") == step_id:
            return s
        if step_type and s.get("type") == step_type and s.get("status") != "sent":
            return s
    return None


def _prior_message(steps: list[dict]) -> str:
    for s in steps:
        if s.get("message"):
            return s["message"]
    return ""


async def generate_step(
    db: Session,
    app: Application,
    *,
    step_type: str = "follow_up",
    channel: str = "linkedin",
    step_id: str | None = None,
) -> dict:
    profile = get_profile(db)
    if not profile:
        raise ValueError("No career profile found.")

    seq = app.get_outreach_sequence()
    if not seq.get("steps"):
        seq = seed_default_sequence(app)

    steps = seq.get("steps") or []
    step = _find_step(steps, step_id, step_type)
    if not step:
        raise ValueError(f"No step found for type={step_type} id={step_id}")

    profile_dict = profile_to_dict(profile)
    activities = get_app_activities(db, app.id)
    analysis = analyze_application(app, activities)

    message = await generate_follow_up_msg(
        profile_dict,
        app.company,
        app.role,
        step_type=step.get("type", step_type),
        channel=channel or step.get("channel", "linkedin"),
        prior_message=_prior_message(steps),
        days_since_apply=analysis.get("days_since_apply", 0),
    )

    step["message"] = message
    step["channel"] = channel or step.get("channel", "linkedin")
    step["status"] = "draft"
    seq["steps"] = steps
    app.set_outreach_sequence(seq)

    if step.get("type") == "initial":
        app.recruiter_msg = message

    db.commit()
    db.refresh(app)
    return get_sequence_state(db, app)


def mark_step_sent(db: Session, app: Application, step_id: str) -> dict:
    seq = app.get_outreach_sequence()
    if not seq.get("steps"):
        seq = seed_default_sequence(app)

    steps = seq.get("steps") or []
    step = _find_step(steps, step_id, None)
    if not step:
        raise ValueError(f"Step {step_id} not found")

    now = datetime.now(timezone.utc)
    step["status"] = "sent"
    step["sent_at"] = _iso(now)

    if step.get("type") == "initial":
        app.recruiter_msg = step.get("message") or app.recruiter_msg

    followup_count = seq.get("followup_count", 0)
    if step.get("type") != "initial":
        followup_count += 1
    seq["followup_count"] = followup_count
    seq["steps"] = steps
    app.set_outreach_sequence(seq)

    record_activity(
        db,
        app.id,
        "outreach_sent",
        f"Sent {step.get('type', 'outreach')} via {step.get('channel', 'linkedin')}",
        {
            "step_id": step_id,
            "step_type": step.get("type"),
            "channel": step.get("channel"),
            "message_preview": (step.get("message") or "")[:120],
        },
    )

    db.commit()
    db.refresh(app)
    return get_sequence_state(db, app)


def maybe_seed_on_applied(db: Session, app: Application) -> None:
    if app.status != ApplicationStatus.APPLIED.value:
        return
    seq = app.get_outreach_sequence()
    if not seq.get("steps"):
        seed_default_sequence(app)
