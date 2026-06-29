import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import CareerPersona

logger = logging.getLogger(__name__)


def create_persona(db: Session, profile_id: int, persona_data: dict) -> CareerPersona:
    slug = persona_data.get("persona_name", "").lower().replace(" ", "-")
    slug = slug.replace("/", "-")

    persona = CareerPersona(
        profile_id=profile_id,
        persona_name=persona_data.get("persona_name", "Unknown"),
        persona_slug=slug,
        match_confidence=persona_data.get("match_confidence", 0.0),
        ai_summary=persona_data.get("ai_summary", ""),
        experience_level_label=persona_data.get("experience_level_label", ""),
        generated_at=datetime.now(timezone.utc),
    )
    persona.set_highlighted_skills(persona_data.get("highlighted_skills", []))
    persona.set_strengths(persona_data.get("strengths", []))
    persona.set_missing_skills(persona_data.get("missing_skills", []))
    persona.set_suggested_focus(persona_data.get("suggested_focus", []))
    persona.set_target_role_types(persona_data.get("target_role_types", []))

    db.add(persona)
    db.commit()
    db.refresh(persona)
    logger.info("Created persona: %s (confidence: %.0f%%)", persona.persona_name, persona.match_confidence * 100)
    return persona


def get_personas(db: Session, profile_id: int) -> list[CareerPersona]:
    return (
        db.query(CareerPersona)
        .filter(CareerPersona.profile_id == profile_id)
        .order_by(CareerPersona.match_confidence.desc())
        .all()
    )


def get_persona(db: Session, persona_id: int) -> CareerPersona | None:
    return db.query(CareerPersona).filter(CareerPersona.id == persona_id).first()


def delete_persona(db: Session, persona_id: int) -> bool:
    persona = get_persona(db, persona_id)
    if not persona:
        return False
    db.delete(persona)
    db.commit()
    return True


def delete_all_personas(db: Session, profile_id: int):
    db.query(CareerPersona).filter(CareerPersona.profile_id == profile_id).delete()
    db.commit()


def persona_to_dict(persona: CareerPersona) -> dict:
    return {
        "id": persona.id,
        "profile_id": persona.profile_id,
        "persona_name": persona.persona_name,
        "persona_slug": persona.persona_slug,
        "match_confidence": persona.match_confidence,
        "ai_summary": persona.ai_summary,
        "highlighted_skills": persona.get_highlighted_skills(),
        "strengths": persona.get_strengths(),
        "missing_skills": persona.get_missing_skills(),
        "suggested_focus": persona.get_suggested_focus(),
        "experience_level_label": persona.experience_level_label,
        "target_role_types": persona.get_target_role_types(),
        "generated_at": persona.generated_at,
    }
