import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import CareerProfile
from schemas import PersonaGenerateRequest, PersonaGenerateResponse, PersonaItem
from services.persona_generator import generate_personas
from services.persona_service import (
    create_persona,
    delete_all_personas,
    delete_persona,
    get_persona,
    get_personas,
    persona_to_dict,
)
from services.profile_service import get_profile, profile_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.post("/generate", response_model=PersonaGenerateResponse)
async def generate_all_personas(body: PersonaGenerateRequest, db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=400, detail="No career profile found. Upload a resume first.")

    profile_dict = profile_to_dict(profile)
    persona_data_list = await generate_personas(profile_dict, body.persona_names)

    delete_all_personas(db, profile.id)

    created = []
    for pd in persona_data_list:
        persona = create_persona(db, profile.id, pd)
        created.append(persona)

    return PersonaGenerateResponse(
        personas=[persona_to_dict(p) for p in created],
        count=len(created),
    )


@router.get("", response_model=list[PersonaItem])
def list_personas(db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        return []
    personas = get_personas(db, profile.id)
    return [persona_to_dict(p) for p in personas]


@router.get("/{persona_id}", response_model=PersonaItem)
def get_single_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = get_persona(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found.")
    return persona_to_dict(persona)


@router.delete("/{persona_id}")
def delete_single_persona(persona_id: int, db: Session = Depends(get_db)):
    if not delete_persona(db, persona_id):
        raise HTTPException(status_code=404, detail="Persona not found.")
    return {"detail": "Persona deleted."}
