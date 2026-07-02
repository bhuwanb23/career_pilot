import re
from pathlib import Path
from services.workflow import StepResult, StepSpec, Workflow


async def extract_search_params(ctx, db, **kw):
    user_msg = kw["user_msg"]

    company = None
    patterns = [
        r'\b(google|meta|amazon|apple|microsoft|netflix|stripe|airbnb|uber|spotify|openai|anthropic|vercel|cursor)\b',
        r'(?:at|for)\s+([A-Z][a-zA-Z\s&]{1,30})',
    ]
    for pattern in patterns:
        match = re.search(pattern, user_msg, re.IGNORECASE)
        if match:
            company = match.group(1) if match.lastindex else match.group(0)
            company = company.strip()
            break

    keywords = []
    user_lower = user_msg.lower()
    job_terms = ["engineer", "developer", "designer", "manager", "analyst", "scientist",
                  "react", "python", "java", "frontend", "backend", "fullstack", "full stack",
                  "senior", "junior", "staff", "principal", "lead", "intern"]
    for term in job_terms:
        if term in user_lower:
            keywords.append(term)

    return StepResult(success=True, data={"company": company, "keywords": keywords})


async def run_search(ctx, db, **kw):
    from config import BASE_DIR
    career_ops_src = BASE_DIR / "career-ops-src"

    if not career_ops_src.exists():
        params = ctx["extract_search_params"]
        company = params.get("company") or "job boards"
        text = (
            f"Job search for {company} is available but the CareerOps scanner needs setup.\n\n"
            f"To enable job scanning:\n"
            f"1. Install Node.js (if not already installed)\n"
            f"2. Ensure the `career-ops-src` directory exists in the project\n"
            f"3. Run: `cd career-ops-src && npm install`\n\n"
            f"In the meantime, you can:\n"
            f"- Browse job boards directly: LinkedIn, Indeed, Glassdoor\n"
            f"- Use the Job Analysis page to analyze specific job descriptions\n"
            f"- Paste a job description and I'll analyze it against your profile"
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
            lines = output.strip().split("\n")
            job_lines = [l for l in lines if l.strip() and len(l.strip()) > 5][:20]
            text = f"Job search results for {company}:\n\n"
            for line in job_lines:
                text += f"- {line.strip()}\n"
        else:
            text = f"Scan completed for {company}. Check the CareerOps workspace for results."
    elif status == "error":
        text = f"Job search encountered an issue: {search_result.get('message', 'Unavailable')}.\n\nTip: You can paste a job description and I'll analyze it."
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
