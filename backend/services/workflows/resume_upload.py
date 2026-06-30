from services.workflow import StepResult, StepSpec, Workflow


async def respond(ctx, db, **kw):
    text = "Please upload your resume PDF using the upload button in the sidebar, or drag and drop a PDF file."
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_upload", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="upload_resume", steps=[
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
