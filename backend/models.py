import enum
import json
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class PipelineStage(str, enum.Enum):
    RESUME_UPLOADED = "resume_uploaded"
    JD_PARSED = "jd_parsed"
    RESUME_TAILORED = "resume_tailored"
    APPLICATION_SAVED = "application_saved"
    COVER_LETTER_READY = "cover_letter_ready"
    RECRUITER_MSG_READY = "recruiter_msg_ready"
    INTERVIEW_READY = "interview_ready"


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    APPLIED = "applied"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ApplicationPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class ActivityKind(str, enum.Enum):
    STATUS_CHANGE = "status_change"
    NOTE = "note"
    REMINDER = "reminder"
    OUTREACH_SENT = "outreach_sent"


class CareerProfile(Base):
    __tablename__ = "career_profile"

    id = Column(Integer, primary_key=True, index=True)
    raw_resume = Column(Text, default="")
    personal_name = Column(String(255), default="")
    personal_email = Column(String(255), default="")
    personal_phone = Column(String(50), default="")
    personal_location = Column(String(255), default="")
    personal_linkedin = Column(String(500), default="")
    personal_github = Column(String(500), default="")
    summary = Column(Text, default="")
    skills = Column(Text, default="[]")
    projects = Column(Text, default="[]")
    education = Column(Text, default="[]")
    experience = Column(Text, default="[]")
    certifications = Column(Text, default="[]")
    languages = Column(Text, default="[]")
    ai_summary = Column(Text, default="")
    experience_level = Column(String(50), default="")
    tech_stack = Column(Text, default="[]")
    interests = Column(Text, default="[]")
    strengths = Column(Text, default="[]")
    weaknesses = Column(Text, default="[]")
    profile_generated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    def get_skills(self):
        return json.loads(self.skills)

    def set_skills(self, value: list):
        self.skills = json.dumps(value)

    def get_projects(self):
        return json.loads(self.projects)

    def set_projects(self, value: list):
        self.projects = json.dumps(value)

    def get_education(self):
        return json.loads(self.education)

    def set_education(self, value: list):
        self.education = json.dumps(value)

    def get_experience(self):
        return json.loads(self.experience)

    def set_experience(self, value: list):
        self.experience = json.dumps(value)

    def get_certifications(self):
        return json.loads(self.certifications)

    def set_certifications(self, value: list):
        self.certifications = json.dumps(value)

    def get_languages(self):
        return json.loads(self.languages)

    def set_languages(self, value: list):
        self.languages = json.dumps(value)

    def get_tech_stack(self):
        return json.loads(self.tech_stack)

    def set_tech_stack(self, value: list):
        self.tech_stack = json.dumps(value)

    def get_interests(self):
        return json.loads(self.interests)

    def set_interests(self, value: list):
        self.interests = json.dumps(value)

    def get_strengths(self):
        return json.loads(self.strengths)

    def set_strengths(self, value: list):
        self.strengths = json.dumps(value)

    def get_weaknesses(self):
        return json.loads(self.weaknesses)

    def set_weaknesses(self, value: list):
        self.weaknesses = json.dumps(value)


