import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application, PipelineStage
from schemas import (
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
)
from services.jd_parser import parse_jd
from services.pipeline import advance_pipeline
from services.profile_service import get_profile, profile_to_dict
from services.recruiter_msg import generate_recruiter_msg
from services.resume_matcher import match_resume_to_jd
from services.smart_application import apply_smart_result_to_application, run_smart_application

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["applications"])


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
        status="saved",
    )
    apply_smart_result_to_application(app, result)
    db.add(app)
    db.commit()
    db.refresh(app)

    try:
        advance_pipeline(db, app.id, PipelineStage.JD_PARSED)
    except Exception:
        logger.debug("Pipeline advance failed", exc_info=True)

    return app


@router.get("/applications", response_model=list[ApplicationResponse])
def list_applications(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    return query.order_by(Application.created_at.desc()).all()


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


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, body: ApplicationUpdate, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if body.status is not None:
        app.status = body.status
    if body.notes is not None:
        app.notes = body.notes

    db.commit()
    db.refresh(app)
    return app


@router.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    from models import InterviewPrep
    db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).delete()
    db.delete(app)
    db.commit()
    return {"detail": "Application deleted."}


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
