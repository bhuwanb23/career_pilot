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
        profile.set_skills(data["skills"])
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
    }
