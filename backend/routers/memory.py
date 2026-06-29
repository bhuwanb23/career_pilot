import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from schemas import ChatMessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory", tags=["memory"])


class MemoryStoreRequest(BaseModel):
    category: str
    key: str
    value: str
    metadata: dict = {}
    source: str = "user"
    confidence: float = 1.0


@router.get("")
def list_all_memory(db: Session = Depends(get_db)):
    from services.career_memory import get_all_career_memory
    return get_all_career_memory(db)


@router.get("/{category}")
def list_memory_by_category(category: str, db: Session = Depends(get_db)):
    from services.career_memory import get_memory_by_category
    return get_memory_by_category(db, category)


@router.post("")
def store_memory_entry(body: MemoryStoreRequest, db: Session = Depends(get_db)):
    from services.career_memory import store_memory
    store_memory(db, body.category, body.key, body.value,
                 metadata=body.metadata, source=body.source, confidence=body.confidence)
    return {"status": "stored", "category": body.category, "key": body.key}


@router.delete("/{memory_id}")
def delete_memory_entry(memory_id: int, db: Session = Depends(get_db)):
    from services.career_memory import delete_memory
    if not delete_memory(db, memory_id):
        raise HTTPException(status_code=404, detail="Memory entry not found.")
    return {"detail": "Memory entry deleted."}


@router.get("/context/view")
def get_memory_context_view(db: Session = Depends(get_db)):
    from services.career_memory import get_memory_for_prompt
    return {"context": get_memory_for_prompt(db)}
