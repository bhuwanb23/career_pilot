import logging
from pathlib import Path

from pydantic import BaseModel, field_validator

from services.llm_client import generate
from services.llm_utils import parse_llm_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are CareerPilot, an AI career assistant.
Extract ALL structured data from the resume text provided.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "personal": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State/Country",
    "linkedin": "linkedin profile URL or empty",
    "github": "github profile URL or empty"
  },
  "summary": "2-3 sentence career summary",
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {"name": "Project Name", "description": "What it does", "tech": ["tech1", "tech2"]}
  ],
  "education": [
    {"school": "University Name", "degree": "Degree Type", "field": "Field of Study", "year": "Graduation Year", "gpa": "GPA if listed"}
  ],
  "experience": [
    {"company": "Company Name", "role": "Job Title", "start_date": "MM/YYYY", "end_date": "MM/YYYY or Present", "bullets": ["Achievement 1", "Achievement 2"]}
  ],
  "certifications": [
    {"name": "Certification Name", "issuer": "Issuing Organization", "year": "Year obtained"}
  ],
  "languages": [
    {"language": "Language Name", "proficiency": "Native/Fluent/Intermediate/Basic"}
  ]
}
If a section is missing from the resume, return an empty list for that field.
If a personal info field is missing, return an empty string.
Be precise with dates and contact information."""


class ParsedPersonal(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""


class ParsedEducation(BaseModel):
    school: str = ""
    degree: str = ""
    field: str = ""
    year: str = ""
    gpa: str = ""


class ParsedExperience(BaseModel):
    company: str = ""
    role: str = ""
    start_date: str = ""
    end_date: str = ""
    dates: str = ""
    bullets: list[str] = []


class ParsedProject(BaseModel):
    name: str = ""
    description: str = ""
    tech: list[str] = []


class ParsedCertification(BaseModel):
    name: str = ""
    issuer: str = ""
    year: str = ""


class ParsedLanguage(BaseModel):
    language: str = ""
    proficiency: str = ""


class ParsedResume(BaseModel):
    personal: dict = {}
    summary: str = ""
    skills: list = []
    projects: list = []
    education: list = []
    experience: list = []
    certifications: list = []
    languages: list = []

    @field_validator("skills", mode="before")
    @classmethod
    def normalize_skills(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    @field_validator("projects", mode="before")
    @classmethod
    def normalize_projects(cls, v):
        if isinstance(v, list):
            return [p if isinstance(p, dict) else {"name": str(p), "description": "", "tech": []} for p in v]
        return []

    @field_validator("education", mode="before")
    @classmethod
    def normalize_education(cls, v):
        if isinstance(v, list):
            return [e if isinstance(e, dict) else {"school": str(e), "degree": "", "field": "", "year": "", "gpa": ""} for e in v]
        return []

    @field_validator("experience", mode="before")
    @classmethod
    def normalize_experience(cls, v):
        if isinstance(v, list):
            return [e if isinstance(e, dict) else {"company": "", "role": str(e), "start_date": "", "end_date": "", "bullets": []} for e in v]
        return []

    @field_validator("certifications", mode="before")
    @classmethod
    def normalize_certifications(cls, v):
        if isinstance(v, list):
            return [c if isinstance(c, dict) else {"name": str(c), "issuer": "", "year": ""} for c in v]
        return []

    @field_validator("languages", mode="before")
    @classmethod
    def normalize_languages(cls, v):
        if isinstance(v, list):
            return [l if isinstance(l, dict) else {"language": str(l), "proficiency": ""} for l in v]
        return []


FALLBACK = {
    "personal": {},
    "summary": "",
    "skills": [],
    "projects": [],
    "education": [],
    "experience": [],
    "certifications": [],
    "languages": [],
}


async def parse_resume(file_content: bytes, filename: str = "") -> dict:
    from services.document_extractor import extract_document

    extracted = await extract_document(file_content, filename)

    raw_text = extracted.get("text", "")
    if not raw_text:
        raise ValueError("No text could be extracted from the file.")

    response = await generate(raw_text, system=SYSTEM_PROMPT)
    raw_parsed = parse_llm_json(response, FALLBACK)

    try:
        validated = ParsedResume(**raw_parsed)
        parsed = validated.model_dump()
    except Exception:
        logger.warning("LLM output failed validation, using raw parsed data")
        parsed = raw_parsed

    return {"raw_resume": raw_text, **parsed}
