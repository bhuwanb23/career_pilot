import json
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application, InterviewPrep
from schemas import InterviewNotesUpdate, InterviewPrepResponse
from services.interview_prep import generate_prep
from services.profile_service import get_profile, profile_to_dict

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/prepare/{app_id}", response_model=InterviewPrepResponse)
async def prepare_interview(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    existing = db.query(InterviewPrep).filter(InterviewPrep.application_id == app_id).first()
    if existing:
        return existing

    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found.")

    profile_dict = profile_to_dict(profile)
    try:
        result = await generate_prep(
            company=app.company,
            role=app.role,
            job_description=app.job_description,
            profile_data=profile_dict,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Interview prep failed: {str(e)}")

    prep = InterviewPrep(
        application_id=app_id,
        company_summary=result.get("company_summary", ""),
    )
    prep.set_questions(result.get("questions", []))
    prep.set_star_answers(result.get("star_answers", []))

    db.add(prep)
    db.commit()
    db.refresh(prep)
    return prep


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
