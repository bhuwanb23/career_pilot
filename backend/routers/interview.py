import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Application, InterviewPrep
from schemas import (
    InterviewDashboardResponse,
    InterviewKitRequest,
    InterviewNotesUpdate,
    InterviewPrepResponse,
)
from services.interview_kit import build_and_save_prep, get_dashboard_items
from services.profile_service import get_profile, profile_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.get("/dashboard", response_model=InterviewDashboardResponse)
def interview_dashboard(db: Session = Depends(get_db)):
    items = get_dashboard_items(db)
    return InterviewDashboardResponse(items=items, total=len(items))


@router.post("/prepare/{app_id}", response_model=InterviewPrepResponse)
async def prepare_interview(
    app_id: int,
    regenerate: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found.")

    profile_dict = profile_to_dict(profile)
    try:
        return await build_and_save_prep(db, app, profile_dict, regenerate=regenerate)
    except Exception:
        logger.exception("Interview prep failed for app_id=%d", app_id)
        raise HTTPException(status_code=500, detail="Interview prep failed. Check logs for details.")


@router.get("/{app_id}", response_model=InterviewPrepResponse)
def get_prep(app_id: int, db: Session = Depends(get_db)):
    prep = db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="No interview prep found for this application.")
    return prep


@router.put("/{app_id}", response_model=InterviewPrepResponse)
def update_notes(app_id: int, body: InterviewNotesUpdate, db: Session = Depends(get_db)):
    prep = db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="No interview prep found.")
    prep.notes = body.notes
    db.commit()
    db.refresh(prep)
    return prep


@router.post("/kit")
async def generate_interview_kit(
    body: InterviewKitRequest,
    regenerate: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == body.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    existing = db.query(InterviewPrep).filter(InterviewPrep.application_id == body.application_id).first()
    if existing and not regenerate:
        return {
            "application_id": app.id,
            "company": app.company,
            "role": app.role,
            "interview_prep": existing,
            "cached": True,
        }

    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    profile_dict = profile_to_dict(profile)
    try:
        prep = await build_and_save_prep(db, app, profile_dict, regenerate=regenerate)
    except Exception:
        logger.exception("Interview kit failed for app_id=%d", body.application_id)
        raise HTTPException(status_code=500, detail="Interview kit generation failed.")

    return {
        "application_id": app.id,
        "company": app.company,
        "role": app.role,
        "interview_prep": prep,
        "cached": False,
    }
