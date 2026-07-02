import re
from services.workflow import StepResult, StepSpec, Workflow


async def extract_search_params(ctx, db, **kw):
    user_msg = kw["user_msg"].lower()

    company = None
    patterns = [
        r'(?:at|for|at\s+\w+|company)\s+([A-Z][a-zA-Z\s&]+)',
        r'\b(google|meta|amazon|apple|microsoft|netflix|stripe|airbnb|uber|spotify|openai|anthropic)\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, kw["user_msg"], re.IGNORECASE)
        if match:
            company = match.group(1) if match.lastindex else match.group(0)
            company = company.strip()
            break

    keywords = []
    job_terms = ["engineer", "developer", "designer", "manager", "analyst", "scientist",
                  "react", "python", "java", "frontend", "backend", "fullstack", "full stack",
                  "senior", "junior", "staff", "principal", "lead", "intern"]
    for term in job_terms:
        if term in user_msg:
            keywords.append(term)

    return StepResult(success=True, data={"company": company, "keywords": keywords})


async def run_search(ctx, db, **kw):
    from services.careerops import run_careerops_scan

    params = ctx["extract_search_params"]
    company = params.get("company")

    result = await run_careerops_scan(company=company)

    if result.get("status") == "error":
        return StepResult(success=False, error=result.get("message", "Job search unavailable"))

    return StepResult(success=True, data=result)


async def respond(ctx, db, **kw):
    params = ctx["extract_search_params"]
    search_result = ctx["run_search"]

    company = params.get("company") or "job boards"
    output = search_result.get("output", "")
    status = search_result.get("status", "unknown")

    if status == "scan_complete" and output:
        lines = output.strip().split("\n")
        job_lines = [l for l in lines if l.strip() and ("|" in l or "title" in l.lower() or "role" in l.lower() or "company" in l.lower())]
        if job_lines:
            text = f"Job search results for {company}:\n\n"
            for line in job_lines[:20]:
                text += f"- {line.strip()}\n"
        else:
            text = f"Scan completed for {company}. Found results in the CareerOps workspace.\n\nOutput:\n{output[:800]}"
    elif status == "error":
        text = f"Job search for {company} encountered an issue: {search_result.get('message', 'Unknown error')}\n\nTip: Make sure Node.js is installed and the career-ops-src directory exists."
    elif status == "timeout":
        text = f"Job search for {company} timed out. Try searching for a specific company."
    else:
        text = f"Job search for {company} completed. Check the CareerOps workspace for detailed results."

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
