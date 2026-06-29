import json
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from models import Application, ApplicationActivity, ApplicationStatus

STATUS_ALIASES = {
    "saved": ApplicationStatus.DRAFT.value,
    "screening": ApplicationStatus.ASSESSMENT.value,
}

VALID_STATUSES = {s.value for s in ApplicationStatus}


def normalize_status(value: str) -> str:
    if not value:
        raise HTTPException(status_code=400, detail="Status is required.")
    lowered = value.strip().lower()
    if lowered in STATUS_ALIASES:
        return STATUS_ALIASES[lowered]
    if lowered not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{value}'. Valid: {', '.join(sorted(VALID_STATUSES))}",
        )
    return lowered


def validate_status(value: str) -> str:
    return normalize_status(value)


def record_activity(
    db: Session,
    application_id: int,
    kind: str,
    message: str,
    meta: dict | None = None,
) -> ApplicationActivity:
    activity = ApplicationActivity(
        application_id=application_id,
        kind=kind,
        message=message,
    )
    activity.set_meta(meta or {})
    db.add(activity)
    return activity


def apply_status_update(db: Session, app: Application, new_status: str) -> None:
    canonical = normalize_status(new_status)
    old_status = app.status
    if old_status == canonical:
        return

    now = datetime.now(timezone.utc)
    app.status = canonical
    if canonical == ApplicationStatus.APPLIED.value and not app.applied_at:
        app.applied_at = now
    if canonical == ApplicationStatus.INTERVIEW.value and not app.interview_at:
        app.interview_at = now

    record_activity(
        db,
        app.id,
        "status_change",
        f"Status changed from {old_status} to {canonical}",
        {"from": old_status, "to": canonical},
    )

    if canonical == ApplicationStatus.APPLIED.value:
        from services.outreach import maybe_seed_on_applied
        maybe_seed_on_applied(db, app)


def effective_score(app: Application) -> float:
    if app.score_overall and app.score_overall > 0:
        return app.score_overall
    return (app.match_score or 0) * 100


def build_timeline(db: Session, app_id: int) -> list[dict]:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        return []

    events: list[dict] = []

    events.append({
        "kind": "milestone",
        "message": "Application created",
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "meta": {},
    })

    if app.applied_at:
        events.append({
            "kind": "milestone",
            "message": "Marked as applied",
            "created_at": app.applied_at.isoformat(),
            "meta": {"status": ApplicationStatus.APPLIED.value},
        })

    if app.interview_at:
        events.append({
            "kind": "milestone",
            "message": "Interview stage reached",
            "created_at": app.interview_at.isoformat(),
            "meta": {"status": ApplicationStatus.INTERVIEW.value},
        })

    activities = (
        db.query(ApplicationActivity)
        .filter(ApplicationActivity.application_id == app_id)
        .order_by(ApplicationActivity.created_at.desc())
        .all()
    )
    for act in activities:
        events.append({
            "id": act.id,
            "kind": act.kind,
            "message": act.message,
            "created_at": act.created_at.isoformat() if act.created_at else None,
            "meta": act.get_meta(),
        })

    from services.followup_cadence import analyze_application
    cadence = analyze_application(app, activities)
    if cadence.get("next_due_at") and cadence.get("urgency") in ("overdue", "urgent", "waiting"):
        events.append({
            "kind": "upcoming",
            "message": f"Follow-up {cadence['urgency']}",
            "created_at": cadence["next_due_at"].isoformat(),
            "meta": {
                "due_at": cadence["next_due_at"].isoformat(),
                "urgency": cadence["urgency"],
            },
        })

    events.sort(key=lambda e: e.get("created_at") or "", reverse=True)
    return events


def query_applications(
    db: Session,
    *,
    q: str | None = None,
    statuses: list[str] | None = None,
    company: str | None = None,
    min_score: float | None = None,
    max_score: float | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort: str = "newest",
) -> list[Application]:
    query = db.query(Application)

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Application.company.ilike(pattern),
                Application.role.ilike(pattern),
                Application.job_description.ilike(pattern),
                Application.jd_parsed.ilike(pattern),
            )
        )

    if statuses:
        normalized = [normalize_status(s) for s in statuses]
        query = query.filter(Application.status.in_(normalized))

    if company:
        query = query.filter(Application.company.ilike(f"%{company}%"))

    if min_score is not None:
        query = query.filter(
            func.coalesce(
                func.nullif(Application.score_overall, 0),
                Application.match_score * 100,
            ) >= min_score
        )

    if max_score is not None:
        query = query.filter(
            func.coalesce(
                func.nullif(Application.score_overall, 0),
                Application.match_score * 100,
            ) <= max_score
        )

    if date_from:
        query = query.filter(Application.created_at >= date_from)
    if date_to:
        query = query.filter(Application.created_at <= date_to)

    if sort == "oldest":
        query = query.order_by(Application.created_at.asc())
    elif sort == "score_desc":
        query = query.order_by(
            func.coalesce(
                func.nullif(Application.score_overall, 0),
                Application.match_score * 100,
            ).desc(),
            Application.created_at.desc(),
        )
    elif sort == "deadline_asc":
        query = query.order_by(
            Application.deadline.asc().nullslast(),
            Application.created_at.desc(),
        )
    else:
        query = query.order_by(Application.created_at.desc(), Application.board_order.asc())

    return query.all()
