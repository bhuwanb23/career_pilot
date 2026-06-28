import logging

from sqlalchemy.orm import Session

from models import Application, ApplicationPipeline, PipelineStage

logger = logging.getLogger(__name__)

STAGE_ORDER = [
    PipelineStage.RESUME_UPLOADED,
    PipelineStage.JD_PARSED,
    PipelineStage.RESUME_TAILORED,
    PipelineStage.APPLICATION_SAVED,
    PipelineStage.COVER_LETTER_READY,
    PipelineStage.RECRUITER_MSG_READY,
    PipelineStage.INTERVIEW_READY,
]


def get_or_create_pipeline(db: Session, application_id: int) -> ApplicationPipeline:
    pipeline = db.query(ApplicationPipeline).filter_by(application_id=application_id).first()
    if not pipeline:
        pipeline = ApplicationPipeline(application_id=application_id)
        db.add(pipeline)
        db.commit()
        db.refresh(pipeline)
    return pipeline


def advance_pipeline(db: Session, application_id: int, stage: PipelineStage) -> ApplicationPipeline:
    pipeline = get_or_create_pipeline(db, application_id)
    pipeline.advance_to(stage)
    db.commit()
    logger.info("Pipeline advanced: app=%d -> %s", application_id, stage.value)
    return pipeline


def get_pipeline_status(db: Session, application_id: int) -> dict:
    pipeline = get_or_create_pipeline(db, application_id)
    completed = pipeline.get_completed()
    total = len(STAGE_ORDER)
    return {
        "application_id": application_id,
        "current_stage": pipeline.current_stage,
        "completed_stages": completed,
        "completed_count": len(completed),
        "total_stages": total,
        "progress_pct": round(len(completed) / total * 100, 1) if total > 0 else 0,
        "next_stage": _get_next_stage(pipeline),
    }


def get_user_progress(db: Session) -> dict:
    pipelines = db.query(ApplicationPipeline).all()
    if not pipelines:
        return {"stages_completed": 0, "total_stages": len(STAGE_ORDER), "applications": []}

    apps = []
    for p in pipelines:
        app = db.query(Application).get(p.application_id)
        if app:
            completed = p.get_completed()
            apps.append({
                "application_id": app.id,
                "company": app.company,
                "role": app.role,
                "current_stage": p.current_stage,
                "completed_stages": completed,
                "progress_pct": round(len(completed) / len(STAGE_ORDER) * 100, 1),
            })
    return {"applications": apps, "total_stages": len(STAGE_ORDER)}


def get_pipeline_context(db: Session) -> str:
    pipelines = db.query(ApplicationPipeline).all()
    if not pipelines:
        return ""
    lines = ["[Application Pipeline Status]"]
    for p in pipelines:
        app = db.query(Application).get(p.application_id)
        if app:
            completed = p.get_completed()
            pct = round(len(completed) / len(STAGE_ORDER) * 100, 1)
            lines.append(f"- {app.company} - {app.role}: {p.current_stage} ({pct}% complete)")
    return "\n".join(lines)


def _get_next_stage(pipeline: ApplicationPipeline) -> str | None:
    current = None
    try:
        current = PipelineStage(pipeline.current_stage)
    except ValueError:
        pass
    if current is None:
        return STAGE_ORDER[0].value if STAGE_ORDER else None
    try:
        idx = STAGE_ORDER.index(current)
        if idx + 1 < len(STAGE_ORDER):
            return STAGE_ORDER[idx + 1].value
    except ValueError:
        pass
    return None
