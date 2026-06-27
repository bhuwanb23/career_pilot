import json

from services.llm_client import generate

SYSTEM_PROMPT = """You are CareerPilot, a professional cover letter writer.
Write a compelling, tailored cover letter for the given role and company.
The cover letter should:
- Be 3-4 paragraphs
- Open with enthusiasm for the specific role
- Highlight 2-3 relevant skills/experiences from the profile
- Show knowledge of the company
- Close with a call to action
- Be professional but personable
Return ONLY the cover letter text, no JSON, no markdown fences."""


async def generate_cover_letter(
    profile_data: dict,
    company: str,
    role: str,
    job_description: str = "",
    tone: str = "professional",
) -> str:
    prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}"""

    if job_description:
        prompt += f"\nJob Description:\n{job_description[:4000]}"

    prompt += f"""

Tone: {tone}
Write a tailored cover letter for this position."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return response.strip()
