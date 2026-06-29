import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Application, ApplicationActivity, PipelineStage
from schemas import (
    ApplicationActivityCreate,
    ApplicationActivityResponse,
    ApplicationResponse,
    ApplicationScoreResponse,
    ApplicationUpdate,
    CoverLetterRequest,
    JDParseRequest,
    JDParseResponse,
    JobAnalyzeRequest,
    RecruiterMessageRequest,
    ResumeMatchRequest,
    ResumeMatchResponse,
    TimelineResponse,
)
from services.application_management import (
    apply_status_update,
    build_timeline,
    query_applications,
    record_activity,
    validate_status,
)
from services.jd_parser import parse_jd
from services.pipeline import advance_pipeline
from services.profile_service import get_profile, profile_to_dict
from services.recruiter_msg import generate_recruiter_msg
from services.resume_matcher import match_resume_to_jd
from services.smart_application import apply_smart_result_to_application, run_smart_application

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["applications"])


def _sync_careerops_best_effort(app: Application) -> None:
    try:
        from services.careerops import sync_application_to_tracker
        sync_application_to_tracker(app)
    except Exception:
        logger.debug("CareerOps sync failed for app %s", app.id, exc_info=True)


@router.post("/jobs/parse", response_model=JDParseResponse)
def parse_job_description(body: JDParseRequest):
    if not body.job_description.strip() and not body.url.strip():
        raise HTTPException(status_code=400, detail="Job description or URL is required.")
    parsed = parse_jd(body.job_description, body.url)
    return JDParseResponse(
        company=parsed["company"],
        role=parsed["role"],
        skills=parsed["skills"],
        requirements=parsed["requirements"],
        nice_to_have=parsed["nice_to_have"],
        experience_level=parsed["experience_level"],
        location=parsed["location"],
        is_remote=parsed["is_remote"],
    )


@router.post("/jobs/match", response_model=ResumeMatchResponse)
def match_job_to_profile(body: ResumeMatchRequest, db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    jd = parse_jd(body.job_description)
    match = match_resume_to_jd(profile_to_dict(profile), jd)
    return ResumeMatchResponse(**match)


@router.post("/jobs/analyze", response_model=ApplicationResponse)
async def analyze_and_save_job(body: JobAnalyzeRequest, db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    profile_dict = profile_to_dict(profile)
    try:
        result = await run_smart_application(body.job_description, body.url, profile_dict)
    except Exception:
        logger.exception("Smart application analysis failed")
        raise HTTPException(status_code=500, detail="Job analysis failed. Check logs for details.")

    app = Application(
        job_description=body.job_description,
        url=body.url,
        status="draft",
    )
    apply_smart_result_to_application(app, result)
    db.add(app)
    db.commit()
    db.refresh(app)

    record_activity(db, app.id, "status_change", "Application created as draft", {"to": "draft"})
    db.commit()

    try:
        advance_pipeline(db, app.id, PipelineStage.JD_PARSED)
    except Exception:
        logger.debug("Pipeline advance failed", exc_info=True)

    return app


@router.get("/applications", response_model=list[ApplicationResponse])
def list_applications(
    q: str | None = None,
    status: list[str] | None = Query(default=None),
    company: str | None = None,
    min_score: float | None = None,
    max_score: float | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort: str = "newest",
    db: Session = Depends(get_db),
):
    return query_applications(
        db,
        q=q,
        statuses=status,
        company=company,
        min_score=min_score,
        max_score=max_score,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
    )


@router.get("/applications/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return app


@router.get("/applications/{app_id}/score", response_model=ApplicationScoreResponse)
def get_application_score(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return ApplicationScoreResponse(
        application_id=app.id,
        fit=app.score_fit,
        timing=app.score_timing,
        competition=app.score_competition,
        readiness=app.score_readiness,
        overall=app.score_overall,
    )


@router.get("/applications/{app_id}/timeline", response_model=TimelineResponse)
def get_application_timeline(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    events = build_timeline(db, app_id)
    return TimelineResponse(application_id=app_id, events=events)


@router.post("/applications/{app_id}/activities", response_model=ApplicationActivityResponse)
def add_application_activity(
    app_id: int,
    body: ApplicationActivityCreate,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if body.kind not in ("note", "reminder"):
        raise HTTPException(status_code=400, detail="kind must be 'note' or 'reminder'")

    activity = record_activity(db, app_id, body.kind, body.message, body.meta)
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, body: ApplicationUpdate, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    status_changed = False
    if body.status is not None:
        apply_status_update(db, app, body.status)
        status_changed = True
    if body.notes is not None:
        app.notes = body.notes
    if body.priority is not None:
        if body.priority not in ("low", "normal", "high"):
            raise HTTPException(status_code=400, detail="priority must be low, normal, or high")
        app.priority = body.priority
    if body.deadline is not None:
        app.deadline = body.deadline
    if body.applied_at is not None:
        app.applied_at = body.applied_at
    if body.interview_at is not None:
        app.interview_at = body.interview_at
    if body.board_order is not None:
        app.board_order = body.board_order

    db.commit()
    db.refresh(app)

    if status_changed:
        _sync_careerops_best_effort(app)

    return app


@router.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    from models import InterviewPrep, ApplicationPipeline
    db.query(ApplicationActivity).filter(ApplicationActivity.application_id == app_id).delete()
    db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).delete()
    db.query(ApplicationPipeline).filter(ApplicationPipeline.application_id == app_id).delete()
    db.delete(app)
    db.commit()
    return {"detail": "Application deleted."}


@router.post("/applications/{app_id}/sync-careerops")
def sync_application_careerops(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    from services.careerops import sync_application_to_tracker
    result = sync_application_to_tracker(app)
    return result


@router.post("/applications/{app_id}/recruiter-message")
async def regenerate_recruiter_message(
    app_id: int,
    body: RecruiterMessageRequest,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    msg = await generate_recruiter_msg(
        profile_to_dict(profile), app.company, app.role, body.channel,
    )
    app.recruiter_msg = msg
    db.commit()

    return {
        "application_id": app.id,
        "company": app.company,
        "role": app.role,
        "channel": body.channel,
        "recruiter_msg": msg,
    }


@router.post("/cover-letter")
async def generate_cover_letter_endpoint(body: CoverLetterRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == body.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    from services.cover_letter import generate_cover_letter
    profile_dict = profile_to_dict(profile)
    letter = await generate_cover_letter(
        profile_dict, app.company, app.role, app.job_description, body.tone,
    )
    app.cover_letter = letter
    db.commit()

    return {
        "application_id": app.id,
        "company": app.company,
        "role": app.role,
        "cover_letter": letter,
    }
