from services.workflow import StepResult, StepSpec, Workflow


async def format_profile(ctx, db, **kw):
    profile = ctx["profile"]
    if not profile:
        return StepResult(success=False, error="No career profile found yet. Upload your resume!")
    skills = profile.get_skills() if hasattr(profile, 'get_skills') else []
    text = f"Your career profile:\n\n**Summary:** {profile.get('summary', profile.summary if hasattr(profile, 'summary') else '')[:200]}\n\n**Skills:** {', '.join(skills[:10])}"
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
