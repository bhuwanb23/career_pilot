import logging

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from schemas import ProfileResponse
from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
from services.resume_parser import parse_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/upload", response_model=ProfileResponse)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    try:
        parsed = await parse_resume(content)
    except Exception:
        logger.exception("Resume parsing failed for %s", file.filename)
        raise HTTPException(status_code=500, detail="Resume parsing failed. Check logs for details.")

    profile = create_or_update_profile(db, parsed)
    return profile
