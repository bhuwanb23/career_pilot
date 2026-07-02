import json
from services.workflow import StepResult, StepSpec, Workflow


EXTRACT_PROMPT = """Extract job search parameters from this user message. Return ONLY valid JSON with:
- company: company name (string or null)
- keywords: job-related keywords (array of strings)

Rules:
- company should be a clean company name like "Google", "Meta", "Stripe"
- keywords should be job-relevant terms like ["engineer", "react", "senior"]
- Return null for fields not mentioned"""


async def extract_search_params(ctx, db, **kw):
    user_msg = kw["user_msg"]
    from services.llm_client import generate
    from services.llm_utils import parse_llm_json

    prompt = f'User message: "{user_msg}"\n\nExtract search parameters as JSON:'
    try:
        response = await generate(prompt, system=EXTRACT_PROMPT)
        params = parse_llm_json(response, {"company": None, "keywords": []})
    except Exception:
        params = {"company": None, "keywords": []}

    return StepResult(success=True, data=params)


async def run_search(ctx, db, **kw):
    from config import BASE_DIR
    career_ops_src = BASE_DIR / "career-ops-src"

    if not career_ops_src.exists():
        params = ctx["extract_search_params"]
        company = params.get("company") or "job boards"
        text = (
            f"Job search for {company} requires the CareerOps scanner setup.\n\n"
            f"To enable: run `npm install` in career-ops-src/ directory.\n\n"
            f"In the meantime, you can paste a job description and I'll analyze it against your profile."
        )
        return StepResult(success=True, data={"status": "setup_needed", "message": text, "company": company})

    from services.careerops import run_careerops_scan
    params = ctx["extract_search_params"]
    company = params.get("company")
    result = await run_careerops_scan(company=company)
    return StepResult(success=True, data=result)


async def respond(ctx, db, **kw):
    params = ctx["extract_search_params"]
    search_result = ctx["run_search"]
    company = params.get("company") or "job boards"
    status = search_result.get("status", "unknown")

    if status == "setup_needed":
        text = search_result.get("message", "Job search requires setup.")
    elif status == "scan_complete":
        output = search_result.get("output", "")
        if output:
            lines = [l.strip() for l in output.strip().split("\n") if l.strip() and len(l.strip()) > 5][:20]
            text = f"Job search results for {company}:\n\n"
            for line in lines:
                text += f"- {line}\n"
        else:
            text = f"Scan completed for {company}. Check the CareerOps workspace for results."
    elif status == "error":
        msg = search_result.get("message") or "Unavailable"
        text = f"Job search encountered an issue: {msg}.\n\nTip: You can paste a job description and I'll analyze it."
    elif status == "timeout":
        text = f"Job search for {company} timed out. Try a more specific query."
    else:
        text = f"Job search for {company} completed. Check the CareerOps workspace for details."

    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="job_search", steps=[
        StepSpec(name="extract_search_params", step_type="parse", fn=extract_search_params, params={"user_msg": user_msg}),
        StepSpec(name="run_search", step_type="tool", fn=run_search),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
