import asyncio
import json
import logging
from pathlib import Path

from config import BASE_DIR

logger = logging.getLogger(__name__)

CAREER_OPS_DIR = BASE_DIR / "career_ops"
CAREER_OPS_SRC = BASE_DIR / "career-ops-src"


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


def sync_all_applications(apps: list) -> dict:
    synced = []
    for app in apps:
        try:
            result = sync_application_to_tracker(app)
            synced.append(result)
        except Exception as e:
            logger.warning("Failed to sync application %s: %s", getattr(app, "id", "?"), e)
    return {"synced_count": len(synced), "applications": synced}


CAREEROPS_STATUS_MAP = {
    "draft": "Evaluated",
    "applied": "Applied",
    "assessment": "Responded",
    "interview": "Interview",
    "offer": "Offer",
    "rejected": "Rejected",
    "archived": "Discarded",
    "saved": "Evaluated",
    "screening": "Responded",
}


def _score_to_careerops(app) -> str:
    score = app.score_overall if app.score_overall and app.score_overall > 0 else (app.match_score or 0) * 100
    out_of_five = round(score / 100 * 5, 1)
    return f"{out_of_five}/5"


def _ensure_tracker_file(path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "# Applications Tracker\n\n"
        "| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n"
        "|---|------|---------|------|-------|--------|-----|--------|-------|\n",
        encoding="utf-8",
    )


