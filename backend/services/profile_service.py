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

    db.commit()
    db.refresh(profile)
    return profile


def profile_to_dict(profile: CareerProfile) -> dict:
    return {
        "summary": profile.summary,
        "skills": profile.get_skills(),
        "projects": profile.get_projects(),
        "education": profile.get_education(),
        "experience": profile.get_experience(),
    }
