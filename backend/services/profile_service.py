from sqlalchemy.orm import Session

from models import CareerProfile


def get_profile(db: Session) -> CareerProfile | None:
    return db.query(CareerProfile).first()


def create_or_update_profile(db: Session, data: dict) -> CareerProfile:
    profile = db.query(CareerProfile).first()
    if not profile:
        profile = CareerProfile()
        db.add(profile)

    if "raw_resume" in data:
        profile.raw_resume = data["raw_resume"]

    personal = data.get("personal", {})
    if personal:
        if "name" in personal:
            profile.personal_name = personal["name"]
        if "email" in personal:
            profile.personal_email = personal["email"]
        if "phone" in personal:
            profile.personal_phone = personal["phone"]
        if "location" in personal:
            profile.personal_location = personal["location"]
        if "linkedin" in personal:
            profile.personal_linkedin = personal["linkedin"]
        if "github" in personal:
            profile.personal_github = personal["github"]

    if "summary" in data:
        profile.summary = data["summary"]
    if "skills" in data:
        from services.profile_utils import coerce_string_list
        profile.set_skills(coerce_string_list(data["skills"]))
    if "projects" in data:
        profile.set_projects(data["projects"])
    if "education" in data:
        profile.set_education(data["education"])
    if "experience" in data:
        profile.set_experience(data["experience"])
    if "certifications" in data:
        profile.set_certifications(data["certifications"])
    if "languages" in data:
        profile.set_languages(data["languages"])
    if "ai_summary" in data:
        profile.ai_summary = data["ai_summary"]
    if "experience_level" in data:
        profile.experience_level = data["experience_level"]
    if "tech_stack" in data:
        profile.set_tech_stack(data["tech_stack"])
    if "interests" in data:
        from services.profile_utils import coerce_string_list
        profile.set_interests(coerce_string_list(data["interests"]))
    if "strengths" in data:
        from services.profile_utils import coerce_string_list
        profile.set_strengths(coerce_string_list(data["strengths"]))
    if "weaknesses" in data:
        from services.profile_utils import coerce_string_list
        profile.set_weaknesses(coerce_string_list(data["weaknesses"]))
    if "profile_generated_at" in data:
        profile.profile_generated_at = data["profile_generated_at"]

    db.commit()
    db.refresh(profile)
    return profile


def profile_to_dict(profile: CareerProfile) -> dict:
    return {
        "personal": {
            "name": profile.personal_name,
            "email": profile.personal_email,
            "phone": profile.personal_phone,
            "location": profile.personal_location,
            "linkedin": profile.personal_linkedin,
            "github": profile.personal_github,
        },
        "summary": profile.summary,
        "skills": profile.get_skills(),
        "projects": profile.get_projects(),
        "education": profile.get_education(),
        "experience": profile.get_experience(),
        "certifications": profile.get_certifications(),
        "languages": profile.get_languages(),
        "ai_summary": profile.ai_summary,
        "experience_level": profile.experience_level,
        "tech_stack": profile.get_tech_stack(),
        "interests": profile.get_interests(),
        "strengths": profile.get_strengths(),
        "weaknesses": profile.get_weaknesses(),
        "profile_generated_at": str(profile.profile_generated_at) if profile.profile_generated_at else None,
    }
