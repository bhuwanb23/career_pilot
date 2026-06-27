import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application, CareerProfile
from schemas import (
    ApplicationResponse,
    ApplicationUpdate,
    JobAnalyzeRequest,
    ProfileResponse,
)
from services.job_analyzer import analyze_job
from services.profile_service import get_profile, profile_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["applications"])


@router.post("/jobs/analyze", response_model=ApplicationResponse)
async def analyze_and_save_job(body: JobAnalyzeRequest, db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    profile_dict = profile_to_dict(profile)
    try:
        result = await analyze_job(body.job_description, profile_dict)
    except Exception:
        logger.exception("Job analysis failed")
        raise HTTPException(status_code=500, detail="Job analysis failed. Check logs for details.")

    app = Application(
        company=result.get("company", "Unknown"),
        role=result.get("role", "Unknown"),
        job_description=body.job_description,
        status="applied",
        cover_letter=result.get("cover_letter", ""),
        recruiter_msg=result.get("recruiter_msg", ""),
        match_score=result.get("match_score", 0.0),
        match_analysis=result.get("match_analysis", ""),
        url=body.url,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
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
