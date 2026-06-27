from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first so I can write a tailored cover letter.")
    return StepResult(success=True, data=profile)


async def check_app(ctx, db, **kw):
    from routers.chat import _get_latest_app
    app = _get_latest_app(db)
    if not app:
        return StepResult(success=False, error="No applications yet. Analyze a job first.")
    return StepResult(success=True, data=app)


async def llm_generate(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from services.cover_letter import generate_cover_letter
    profile_dict = profile_to_dict(ctx["check_profile"])
    app = ctx["check_app"]
    letter = await generate_cover_letter(profile_dict, app.company, app.role, app.job_description)
    return StepResult(success=True, data=letter)


async def save(ctx, db, **kw):
    app = ctx["check_app"]
    app.cover_letter = ctx["llm_generate"]
    db.commit()
    return StepResult(success=True)


async def respond(ctx, db, **kw):
    app = ctx["check_app"]
    letter = ctx["llm_generate"]
    text = f"Cover letter for **{app.company} - {app.role}**:\n\n{letter}"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "cover_letter_generated", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_cover_letter", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="check_app", step_type="check", fn=check_app),
        StepSpec(name="llm_generate", step_type="llm_call", fn=llm_generate),
        StepSpec(name="save", step_type="db_write", fn=save),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