class CareerPersona(Base):
    __tablename__ = "career_persona"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("career_profile.id"), nullable=False, index=True)
    persona_name = Column(String(100), nullable=False)
    persona_slug = Column(String(100), nullable=False)
    match_confidence = Column(Float, default=0.0)
    ai_summary = Column(Text, default="")
    highlighted_skills = Column(Text, default="[]")
    strengths = Column(Text, default="[]")
    missing_skills = Column(Text, default="[]")
    suggested_focus = Column(Text, default="[]")
    experience_level_label = Column(String(50), default="")
    target_role_types = Column(Text, default="[]")
    generated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    profile = relationship("CareerProfile", backref="personas")

    def get_highlighted_skills(self):
        return json.loads(self.highlighted_skills)

    def set_highlighted_skills(self, value: list):
        self.highlighted_skills = json.dumps(value)

    def get_strengths(self):
        return json.loads(self.strengths)

    def set_strengths(self, value: list):
        self.strengths = json.dumps(value)

    def get_missing_skills(self):
        return json.loads(self.missing_skills)

    def set_missing_skills(self, value: list):
        self.missing_skills = json.dumps(value)

    def get_suggested_focus(self):
        return json.loads(self.suggested_focus)

    def set_suggested_focus(self, value: list):
        self.suggested_focus = json.dumps(value)

    def get_target_role_types(self):
        return json.loads(self.target_role_types)

    def set_target_role_types(self, value: list):
        self.target_role_types = json.dumps(value)


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    status = Column(String(20), default=ApplicationStatus.DRAFT.value)
    cover_letter = Column(Text, default="")
    recruiter_msg = Column(Text, default="")
    match_score = Column(Float, default=0.0)
    match_analysis = Column(Text, default="")
    notes = Column(Text, default="")
    url = Column(String(500), default="")
    score_fit = Column(Float, default=0.0)
    score_timing = Column(Float, default=0.0)
    score_competition = Column(Float, default=0.0)
    score_readiness = Column(Float, default=0.0)
    score_overall = Column(Float, default=0.0)
    jd_parsed = Column(Text, default="{}")
    match_report = Column(Text, default="{}")
    recommendations = Column(Text, default="[]")
    priority = Column(String(10), default=ApplicationPriority.NORMAL.value)
    deadline = Column(DateTime, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    interview_at = Column(DateTime, nullable=True)
    board_order = Column(Integer, default=0)
    outreach_sequence = Column(Text, default="{}")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    interview_prep = relationship("InterviewPrep", back_populates="application", uselist=False)
    activities = relationship("ApplicationActivity", back_populates="application")

    def get_jd_parsed(self) -> dict:
        return json.loads(self.jd_parsed or "{}")

    def set_jd_parsed(self, value: dict):
        self.jd_parsed = json.dumps(value)

    def get_match_report(self) -> dict:
        return json.loads(self.match_report or "{}")

    def set_match_report(self, value: dict):
        self.match_report = json.dumps(value)

    def get_recommendations(self) -> list:
        return json.loads(self.recommendations or "[]")

    def set_recommendations(self, value: list):
        self.recommendations = json.dumps(value)

    def get_outreach_sequence(self) -> dict:
        return json.loads(self.outreach_sequence or "{}")

    def set_outreach_sequence(self, value: dict):
        self.outreach_sequence = json.dumps(value)


class ApplicationActivity(Base):
    __tablename__ = "application_activities"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    kind = Column(String(20), nullable=False)
    message = Column(Text, default="")
    meta = Column(Text, default="{}")
    created_at = Column(DateTime, default=utcnow)

    application = relationship("Application", back_populates="activities")

    def get_meta(self) -> dict:
        return json.loads(self.meta or "{}")

    def set_meta(self, value: dict):
        self.meta = json.dumps(value)


class InterviewPrep(Base):
    __tablename__ = "interview_prep"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    company_summary = Column(Text, default="")
    company_intel = Column(Text, default="{}")
    questions = Column(Text, default="[]")
    star_answers = Column(Text, default="[]")
    prep_notes = Column(Text, default="{}")
    ai_suggestions = Column(Text, default="[]")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    application = relationship("Application", back_populates="interview_prep")

    def get_questions(self):
        return json.loads(self.questions or "[]")

    def set_questions(self, value: list):
        self.questions = json.dumps(value)

    def get_star_answers(self):
        return json.loads(self.star_answers or "[]")

    def set_star_answers(self, value: list):
        self.star_answers = json.dumps(value)

    def get_company_intel(self) -> dict:
        return json.loads(self.company_intel or "{}")

    def set_company_intel(self, value: dict):
        self.company_intel = json.dumps(value)

    def get_prep_notes(self) -> dict:
        return json.loads(self.prep_notes or "{}")

    def set_prep_notes(self, value: dict):
        self.prep_notes = json.dumps(value)

    def get_ai_suggestions(self) -> list:
        return json.loads(self.ai_suggestions or "[]")

    def set_ai_suggestions(self, value: list):
        self.ai_suggestions = json.dumps(value)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), index=True, nullable=False)
    role = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    action_type = Column(String(50), nullable=True)
    action_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class ConversationMemory(Base):
    __tablename__ = "conversation_memory"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class ApplicationPipeline(Base):
    __tablename__ = "application_pipeline"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    current_stage = Column(String(50), default=PipelineStage.RESUME_UPLOADED.value)
    completed_stages = Column(Text, default="[]")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    application = relationship("Application", backref="pipeline_records")

    def get_completed(self) -> list:
        return json.loads(self.completed_stages)

    def set_completed(self, stages: list):
        self.completed_stages = json.dumps(stages)

    def advance_to(self, stage: PipelineStage):
        completed = self.get_completed()
        if self.current_stage and self.current_stage not in completed:
            completed.append(self.current_stage)
        self.current_stage = stage.value
        self.set_completed(completed)


class ResumeUpload(Base):
    __tablename__ = "resume_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(10), nullable=False)
    file_hash = Column(String(64), nullable=True)
    storage_path = Column(String(500), nullable=True)
    raw_text = Column(Text, default="")
    status = Column(String(20), default="uploaded")
    parse_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class CareerMemory(Base):
    __tablename__ = "career_memory"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    key = Column(String(200), nullable=False, index=True)
    value = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    confidence = Column(Float, default=1.0)
    source = Column(String(50), default="system")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    def get_metadata(self):
        return json.loads(self.metadata_json)

    def set_metadata(self, value: dict):
        self.metadata_json = json.dumps(value)
