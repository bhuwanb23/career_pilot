from services.workflow import StepResult, StepSpec, Workflow


async def prepare_data(ctx, db, **kw):
    from routers.chat import extract_job_description
    profile = ctx["profile"]
    if not profile:
        return StepResult(success=False, error="No career profile found. Upload a resume first.")
    from services.profile_service import profile_to_dict
    profile_dict = profile_to_dict(profile)
    jd = extract_job_description(kw["user_msg"])
    return StepResult(success=True, data={"profile": profile_dict, "jd": jd})


async def format_output(ctx, db, **kw):
    fdata = ctx["resume"]
    resume_data = fdata.get("resume_data", {})
    sections = [k for k in ["summary", "experience", "education", "skills", "projects"] if resume_data.get(k)]
    text = f"Your resume has been generated!\n\n**Sections:** {', '.join(sections)}"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "resume_generated", "data": fdata})
    from services.pipeline import advance_pipeline
    from models import Application, PipelineStage
    last_app = db.query(Application).order_by(Application.created_at.desc()).first()
    if last_app:
        advance_pipeline(db, last_app.id, PipelineStage.RESUME_TAILORED)
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_resume", steps=[
        StepSpec(name="profile", step_type="tool", tool_name="profile_get"),
        StepSpec(name="data", step_type="prepare", fn=prepare_data, params={"user_msg": user_msg}),
        StepSpec(name="resume", step_type="tool", tool_name="resume_generate",
                 param_refs={"profile_data": "data"}, params={"job_description": ""}),
        StepSpec(name="respond", step_type="respond", fn=format_output, params={"websocket": websocket}),
    ])
