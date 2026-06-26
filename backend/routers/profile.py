from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import ProfileResponse, ProfileUpdate
from services.profile_service import create_or_update_profile, get_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def read_profile(db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="No career profile found. Upload a resume first.")
    return profile


@router.put("", response_model=ProfileResponse)
def update_profile(body: ProfileUpdate, db: Session = Depends(get_db)):
    data = body.model_dump(exclude_unset=True)
    profile = create_or_update_profile(db, data)
    return profile
