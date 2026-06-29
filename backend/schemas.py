import json
from datetime import datetime
from pydantic import BaseModel, field_validator


# ── Profile ──────────────────────────────────────────────
class ProfileBase(BaseModel):
    personal_name: str = ""
    personal_email: str = ""
    personal_phone: str = ""
    personal_location: str = ""
    personal_linkedin: str = ""
    personal_github: str = ""
    summary: str = ""
    skills: list[str] = []
    projects: list[dict] = []
    education: list[dict] = []
    experience: list[dict] = []
    certifications: list[dict] = []
    languages: list[dict] = []
    ai_summary: str = ""
    experience_level: str = ""
    tech_stack: list[dict] = []
    interests: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []

    @field_validator("skills", "projects", "education", "experience", "certifications", "languages", "tech_stack", "interests", "strengths", "weaknesses", mode="before")
    @classmethod
    def parse_json_field(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v


class ProfileResponse(ProfileBase):
    id: int
    raw_resume: str
    profile_generated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    summary: str | None = None
    skills: list[str] | None = None
    projects: list[dict] | None = None
    education: list[dict] | None = None
    experience: list[dict] | None = None


# ── Applications ─────────────────────────────────────────
class JobAnalyzeRequest(BaseModel):
    job_description: str
    url: str = ""


class ApplicationResponse(BaseModel):
    id: int
    company: str
    role: str
    job_description: str
    status: str
    cover_letter: str
    recruiter_msg: str
    match_score: float
    match_analysis: str
    notes: str
    url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


# ── Interview ────────────────────────────────────────────
class InterviewPrepResponse(BaseModel):
    id: int
    application_id: int
    company_summary: str
    questions: list[dict]
    star_answers: list[dict]
    notes: str
    created_at: datetime

    @field_validator("questions", "star_answers", mode="before")
    @classmethod
    def parse_json_field(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v

    class Config:
        from_attributes = True


class InterviewNotesUpdate(BaseModel):
    notes: str


# ── Chat ─────────────────────────────────────────────────
class ChatMessageRequest(BaseModel):
    content: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    intent: str
    response: str
    action_type: str | None = None
    action_data: dict | None = None


class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    action_type: str | None
    action_data: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Cover Letter ─────────────────────────────────────────
class CoverLetterRequest(BaseModel):
    application_id: int
    tone: str = "professional"


# ── Interview Kit ────────────────────────────────────────
class InterviewKitRequest(BaseModel):
    application_id: int


# ── Personas ─────────────────────────────────────────────
class PersonaItem(BaseModel):
    id: int
    profile_id: int
    persona_name: str
    persona_slug: str
    match_confidence: float
    ai_summary: str
    highlighted_skills: list[str]
    strengths: list[str]
    missing_skills: list[str]
    suggested_focus: list[str]
    experience_level_label: str
    target_role_types: list[str]
    generated_at: datetime | None = None

    @field_validator("highlighted_skills", "strengths", "missing_skills", "suggested_focus", "target_role_types", mode="before")
    @classmethod
    def parse_json_field(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v

    class Config:
        from_attributes = True


class PersonaGenerateRequest(BaseModel):
    persona_names: list[str] = [
        "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
        "AI/ML Engineer", "Data Engineer",
    ]


class PersonaGenerateResponse(BaseModel):
    personas: list[PersonaItem]
    count: int
