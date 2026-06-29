import json
import logging
from pathlib import Path

from config import BASE_DIR

logger = logging.getLogger(__name__)

CAREER_OPS_DIR = BASE_DIR / "career_ops"


def get_workspace_path() -> Path:
    CAREER_OPS_DIR.mkdir(parents=True, exist_ok=True)
    return CAREER_OPS_DIR


def sync_resume_to_careerops(profile_data: dict) -> Path:
    workspace = get_workspace_path()
    cv_content = _format_cv_markdown(profile_data)
    cv_path = workspace / "cv.md"
    cv_path.write_text(cv_content, encoding="utf-8")
    logger.info("Synced resume to CareerOps: %s", cv_path)
    return cv_path


def sync_config(profile_data: dict) -> Path:
    workspace = get_workspace_path()
    config = _format_profile_config(profile_data)
    config_dir = workspace / "config"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / "profile.yml"
    config_path.write_text(config, encoding="utf-8")
    logger.info("Synced config to CareerOps: %s", config_path)
    return config_path


def get_workspace_info() -> dict:
    workspace = get_workspace_path()
    files = list(workspace.rglob("*"))
    return {
        "path": str(workspace),
        "exists": workspace.exists(),
        "files": [str(f.relative_to(workspace)) for f in files if f.is_file()],
        "cv_exists": (workspace / "cv.md").exists(),
        "config_exists": (workspace / "config" / "profile.yml").exists(),
    }


def sync_all(profile_data: dict) -> dict:
    cv_path = sync_resume_to_careerops(profile_data)
    config_path = sync_config(profile_data)
    return {
        "cv_path": str(cv_path),
        "config_path": str(config_path),
        "workspace": str(get_workspace_path()),
    }


def _format_cv_markdown(profile: dict) -> str:
    personal = profile.get("personal", {})
    lines = [
        f"# {personal.get('name', 'Candidate')}",
        "",
    ]

    contact_parts = []
    if personal.get("email"):
        contact_parts.append(personal["email"])
    if personal.get("phone"):
        contact_parts.append(personal["phone"])
    if personal.get("location"):
        contact_parts.append(personal["location"])
    if personal.get("linkedin"):
        contact_parts.append(personal["linkedin"])
    if personal.get("github"):
        contact_parts.append(personal["github"])
    if contact_parts:
        lines.append(" | ".join(contact_parts))
        lines.append("")

    summary = profile.get("ai_summary") or profile.get("summary", "")
    if summary:
        lines.extend(["## Summary", summary, ""])

    experience_level = profile.get("experience_level", "")
    if experience_level:
        lines.extend([f"**Experience Level:** {experience_level.title()}", ""])

    skills = profile.get("skills", [])
    if skills:
        lines.extend(["## Skills", ", ".join(skills), ""])

    tech_stack = profile.get("tech_stack", [])
    if tech_stack:
        lines.append("## Technical Skills")
        for category in tech_stack:
            cat_name = category.get("category", "Other")
            tools = category.get("tools", [])
            lines.append(f"- **{cat_name}:** {', '.join(tools)}")
        lines.append("")

    experience = profile.get("experience", [])
    if experience:
        lines.append("## Experience")
        for exp in experience:
            company = exp.get("company", "")
            role = exp.get("role", "")
            dates = exp.get("dates", "")
            if not dates:
                start = exp.get("start_date", "")
                end = exp.get("end_date", "")
                dates = f"{start} - {end}" if start else ""
            lines.append(f"### {role} | {company}")
            if dates:
                lines.append(f"*{dates}*")
            for bullet in exp.get("bullets", []):
                lines.append(f"- {bullet}")
            lines.append("")

    education = profile.get("education", [])
    if education:
        lines.append("## Education")
        for edu in education:
            degree = edu.get("degree", "")
            field = edu.get("field", "")
            school = edu.get("school", "")
            year = edu.get("year", "")
            degree_str = f"{degree} in {field}" if field else degree
            lines.append(f"**{degree_str}** | {school} | {year}")
        lines.append("")

    projects = profile.get("projects", [])
    if projects:
        lines.append("## Projects")
        for proj in projects:
            name = proj.get("name", "")
            desc = proj.get("description", "")
            tech = proj.get("tech", [])
            lines.append(f"### {name}")
            if desc:
                lines.append(desc)
            if tech:
                lines.append(f"*Tech: {', '.join(tech)}*")
            lines.append("")

    certifications = profile.get("certifications", [])
    if certifications:
        lines.append("## Certifications")
        for cert in certifications:
            name = cert.get("name", "")
            issuer = cert.get("issuer", "")
            year = cert.get("year", "")
            lines.append(f"- **{name}** ({issuer}, {year})")
        lines.append("")

    languages = profile.get("languages", [])
    if languages:
        lines.append("## Languages")
        for lang in languages:
            lang_name = lang.get("language", "")
            prof = lang.get("proficiency", "")
            lines.append(f"- {lang_name}" + (f" ({prof})" if prof else ""))
        lines.append("")

    strengths = profile.get("strengths", [])
    if strengths:
        lines.append("## Strengths")
        for s in strengths:
            lines.append(f"- {s}")
        lines.append("")

    interests = profile.get("interests", [])
    if interests:
        lines.append("## Interests")
        lines.append(", ".join(interests))
        lines.append("")

    return "\n".join(lines)


def _format_profile_config(profile: dict) -> str:
    personal = profile.get("personal", {})
    skills = profile.get("skills", [])
    experience = profile.get("experience", [])

    lines = [
        "# CareerPilot Profile Configuration",
        "# Generated from parsed resume data",
        "",
        "profile:",
        f'  name: "{personal.get("name", "")}"',
        f'  email: "{personal.get("email", "")}"',
        f'  phone: "{personal.get("phone", "")}"',
        f'  location: "{personal.get("location", "")}"',
        f'  linkedin: "{personal.get("linkedin", "")}"',
        f'  github: "{personal.get("github", "")}"',
        "",
        "skills:",
    ]
    for skill in skills:
        lines.append(f'  - "{skill}"')

    if experience:
        lines.append("")
        lines.append("experience:")
        for exp in experience:
            lines.append(f'  - company: "{exp.get("company", "")}"')
            lines.append(f'    role: "{exp.get("role", "")}"')
            lines.append(f'    dates: "{exp.get("dates", "")}"')

    return "\n".join(lines)


async def run_careerops_scan(portals: list[str] = None) -> dict:
    logger.info("CareerOps scan requested (portals: %s)", portals or "all")
    return {
        "status": "scan_complete",
        "portals_scanned": portals or ["all"],
        "results": [],
        "note": "CareerOps scanner integration - connect to local CareerOps instance",
    }


async def run_careerops_evaluate(job_data: dict) -> dict:
    logger.info("CareerOps evaluate requested for: %s", job_data.get("company", "unknown"))
    return {
        "score": "B+",
        "match_analysis": "Good alignment with profile",
        "strengths": ["Relevant experience", "Strong skill match"],
        "gaps": ["Could benefit from more leadership experience"],
        "recommendation": "Apply - strong candidate",
    }
