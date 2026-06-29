import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Application, InterviewPrep, PipelineStage
from services.interview_prep import generate_prep, prep_to_model_fields
from services.pipeline import advance_pipeline

logger = logging.getLogger(__name__)

INTERVIEW_DASHBOARD_STATUSES = {"interview", "assessment", "offer"}


def get_dashboard_items(db: Session) -> list[dict]:
    apps = (
        db.query(Application)
        .filter(
            (Application.status.in_(list(INTERVIEW_DASHBOARD_STATUSES)))
            | (Application.interview_at.isnot(None))
        )
        .order_by(Application.interview_at.asc().nullslast(), Application.created_at.desc())
        .all()
    )

    items = []
    for app in apps:
        prep = db.query(InterviewPrep).filter(InterviewPrep.application_id == app.id).first()
        items.append({
            "application_id": app.id,
            "company": app.company,
            "role": app.role,
            "status": app.status,
            "score_overall": app.score_overall or (app.match_score or 0) * 100,
            "interview_at": app.interview_at,
            "has_prep": prep is not None,
            "prep_created_at": prep.created_at if prep else None,
        })
    return items


def apply_prep_to_model(prep: InterviewPrep, fields: dict) -> None:
    prep.company_summary = fields.get("company_summary", "")
    prep.set_company_intel(fields.get("company_intel", {}))
    prep.set_questions(fields.get("questions", []))
    prep.set_star_answers(fields.get("star_answers", []))
    prep.set_prep_notes(fields.get("prep_notes", {}))
    prep.set_ai_suggestions(fields.get("ai_suggestions", []))


def delete_prep(db: Session, app_id: int) -> None:
    db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).delete()


async def build_and_save_prep(
    db: Session,
    app: Application,
    profile_dict: dict,
    *,
    regenerate: bool = False,
) -> InterviewPrep:
    existing = db.query(InterviewPrep).filter(InterviewPrep.application_id == app.id).first()
    if existing and not regenerate:
        return existing

    if existing and regenerate:
        delete_prep(db, app.id)
        db.flush()

    result = await generate_prep(
        company=app.company,
        role=app.role,
        job_description=app.job_description,
        profile_data=profile_dict,
    )
    fields = prep_to_model_fields(result)

    prep = InterviewPrep(application_id=app.id)
    apply_prep_to_model(prep, fields)
    db.add(prep)

    if not app.interview_at:
        app.interview_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(prep)

    try:
        advance_pipeline(db, app.id, PipelineStage.INTERVIEW_READY)
    except Exception:
        logger.debug("Pipeline advance to interview_ready failed", exc_info=True)

    return prep
