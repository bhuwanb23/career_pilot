import json
from datetime import datetime
from pydantic import BaseModel, field_validator


# ── Profile ──────────────────────────────────────────────
class ProfileBase(BaseModel):
    summary: str = ""
    skills: list[str] = []
    projects: list[dict] = []
    education: list[dict] = []
    experience: list[dict] = []

    @field_validator("skills", "projects", "education", "experience", mode="before")
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


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    action_type: str | None
    action_data: str | None
    created_at: datetime

    class Config:
        from_attributes = True
