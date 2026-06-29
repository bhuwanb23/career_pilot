import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Application
from schemas import (
    FollowUpGenerateRequest,
    MarkOutreachSentRequest,
    OutreachDashboardResponse,
    OutreachSequenceResponse,
    OutreachSequenceUpdate,
)
from services.followup_cadence import build_dashboard_items, build_due_items
from services.outreach import generate_step, get_sequence_state, mark_step_sent, save_sequence_steps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/outreach", tags=["outreach"])


@router.get("/dashboard", response_model=OutreachDashboardResponse)
def outreach_dashboard(db: Session = Depends(get_db)):
    items = build_dashboard_items(db)
    return OutreachDashboardResponse(items=items, total=len(items))


@router.get("/due", response_model=OutreachDashboardResponse)
def outreach_due(db: Session = Depends(get_db)):
    items = build_due_items(db)
    return OutreachDashboardResponse(items=items, total=len(items))


@router.get("/{app_id}", response_model=OutreachSequenceResponse)
def get_outreach(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return get_sequence_state(db, app)


@router.put("/{app_id}/sequence", response_model=OutreachSequenceResponse)
def update_sequence(app_id: int, body: OutreachSequenceUpdate, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    steps = [s.model_dump() for s in body.steps]
    save_sequence_steps(app, steps)
    db.commit()
    db.refresh(app)
    return get_sequence_state(db, app)


@router.post("/{app_id}/generate", response_model=OutreachSequenceResponse)
async def generate_outreach_message(
    app_id: int,
    body: FollowUpGenerateRequest,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    try:
        return await generate_step(
            db,
            app,
            step_type=body.step_type,
            channel=body.channel,
            step_id=body.step_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Outreach generate failed for app_id=%d", app_id)
        raise HTTPException(status_code=500, detail="Follow-up generation failed.")


@router.post("/{app_id}/mark-sent", response_model=OutreachSequenceResponse)
def mark_outreach_sent(app_id: int, body: MarkOutreachSentRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    try:
        return mark_step_sent(db, app, body.step_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
