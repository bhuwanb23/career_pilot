import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import AnalyticsSnapshot
from services.analytics import get_analytics_summary, get_phase6_snapshot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsSnapshot)
def get_analytics(db: Session = Depends(get_db)):
    return get_phase6_snapshot(db)


@router.get("/summary", response_model=AnalyticsSnapshot)
async def get_analytics_with_narrative(db: Session = Depends(get_db)):
    return await get_analytics_summary(db)
