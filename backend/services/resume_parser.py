import json

import fitz  # PyMuPDF

from services.llm_client import generate

SYSTEM_PROMPT = """You are CareerPilot, an AI career assistant.
Extract structured data from the resume text provided.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "summary": "2-3 sentence career summary",
  "skills": ["skill1", "skill2"],
  "projects": [{"name": "...", "description": "...", "tech": ["..."]}],
  "education": [{"school": "...", "degree": "...", "year": "..."}],
  "experience": [{"company": "...", "role": "...", "dates": "...", "bullets": ["..."]}]
}
If a section is missing from the resume, return an empty list for that field."""


def extract_text_from_pdf(file_content: bytes) -> str:
    doc = fitz.open(stream=file_content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


async def parse_resume(file_content: bytes) -> dict:
    raw_text = extract_text_from_pdf(file_content)
    if not raw_text:
        raise ValueError("No text could be extracted from the PDF.")

    response = await generate(raw_text, system=SYSTEM_PROMPT)

    response = response.strip()
    if response.startswith("```"):
        response = response.split("\n", 1)[1]
    if response.endswith("```"):
        response = response.rsplit("```", 1)[0]
    response = response.strip()

    try:
        return {"raw_resume": raw_text, **json.loads(response)}
    except json.JSONDecodeError:
        return {
            "raw_resume": raw_text,
            "summary": "",
            "skills": [],
            "projects": [],
            "education": [],
            "experience": [],
        }
