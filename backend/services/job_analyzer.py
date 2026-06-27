import json

from services.llm_client import generate
from services.llm_utils import parse_llm_json

SYSTEM_PROMPT = """You are CareerPilot, an AI career assistant.
Analyze the job description against the user's career profile.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "company": "company name",
  "role": "job title",
  "match_score": 0.85,
  "match_analysis": "Detailed analysis of how well the profile matches...",
  "cover_letter": "A professional cover letter tailored to this role...",
  "recruiter_msg": "A short LinkedIn/email message to a recruiter (under 150 words)"
}
Be specific about matching skills and gaps."""

FALLBACK = {
    "company": "Unknown",
    "role": "Unknown",
    "match_score": 0.0,
    "match_analysis": "",
    "cover_letter": "",
    "recruiter_msg": "",
}


async def analyze_job(job_description: str, profile_data: dict) -> dict:
    prompt = f"""Career Profile:
{json.dumps(profile_data, indent=2)}

Job Description:
{job_description[:8000]}

Analyze this job posting against the profile."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return parse_llm_json(response, FALLBACK)
