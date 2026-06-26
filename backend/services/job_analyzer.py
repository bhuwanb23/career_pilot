import json

from services.llm_client import generate

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


async def analyze_job(job_description: str, profile_data: dict) -> dict:
    prompt = f"""Career Profile:
{json.dumps(profile_data, indent=2)}

Job Description:
{job_description[:8000]}

Analyze this job posting against the profile."""

    response = await generate(prompt, system=SYSTEM_PROMPT)

    response = response.strip()
    if response.startswith("```"):
        response = response.split("\n", 1)[1]
    if response.endswith("```"):
        response = response.rsplit("```", 1)[0]
    response = response.strip()

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {
            "company": "Unknown",
            "role": "Unknown",
            "match_score": 0.0,
            "match_analysis": response,
            "cover_letter": "",
            "recruiter_msg": "",
        }
