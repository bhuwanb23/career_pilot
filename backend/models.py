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


class CareerProfile(Base):
    __tablename__ = "career_profile"

    id = Column(Integer, primary_key=True, index=True)
    raw_resume = Column(Text, default="")
    summary = Column(Text, default="")
    skills = Column(Text, default="[]")
    projects = Column(Text, default="[]")
    education = Column(Text, default="[]")
    experience = Column(Text, default="[]")
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


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    status = Column(String(20), default="applied")
    cover_letter = Column(Text, default="")
    recruiter_msg = Column(Text, default="")
    match_score = Column(Float, default=0.0)
    match_analysis = Column(Text, default="")
    notes = Column(Text, default="")
    url = Column(String(500), default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    interview_prep = relationship("InterviewPrep", back_populates="application", uselist=False)


class InterviewPrep(Base):
    __tablename__ = "interview_prep"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    company_summary = Column(Text, default="")
    questions = Column(Text, default="[]")
    star_answers = Column(Text, default="[]")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    application = relationship("Application", back_populates="interview_prep")

    def get_questions(self):
        return json.loads(self.questions)

    def set_questions(self, value: list):
        self.questions = json.dumps(value)

    def get_star_answers(self):
        return json.loads(self.star_answers)

    def set_star_answers(self, value: list):
        self.star_answers = json.dumps(value)


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
