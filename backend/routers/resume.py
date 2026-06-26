import traceback
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from config import MAX_UPLOAD_SIZE_MB
from database import get_db
from schemas import ProfileResponse
from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
from services.resume_parser import parse_resume

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/upload", response_model=ProfileResponse)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit.")

    try:
        parsed = await parse_resume(content)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

    profile = create_or_update_profile(db, parsed)
    return profile
