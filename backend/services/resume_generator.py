import json

from services.llm_client import generate
from services.llm_utils import parse_llm_json

SYSTEM_PROMPT = """You are CareerPilot, a professional resume writer.
Generate a polished, ATS-friendly resume based on the provided career profile.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "name": "Full Name",
  "contact": "email | phone | location",
  "summary": "2-3 sentence professional summary",
  "experience": [
    {"company": "...", "role": "...", "dates": "...", "bullets": ["..."]}
  ],
  "education": [
    {"school": "...", "degree": "...", "year": "..."}
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {"name": "...", "description": "...", "tech": ["..."]}
  ]
}
Write strong action verbs. Quantify achievements where possible.
Tailor the summary to the target role if a job description is provided."""

FALLBACK = {
    "name": "",
    "contact": "",
    "summary": "",
    "experience": [],
    "education": [],
    "skills": [],
    "projects": [],
}


async def generate_resume(profile_data: dict, job_description: str = "") -> dict:
    prompt = f"""Career Profile:
{json.dumps(profile_data, indent=2)}"""

    if job_description:
        prompt += f"""

Target Job Description:
{job_description[:4000]}

Tailor the resume to match this job description."""

    prompt += "\n\nGenerate a professional resume."

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return parse_llm_json(response, FALLBACK)


def resume_to_pdf(resume_data: dict) -> bytes:
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    name = resume_data.get("name", "")
    if name:
        pdf.set_font("Helvetica", "B", 18)
        pdf.cell(0, 10, name, new_x="LMARGIN", new_y="NEXT", align="C")

    contact = resume_data.get("contact", "")
    if contact:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, contact, new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.ln(4)

    summary = resume_data.get("summary", "")
    if summary:
        _add_section(pdf, "PROFESSIONAL SUMMARY", summary)

    experience = resume_data.get("experience", [])
    if experience:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "EXPERIENCE", new_x="LMARGIN", new_y="NEXT")
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        for exp in experience:
            pdf.set_font("Helvetica", "B", 10)
            role = exp.get("role", "")
            company = exp.get("company", "")
            dates = exp.get("dates", "")
            pdf.cell(0, 6, f"{role} | {company}", new_x="LMARGIN", new_y="NEXT")
            if dates:
                pdf.set_font("Helvetica", "I", 9)
                pdf.cell(0, 5, dates, new_x="LMARGIN", new_y="NEXT")
            for bullet in exp.get("bullets", []):
                pdf.set_font("Helvetica", "", 10)
                pdf.cell(5)
                pdf.multi_cell(0, 5, f"- {bullet}")
            pdf.ln(2)

    education = resume_data.get("education", [])
    if education:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "EDUCATION", new_x="LMARGIN", new_y="NEXT")
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        for edu in education:
            pdf.set_font("Helvetica", "B", 10)
            degree = edu.get("degree", "")
            school = edu.get("school", "")
            pdf.cell(0, 6, f"{degree} | {school}", new_x="LMARGIN", new_y="NEXT")
            year = edu.get("year", "")
            if year:
                pdf.set_font("Helvetica", "I", 9)
                pdf.cell(0, 5, year, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    skills = resume_data.get("skills", [])
    if skills:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "SKILLS", new_x="LMARGIN", new_y="NEXT")
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, ", ".join(skills))
        pdf.ln(2)

    projects = resume_data.get("projects", [])
    if projects:
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "PROJECTS", new_x="LMARGIN", new_y="NEXT")
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)
        for proj in projects:
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 6, proj.get("name", ""), new_x="LMARGIN", new_y="NEXT")
            desc = proj.get("description", "")
            if desc:
                pdf.set_font("Helvetica", "", 10)
                pdf.multi_cell(0, 5, desc)
            tech = proj.get("tech", [])
            if tech:
                pdf.set_font("Helvetica", "I", 9)
                pdf.cell(0, 5, f"Tech: {', '.join(tech)}", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)

    return pdf.output()


def _add_section(pdf, title, content):
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, content)
    pdf.ln(2)
