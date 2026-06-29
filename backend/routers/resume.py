import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Application, ResumeUpload
from schemas import ProfileResponse
from services.document_extractor import SUPPORTED_EXTENSIONS
from services.file_storage import compute_file_hash, delete_stored_file, get_stored_file, store_file
from services.profile_service import create_or_update_profile, get_profile
from services.resume_parser import parse_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])


class UploadResponse(BaseModel):
    upload_id: int
    filename: str
    file_type: str
    file_size: int
    status: str
    profile_id: int | None = None


@router.post("/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty.")
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    file_hash = compute_file_hash(content)
    existing = db.query(ResumeUpload).filter(ResumeUpload.file_hash == file_hash).first()
    if existing:
        logger.info("Duplicate upload detected: hash=%s, existing id=%d", file_hash, existing.id)

    storage_path = store_file(file.filename, content)

    upload = ResumeUpload(
        filename=file.filename,
        file_size=file_size,
        file_type=ext.lstrip("."),
        file_hash=file_hash,
        storage_path=storage_path,
        status="uploaded",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    try:
        raw_text = ""
        if ext == ".pdf":
            from services.document_extractor import _extract_with_pymupdf
            extracted = _extract_with_pymupdf(content)
            raw_text = extracted["text"]
        elif ext == ".docx":
            from services.document_extractor import _extract_with_docx
            extracted = _extract_with_docx(content)
            raw_text = extracted["text"]

        if not raw_text:
            upload.status = "failed"
            upload.parse_error = "No text could be extracted from the file."
            db.commit()
            raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

        parsed = await parse_resume(content)
        parsed["raw_resume"] = raw_text
        profile = create_or_update_profile(db, parsed)

        try:
            from services.profile_generator import generate_career_profile
            from services.profile_service import profile_to_dict
            from datetime import datetime, timezone
            profile_dict = profile_to_dict(profile)
            enriched = await generate_career_profile(profile_dict)
            enriched["profile_generated_at"] = datetime.now(timezone.utc)
            create_or_update_profile(db, enriched)
        except Exception:
            logger.warning("Auto profile generation failed", exc_info=True)

        upload.raw_text = raw_text
        upload.status = "parsed"
        db.commit()

        from services.career_memory import store_resume_version, store_skill_snapshot
        from services.profile_utils import coerce_string_list
        version = db.query(ResumeUpload).count()
        try:
            store_resume_version(db, parsed, version)
            store_skill_snapshot(db, coerce_string_list(parsed.get("skills", [])))
        except Exception:
            logger.debug("Career memory storage failed", exc_info=True)

        try:
            from services.pipeline import advance_pipeline
            from models import PipelineStage
            apps = db.query(Application).all()
            for app in apps:
                advance_pipeline(db, app.id, PipelineStage.RESUME_UPLOADED)
        except Exception:
            logger.debug("Pipeline advance after upload failed", exc_info=True)

        return UploadResponse(
            upload_id=upload.id,
            filename=upload.filename,
            file_type=upload.file_type,
            file_size=upload.file_size,
            status="parsed",
            profile_id=profile.id,
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Resume parsing failed for %s", file.filename)
        upload.status = "failed"
        upload.parse_error = "Parsing failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Resume parsing failed. Check logs for details.")


@router.get("/uploads")
def list_uploads(db: Session = Depends(get_db)):
    uploads = db.query(ResumeUpload).order_by(ResumeUpload.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "filename": u.filename,
            "file_type": u.file_type,
            "file_size": u.file_size,
            "status": u.status,
            "created_at": u.created_at,
        }
        for u in uploads
    ]


@router.get("/uploads/{upload_id}")
def get_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(ResumeUpload).filter(ResumeUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    return {
        "id": upload.id,
        "filename": upload.filename,
        "file_type": upload.file_type,
        "file_size": upload.file_size,
        "file_hash": upload.file_hash,
        "status": upload.status,
        "parse_error": upload.parse_error,
        "raw_text_preview": upload.raw_text[:500] if upload.raw_text else "",
        "created_at": upload.created_at,
    }


@router.get("/uploads/{upload_id}/download")
def download_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(ResumeUpload).filter(ResumeUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    if not upload.storage_path:
        raise HTTPException(status_code=404, detail="File not stored on disk.")

    content = get_stored_file(upload.storage_path)
    if not content:
        raise HTTPException(status_code=404, detail="File not found on disk.")

    media_type = "application/pdf" if upload.file_type == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={upload.filename}"},
    )


@router.delete("/uploads/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(ResumeUpload).filter(ResumeUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    if upload.storage_path:
        delete_stored_file(upload.storage_path)
    db.delete(upload)
    db.commit()
    return {"detail": "Upload deleted."}