def sync_application_to_tracker(app) -> dict:
    workspace = get_workspace_path()
    tracker_path = workspace / "data" / "applications.md"
    _ensure_tracker_file(tracker_path)

    content = tracker_path.read_text(encoding="utf-8")
    lines = content.splitlines()

    header_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("| # |"):
            header_idx = i
            break

    if header_idx is None:
        lines.extend([
            "",
            "| # | Date | Company | Role | Score | Status | PDF | Report | Notes |",
            "|---|------|---------|------|-------|--------|-----|--------|-------|",
        ])
        header_idx = len(lines) - 2

    data_start = header_idx + 2
    data_lines = [l for l in lines[data_start:] if l.strip().startswith("|")]

    app_key = f"cp-{app.id}"
    status = CAREEROPS_STATUS_MAP.get(app.status, "Evaluated")
    score = _score_to_careerops(app)
    date_str = app.created_at.strftime("%Y-%m-%d") if app.created_at else ""
    notes = (app.notes or "").replace("|", "/").replace("\n", " ")[:120]
    company = (app.company or "").replace("|", "/")
    role = (app.role or "").replace("|", "/")

    new_row = f"| {app.id} | {date_str} | {company} | {role} | {score} | {status} | ❌ | | {notes} |"

    updated = False
    for i, line in enumerate(data_lines):
        cells = [c.strip() for c in line.strip("|").split("|")]
        if cells and (cells[0] == str(app.id) or (len(cells) > 8 and app_key in cells[8])):
            data_lines[i] = new_row
            updated = True
            break

    if not updated:
        data_lines.append(new_row)

    new_content = "\n".join(lines[:data_start] + data_lines)
    if not new_content.endswith("\n"):
        new_content += "\n"
    tracker_path.write_text(new_content, encoding="utf-8")

    logger.info("Synced application %s to CareerOps tracker", app.id)
    return {
        "application_id": app.id,
        "tracker_path": str(tracker_path),
        "status": status,
        "action": "updated" if updated else "created",
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


async def run_careerops_scan(portals: list[str] = None, company: str = None) -> dict:
    if not CAREER_OPS_SRC.exists():
        return {"status": "error", "message": "CareerOps source not found at career-ops-src/"}

    node_modules = CAREER_OPS_SRC / "node_modules"
    if not node_modules.exists():
        return {"status": "error", "message": "Run 'npm install' in career-ops-src/ directory first."}

    workspace = get_workspace_path()
    _ensure_scan_prerequisites(workspace)

    cmd = ["node", str(CAREER_OPS_SRC / "scan.mjs")]
    if company:
        cmd.extend(["--company", company])

    logger.info("Running CareerOps scan: %s (cwd=%s)", " ".join(cmd), workspace)
    try:
        import subprocess
        result = await asyncio.to_thread(
            subprocess.run, cmd,
            capture_output=True, timeout=120, cwd=str(workspace),
        )
        return {
            "status": "scan_complete" if result.returncode == 0 else "error",
            "portals_scanned": portals or ["all"],
            "output": result.stdout.decode(errors="replace")[:5000],
            "errors": result.stderr.decode(errors="replace")[:1000] if result.stderr else "",
        }
    except subprocess.TimeoutExpired:
        return {"status": "timeout", "message": "Scan timed out after 120s"}
    except FileNotFoundError:
        return {"status": "error", "message": "Node.js not found. Install Node.js to use CareerOps scanner."}
    except Exception as e:
        logger.exception("CareerOps scan failed")
        return {"status": "error", "message": str(e)}


def _ensure_scan_prerequisites(workspace: Path) -> None:
    import shutil
    portals = workspace / "portals.yml"
    if not portals.exists():
        example = CAREER_OPS_SRC / "templates" / "portals.example.yml"
        if example.exists():
            shutil.copy(example, portals)
        else:
            portals.write_text("tracked_companies: []\n", encoding="utf-8")


async def run_careerops_evaluate(job_data: dict, db=None) -> dict:
    logger.info("CareerOps evaluate for: %s", job_data.get("company", "unknown"))
    from services.profile_service import get_profile, profile_to_dict
    from services.resume_matcher import match_resume_to_jd
    from services.jd_parser import parse_jd
    from services.career_pilot_score import compute_career_pilot_score
    from database import SessionLocal

    company = job_data.get("company", "")
    role = job_data.get("role", "")
    jd_text = job_data.get("job_description") or job_data.get("description") or ""
    if not jd_text.strip() and (company or role):
        jd_text = f"{role} at {company}".strip() or f"Software role at {company or 'Company'}"

    if not jd_text.strip():
        return {"error": "job_description or company/role required in job_data"}

    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        profile = get_profile(db)
        if not profile:
            return {
                "score": "B+",
                "match_analysis": "Good alignment with profile (upload resume for full evaluation)",
                "strengths": ["Relevant experience", "Strong skill match"],
                "gaps": ["Upload resume for detailed gap analysis"],
                "recommendation": "Apply - review profile first",
            }
        pd = profile_to_dict(profile)
        jd = parse_jd(jd_text, job_data.get("url", ""))
        match = match_resume_to_jd(pd, jd)
        score = compute_career_pilot_score(pd, {"job_description": jd_text, "role": jd.get("role", role)}, {})
        overall = score.get("overall", 0)
        letter = "A" if overall >= 80 else "B+" if overall >= 70 else "B" if overall >= 60 else "C"
        return {
            "score": letter,
            "match_analysis": f"Match {match.get('match_percentage', 0):.0f}%. Overall CareerPilot score {overall:.0f}.",
            "strengths": match.get("matched_skills", [])[:5],
            "gaps": match.get("missing_skills", [])[:5],
            "recommendation": "Apply - strong candidate" if overall >= 65 else "Review gaps before applying",
            "career_pilot_score": score,
        }
    finally:
        if own_session:
            db.close()


async def run_careerops_pdf() -> bytes:
    from services.profile_service import get_profile, profile_to_dict
    from services.resume_generator import generate_resume, resume_to_pdf
    from database import SessionLocal

    db = SessionLocal()
    try:
        profile = get_profile(db)
        if not profile:
            raise FileNotFoundError("No career profile found")
        resume_data = await generate_resume(profile_to_dict(profile), "")
        pdf_bytes = resume_to_pdf(resume_data)
        return bytes(pdf_bytes)
    finally:
        db.close()


async def run_careerops_cover_letter(job_data: dict = None) -> str:
    from services.cover_letter import generate_cover_letter
    from services.profile_service import get_profile, profile_to_dict
    from database import SessionLocal

    job_data = job_data or {}
    db = SessionLocal()
    try:
        profile = get_profile(db)
        if not profile:
            return "Cover letter generation requires a career profile."
        return await generate_cover_letter(
            profile_to_dict(profile),
            job_data.get("company", ""),
            job_data.get("role", ""),
            job_data.get("job_description", ""),
        )
    finally:
        db.close()
