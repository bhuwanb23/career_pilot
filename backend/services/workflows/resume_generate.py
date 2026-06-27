from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="No career profile found. Upload a resume first.")
    return StepResult(success=True, data=profile)


async def prepare_data(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from routers.chat import extract_job_description
    profile_dict = profile_to_dict(ctx["check_profile"])
    jd = extract_job_description(kw["user_msg"])
    return StepResult(success=True, data={"profile": profile_dict, "jd": jd})


async def llm_generate(ctx, db, **kw):
    from services.resume_generator import generate_resume
    data = ctx["prepare_data"]
    result = await generate_resume(data["profile"], data["jd"])
    return StepResult(success=True, data=result)


async def format_pdf(ctx, db, **kw):
    from services.resume_generator import resume_to_pdf
    import base64
    resume_data = ctx["llm_generate"]
    pdf_bytes = resume_to_pdf(resume_data)
    pdf_b64 = base64.b64encode(bytes(pdf_bytes)).decode()
    return StepResult(success=True, data={"pdf_base64": pdf_b64, "resume_data": resume_data})


async def respond(ctx, db, **kw):
    fdata = ctx["format_pdf"]
    resume_data = fdata["resume_data"]
    sections = [k for k in ["summary", "experience", "education", "skills", "projects"] if resume_data.get(k)]
    text = f"Your resume has been generated!\n\n**Sections:** {', '.join(sections)}"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "resume_generated", "data": fdata})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_resume", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="prepare_data", step_type="prepare", fn=prepare_data, params={"user_msg": user_msg, "websocket": websocket}),
        StepSpec(name="llm_generate", step_type="llm_call", fn=llm_generate),
        StepSpec(name="format_pdf", step_type="prepare", fn=format_pdf),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
