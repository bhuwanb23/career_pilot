import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from services.profile_service import get_profile, profile_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/careerops", tags=["careerops"])


class ScanRequest(BaseModel):
    portals: list[str] = []


class EvaluateRequest(BaseModel):
    company: str = ""
    role: str = ""
    job_description: str = ""


@router.post("/sync")
async def sync_to_careerops(db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    from services.careerops import sync_all
    profile_dict = profile_to_dict(profile)
    result = sync_all(profile_dict)

    return {
        "status": "synced",
        "cv_path": result["cv_path"],
        "config_path": result["config_path"],
        "workspace": result["workspace"],
    }


@router.post("/scan")
async def scan_jobs(body: ScanRequest, db: Session = Depends(get_db)):
    from services.careerops import run_careerops_scan
    result = await run_careerops_scan(body.portals or None)
    return result


@router.post("/evaluate")
async def evaluate_job(body: EvaluateRequest, db: Session = Depends(get_db)):
    from services.careerops import run_careerops_evaluate
    job_data = {"company": body.company, "role": body.role, "job_description": body.job_description}
    result = await run_careerops_evaluate(job_data)
    return result


@router.get("/workspace")
async def get_workspace_info():
    from services.careerops import get_workspace_info
    return get_workspace_info()
