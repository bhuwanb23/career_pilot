import json

from services.llm_client import generate
from services.llm_utils import parse_llm_json

SYSTEM_PROMPT = """You are CareerPilot, an AI career interview coach.
Generate interview preparation material for the given role and company.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "company_summary": "Brief overview of the company, its culture, products, and recent news...",
  "questions": [
    {"question": "Interview question", "answer": "Suggested answer"}
  ],
  "star_answers": [
    {
      "situation": "Brief context",
      "task": "What was your responsibility",
      "action": "What you did",
      "result": "Outcome with metrics if possible"
    }
  ]
}
Generate 8-10 questions covering behavioral, technical, and role-specific areas.
Generate 3-4 STAR answers based on the candidate's experience."""

FALLBACK = {
    "company_summary": "",
    "questions": [],
    "star_answers": [],
}


async def generate_prep(
    company: str,
    role: str,
    job_description: str,
    profile_data: dict,
) -> dict:
    prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}
Job Description:
{job_description[:6000]}

Generate comprehensive interview preparation material."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return parse_llm_json(response, FALLBACK)
