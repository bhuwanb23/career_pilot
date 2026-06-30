from services.workflow import StepResult, StepSpec, Workflow


async def format_apps(ctx, db, **kw):
    data = ctx["apps"]
    if "error" in data:
        text = "You don't have any applications yet. Paste a job description and I'll analyze it!"
    else:
        apps = data.get("applications", [])
        by_status = data.get("by_status", {})
        text = f"You have {data.get('total', 0)} application(s):\n"
        for status, count in by_status.items():
            text += f"- {status.title()}: {count}\n"
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_applications", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="show_applications", steps=[
        StepSpec(name="apps", step_type="tool", tool_name="applications_list"),
        StepSpec(name="respond", step_type="respond", fn=format_apps, params={"websocket": websocket}),
    ])
