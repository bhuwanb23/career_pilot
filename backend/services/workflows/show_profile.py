from services.workflow import StepResult, StepSpec, Workflow


async def format_profile(ctx, db, **kw):
    profile = ctx["profile"]
    if isinstance(profile, dict) and profile.get("error"):
        return StepResult(success=False, error=profile["error"])
    if not profile:
        return StepResult(success=False, error="No career profile found yet. Upload your resume!")
    if isinstance(profile, dict):
        skills = profile.get("skills", [])
        summary = (profile.get("summary") or "")[:200]
    else:
        skills = profile.get_skills()
        summary = (profile.summary or "")[:200]
    text = f"Your career profile:\n\n**Summary:** {summary}\n\n**Skills:** {', '.join(skills[:10])}"
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_profile", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="show_profile", steps=[
        StepSpec(name="profile", step_type="tool", tool_name="profile_get"),
        StepSpec(name="respond", step_type="respond", fn=format_profile, params={"websocket": websocket}),
    ])
