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

    @field_validator("skills", "interests", "strengths", "weaknesses", mode="before")
    @classmethod
    def normalize_string_lists(cls, v):
        from services.profile_utils import coerce_string_list

        if isinstance(v, str):
            try:
                v = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                pass
        return coerce_string_list(v)

    @field_validator("projects", "education", "experience", "certifications", "languages", "tech_stack", mode="before")
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
    score_fit: float = 0.0
    score_timing: float = 0.0
    score_competition: float = 0.0
    score_readiness: float = 0.0
    score_overall: float = 0.0
    jd_parsed: dict = {}
    match_report: dict = {}
    recommendations: list = []
    priority: str = "normal"
    deadline: datetime | None = None
    applied_at: datetime | None = None
    interview_at: datetime | None = None
    board_order: int = 0
    created_at: datetime
    updated_at: datetime

    @field_validator("jd_parsed", "match_report", mode="before")
    @classmethod
    def parse_json_object(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}

    @field_validator("recommendations", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v or []

    class Config:
        from_attributes = True


class RecruiterMessageRequest(BaseModel):
    channel: str = "linkedin"


class ApplicationScoreResponse(BaseModel):
    application_id: int
    fit: float
    timing: float
    competition: float
    readiness: float
    overall: float


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    priority: str | None = None
    deadline: datetime | None = None
    applied_at: datetime | None = None
    interview_at: datetime | None = None
    board_order: int | None = None


class ApplicationActivityCreate(BaseModel):
    kind: str = "note"
    message: str
    meta: dict = {}


class ApplicationActivityResponse(BaseModel):
    id: int
    application_id: int
    kind: str
    message: str
    meta: dict = {}
    created_at: datetime

    @field_validator("meta", mode="before")
    @classmethod
    def parse_meta(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}

    class Config:
        from_attributes = True


class TimelineEvent(BaseModel):
    id: int | None = None
    kind: str
    message: str
    created_at: str | None = None
    meta: dict = {}


class TimelineResponse(BaseModel):
    application_id: int
    events: list[TimelineEvent]


class AnalyticsSnapshot(BaseModel):
    total_applications: int
    active_applications: int
    interviews: int
    offers: int
    rejections: int
    avg_career_pilot_score: float
    status_breakdown: dict[str, int] = {}
    avg_match_score: float = 0.0
    score_distribution: dict[str, int] = {}
    top_companies: list[dict] = []
    top_roles: list[dict] = []
    best_match: dict | None = None
    worst_match: dict | None = None
    narrative: str | None = None


# ── Interview ────────────────────────────────────────────
class InterviewPrepResponse(BaseModel):
    id: int
    application_id: int
    company_summary: str
    company_intel: dict = {}
    questions: list[dict]
    star_answers: list[dict]
    prep_notes: dict = {}
    ai_suggestions: list = []
    notes: str
    created_at: datetime

    @field_validator("questions", "star_answers", "ai_suggestions", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v or []

    @field_validator("company_intel", "prep_notes", mode="before")
    @classmethod
    def parse_json_object(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}

    class Config:
        from_attributes = True


class InterviewNotesUpdate(BaseModel):
    notes: str


class InterviewDashboardItem(BaseModel):
    application_id: int
    company: str
    role: str
    status: str
    score_overall: float = 0.0
    interview_at: datetime | None = None
    has_prep: bool = False
    prep_created_at: datetime | None = None


class InterviewDashboardResponse(BaseModel):
    items: list[InterviewDashboardItem]
    total: int


# ── Outreach ─────────────────────────────────────────────
class OutreachStep(BaseModel):
    id: str
    type: str
    channel: str = "linkedin"
    status: str = "pending"
    message: str = ""
    due_at: datetime | None = None
    sent_at: datetime | None = None


class OutreachSequenceResponse(BaseModel):
    application_id: int
    company: str
    role: str
    status: str
    urgency: str = "waiting"
    next_due_at: datetime | None = None
    followup_count: int = 0
    steps: list[OutreachStep] = []


class OutreachSequenceUpdate(BaseModel):
    steps: list[OutreachStep]


class FollowUpGenerateRequest(BaseModel):
    step_type: str = "follow_up"
    channel: str = "linkedin"
    step_id: str | None = None


class MarkOutreachSentRequest(BaseModel):
    step_id: str


class OutreachDashboardItem(BaseModel):
    application_id: int
    company: str
    role: str
    status: str
    score_overall: float = 0.0
    urgency: str = "waiting"
    next_due_at: datetime | None = None
    followup_count: int = 0
    steps_completed: int = 0
    steps_total: int = 0
    applied_at: datetime | None = None


class OutreachDashboardResponse(BaseModel):
    items: list[OutreachDashboardItem]
    total: int


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


# ── CareerPilot Score ────────────────────────────────────
class CareerPilotScore(BaseModel):
    fit: float
    timing: float
    competition: float
    readiness: float
    overall: float


class JDParseRequest(BaseModel):
    job_description: str
    url: str = ""


class JDParseResponse(BaseModel):
    company: str
    role: str
    skills: list[str]
    requirements: list[str]
    nice_to_have: list[str]
    experience_level: str
    location: str
    is_remote: bool


class ResumeMatchRequest(BaseModel):
    job_description: str


class ResumeMatchResponse(BaseModel):
    match_percentage: float
    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendation: str
