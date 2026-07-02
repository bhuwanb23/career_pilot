import base64

from services.tool_registry import Tool, registry


# ── Resume Tools ─────────────────────────────────────────

async def _resume_parse_execute(db=None, file_content: str = "", **kw):
    from services.document_extractor import extract_document
    from services.resume_parser import generate, SYSTEM_PROMPT
    from services.llm_utils import parse_llm_json

    pdf_bytes = base64.b64decode(file_content)
    extracted = await extract_document(pdf_bytes)
    raw_text = extracted["text"]
    if not raw_text:
        return {"error": "No text extracted from document"}

    response = await generate(raw_text, system=SYSTEM_PROMPT)
    parsed = parse_llm_json(response, {
        "summary": "", "skills": [], "projects": [], "education": [], "experience": []
    })
    return {"raw_resume": raw_text, **parsed}


registry.register(Tool(
    name="resume_parse",
    description="Extract structured career data (summary, skills, experience, education, projects) from a resume PDF",
    category="Resume",
    input_schema={"type": "object", "properties": {"file_content": {"type": "string", "description": "Base64-encoded PDF bytes"}}, "required": ["file_content"]},
    output_schema={"type": "object", "properties": {"raw_resume": {"type": "string"}, "summary": {"type": "string"}, "skills": {"type": "array"}, "projects": {"type": "array"}, "education": {"type": "array"}, "experience": {"type": "array"}}},
    execute=_resume_parse_execute,
))


async def _resume_generate_execute(db=None, profile_data: dict = None, job_description: str = "", **kw):
    from services.resume_generator import generate_resume, resume_to_pdf
    result = await generate_resume(profile_data or {}, job_description)
    pdf_bytes = resume_to_pdf(result)
    pdf_b64 = base64.b64encode(bytes(pdf_bytes)).decode()
    return {"resume_data": result, "pdf_base64": pdf_b64}


registry.register(Tool(
    name="resume_generate",
    description="Generate a professional resume PDF from career profile data, optionally tailored to a job description",
    category="Resume",
    input_schema={"type": "object", "properties": {"profile_data": {"type": "object"}, "job_description": {"type": "string"}}, "required": ["profile_data"]},
    output_schema={"type": "object", "properties": {"resume_data": {"type": "object"}, "pdf_base64": {"type": "string"}}},
    execute=_resume_generate_execute,
))


# ── JD Tools ─────────────────────────────────────────────

async def _job_analyze_execute(db=None, job_description: str = "", profile_data: dict = None, **kw):
    from services.job_analyzer import analyze_job
    return await analyze_job(job_description, profile_data or {})


registry.register(Tool(
    name="job_analyze",
    description="Analyze a job description against a career profile. Returns match score, analysis, cover letter, and recruiter message",
    category="JD",
    input_schema={"type": "object", "properties": {"job_description": {"type": "string"}, "profile_data": {"type": "object"}}, "required": ["job_description", "profile_data"]},
    output_schema={"type": "object", "properties": {"company": {"type": "string"}, "role": {"type": "string"}, "match_score": {"type": "number"}, "match_analysis": {"type": "string"}, "cover_letter": {"type": "string"}, "recruiter_msg": {"type": "string"}}},
    execute=_job_analyze_execute,
))


async def _jd_parse_execute(db=None, job_description: str = "", url: str = "", **kw):
    from services.jd_parser import parse_jd
    return parse_jd(job_description, url)


registry.register(Tool(
    name="jd_parse",
    description="Parse a job description into structured data: company, role, skills, requirements",
    category="JD",
    input_schema={"type": "object", "properties": {"job_description": {"type": "string"}, "url": {"type": "string"}}, "required": ["job_description"]},
    output_schema={"type": "object", "properties": {"company": {"type": "string"}, "role": {"type": "string"}, "skills": {"type": "array"}}},
    execute=_jd_parse_execute,
))


async def _resume_match_execute(db=None, job_description: str = "", profile_data: dict = None, **kw):
    from services.jd_parser import parse_jd
    from services.resume_matcher import match_resume_to_jd
    jd = parse_jd(job_description)
    return match_resume_to_jd(profile_data or {}, jd)


registry.register(Tool(
    name="resume_match",
    description="Match career profile skills against a job description",
    category="JD",
    input_schema={"type": "object", "properties": {"job_description": {"type": "string"}, "profile_data": {"type": "object"}}, "required": ["job_description", "profile_data"]},
    output_schema={"type": "object", "properties": {"match_percentage": {"type": "number"}, "matched_skills": {"type": "array"}, "missing_skills": {"type": "array"}}},
    execute=_resume_match_execute,
))


async def _career_pilot_score_execute(db=None, job_description: str = "", profile_data: dict = None, **kw):
    from services.career_pilot_score import compute_career_pilot_score
    jd_data = {"job_description": job_description, "role": ""}
    return compute_career_pilot_score(profile_data or {}, jd_data)


registry.register(Tool(
    name="career_pilot_score",
    description="Compute CareerPilot Score across fit, timing, competition, and readiness dimensions",
    category="JD",
    input_schema={"type": "object", "properties": {"job_description": {"type": "string"}, "profile_data": {"type": "object"}}, "required": ["job_description", "profile_data"]},
    output_schema={"type": "object", "properties": {"fit": {"type": "number"}, "timing": {"type": "number"}, "competition": {"type": "number"}, "readiness": {"type": "number"}, "overall": {"type": "number"}}},
    execute=_career_pilot_score_execute,
))


# ── CareerOps Tools ──────────────────────────────────────

async def _cover_letter_execute(db=None, profile_data: dict = None, company: str = "", role: str = "", job_description: str = "", tone: str = "professional", **kw):
    from services.cover_letter import generate_cover_letter
    letter = await generate_cover_letter(profile_data or {}, company, role, job_description, tone)
    return {"cover_letter": letter}


registry.register(Tool(
    name="cover_letter_generate",
    description="Generate a tailored cover letter for a specific company and role",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"profile_data": {"type": "object"}, "company": {"type": "string"}, "role": {"type": "string"}, "job_description": {"type": "string"}, "tone": {"type": "string"}}, "required": ["profile_data", "company", "role"]},
    output_schema={"type": "object", "properties": {"cover_letter": {"type": "string"}}},
    execute=_cover_letter_execute,
))


async def _recruiter_msg_execute(db=None, profile_data: dict = None, company: str = "", role: str = "", channel: str = "linkedin", **kw):
    from services.recruiter_msg import generate_recruiter_msg
    message = await generate_recruiter_msg(profile_data or {}, company, role, channel)
    return {"message": message}


registry.register(Tool(
    name="recruiter_msg_generate",
    description="Generate a short outreach message for a recruiter or hiring manager (LinkedIn, email, or cold outreach)",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"profile_data": {"type": "object"}, "company": {"type": "string"}, "role": {"type": "string"}, "channel": {"type": "string", "enum": ["linkedin", "email", "cold"]}}, "required": ["profile_data", "company", "role"]},
    output_schema={"type": "object", "properties": {"message": {"type": "string"}}},
    execute=_recruiter_msg_execute,
))


async def _follow_up_msg_execute(
    db=None,
    profile_data: dict = None,
    company: str = "",
    role: str = "",
    step_type: str = "follow_up",
    channel: str = "linkedin",
    prior_message: str = "",
    days_since_apply: int = 0,
    **kw,
):
    from services.follow_up_msg import generate_follow_up_msg
    message = await generate_follow_up_msg(
        profile_data or {},
        company,
        role,
        step_type=step_type,
        channel=channel,
        prior_message=prior_message,
        days_since_apply=days_since_apply,
    )
    return {"message": message}


registry.register(Tool(
    name="follow_up_msg_generate",
    description="Generate a context-aware follow-up or thank-you message for an application",
    category="CareerOps",
    input_schema={
        "type": "object",
        "properties": {
            "profile_data": {"type": "object"},
            "company": {"type": "string"},
            "role": {"type": "string"},
            "step_type": {"type": "string", "enum": ["initial", "follow_up", "thank_you"]},
            "channel": {"type": "string"},
            "prior_message": {"type": "string"},
            "days_since_apply": {"type": "integer"},
        },
        "required": ["profile_data", "company", "role"],
    },
    output_schema={"type": "object", "properties": {"message": {"type": "string"}}},
    execute=_follow_up_msg_execute,
))


async def _profile_get_execute(db=None, **kw):
    from services.profile_service import get_profile, profile_to_dict
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found"}
    return profile_to_dict(profile)


registry.register(Tool(
    name="profile_get",
    description="Get the current career profile (summary, skills, experience, education, projects)",
    category="CareerOps",
    input_schema={"type": "object", "properties": {}},
    output_schema={"type": "object", "properties": {"summary": {"type": "string"}, "skills": {"type": "array"}, "projects": {"type": "array"}, "education": {"type": "array"}, "experience": {"type": "array"}}},
    execute=_profile_get_execute,
))


async def _applications_list_execute(db=None, status: str = "", **kw):
    from models import Application
    from sqlalchemy import func
    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    apps = query.order_by(Application.created_at.desc()).all()
    counts = {}
    all_apps = db.query(Application).all()
    for a in all_apps:
        counts[a.status] = counts.get(a.status, 0) + 1
    return {
        "applications": [
            {"id": a.id, "company": a.company, "role": a.role, "status": a.status,
             "match_score": a.match_score, "created_at": str(a.created_at)}
            for a in apps
        ],
        "total": len(all_apps),
        "by_status": counts,
    }


registry.register(Tool(
    name="applications_list",
    description="List all job applications with status breakdown and optional status filter",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"status": {"type": "string", "description": "Filter by status: applied, interview, rejected, offer"}}},
    output_schema={"type": "object", "properties": {"applications": {"type": "array"}, "total": {"type": "integer"}, "by_status": {"type": "object"}}},
    execute=_applications_list_execute,
))


# ── MinerU Tools ─────────────────────────────────────────

async def _document_extract_execute(db=None, file_content: str = "", filename: str = "", **kw):
    from services.document_extractor import extract_document
    pdf_bytes = base64.b64decode(file_content)
    return await extract_document(pdf_bytes, filename)


registry.register(Tool(
    name="document_extract",
    description="Extract text from a PDF or document file. Uses MinerU if available, falls back to PyMuPDF",
    category="MinerU",
    input_schema={"type": "object", "properties": {"file_content": {"type": "string", "description": "Base64-encoded file bytes"}, "filename": {"type": "string", "description": "Original filename for format detection"}}, "required": ["file_content"]},
    output_schema={"type": "object", "properties": {"text": {"type": "string"}, "pages": {"type": "integer"}, "metadata": {"type": "object"}, "engine": {"type": "string"}}},
    execute=_document_extract_execute,
))


# ── Interview Tools ──────────────────────────────────────

async def _interview_prep_execute(db=None, company: str = "", role: str = "", job_description: str = "", profile_data: dict = None, **kw):
    from services.interview_prep import generate_prep
    return await generate_prep(company, role, job_description, profile_data or {})


registry.register(Tool(
    name="interview_prep",
    description="Generate interview preparation material: company summary, practice questions, and STAR-format answers",
    category="Interview",
    input_schema={"type": "object", "properties": {"company": {"type": "string"}, "role": {"type": "string"}, "job_description": {"type": "string"}, "profile_data": {"type": "object"}}, "required": ["company", "role", "job_description", "profile_data"]},
    output_schema={"type": "object", "properties": {"company_summary": {"type": "string"}, "questions": {"type": "array"}, "star_answers": {"type": "array"}}},
    execute=_interview_prep_execute,
))


# ── Database Tools ───────────────────────────────────────

async def _analytics_get_execute(db=None, **kw):
    from services.analytics import get_raw_analytics
    return get_raw_analytics(db)


registry.register(Tool(
    name="analytics_get",
    description="Get job search analytics: total applications, status breakdown, average match score, top companies, score distribution",
    category="Database",
    input_schema={"type": "object", "properties": {}},
    output_schema={"type": "object", "properties": {"total_applications": {"type": "integer"}, "status_breakdown": {"type": "object"}, "avg_match_score": {"type": "number"}, "score_distribution": {"type": "object"}, "top_companies": {"type": "array"}, "top_roles": {"type": "array"}}},
    execute=_analytics_get_execute,
))


# ── CareerOps Tools ──────────────────────────────────────

async def _careerops_sync_execute(db=None, **kw):
    from services.careerops import sync_all
    from services.profile_service import get_profile, profile_to_dict
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found. Upload a resume first."}
    profile_dict = profile_to_dict(profile)
    return sync_all(profile_dict)


registry.register(Tool(
    name="careerops_sync",
    description="Sync career profile to CareerOps workspace (generates cv.md and profile.yml)",
    category="CareerOps",
    input_schema={"type": "object", "properties": {}},
    output_schema={"type": "object", "properties": {"cv_path": {"type": "string"}, "config_path": {"type": "string"}, "workspace": {"type": "string"}}},
    execute=_careerops_sync_execute,
))


async def _careerops_scan_execute(db=None, portals: list = None, **kw):
    from services.careerops import run_careerops_scan
    return await run_careerops_scan(portals)


registry.register(Tool(
    name="careerops_scan",
    description="Scan job boards for matching positions using CareerOps scanner",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"portals": {"type": "array", "items": {"type": "string"}, "description": "Specific portals to scan, or empty for all"}}},
    output_schema={"type": "object", "properties": {"status": {"type": "string"}, "portals_scanned": {"type": "array"}, "results": {"type": "array"}}},
    execute=_careerops_scan_execute,
))


async def _careerops_evaluate_execute(db=None, job_data: dict = None, **kw):
    from services.careerops import run_careerops_evaluate
    return await run_careerops_evaluate(job_data or {})


registry.register(Tool(
    name="careerops_evaluate",
    description="Evaluate a job posting using CareerOps A-F scoring system with match analysis",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"job_data": {"type": "object", "description": "Job posting data with company, role, description"}}},
    output_schema={"type": "object", "properties": {"score": {"type": "string"}, "match_analysis": {"type": "string"}, "strengths": {"type": "array"}, "gaps": {"type": "array"}}},
    execute=_careerops_evaluate_execute,
))


async def _careerops_pdf_execute(db=None, **kw):
    from services.careerops import sync_resume_to_careerops, run_careerops_pdf
    from services.profile_service import get_profile, profile_to_dict
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found"}
    profile_dict = profile_to_dict(profile)
    sync_resume_to_careerops(profile_dict)
    pdf_bytes = await run_careerops_pdf()
    import base64
    return {"pdf_base64": base64.b64encode(pdf_bytes).decode(), "size": len(pdf_bytes)}


registry.register(Tool(
    name="careerops_pdf",
    description="Generate ATS-optimized PDF resume using CareerOps templates",
    category="CareerOps",
    input_schema={"type": "object", "properties": {}},
    output_schema={"type": "object", "properties": {"pdf_base64": {"type": "string"}, "size": {"type": "integer"}}},
    execute=_careerops_pdf_execute,
))


async def _careerops_cover_letter_execute(db=None, company: str = "", role: str = "", **kw):
    from services.careerops import sync_resume_to_careerops, run_careerops_cover_letter
    from services.profile_service import get_profile, profile_to_dict
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found"}
    profile_dict = profile_to_dict(profile)
    sync_resume_to_careerops(profile_dict)
    letter = await run_careerops_cover_letter({"company": company, "role": role})
    return {"cover_letter": letter, "company": company, "role": role}


registry.register(Tool(
    name="careerops_cover_letter",
    description="Generate tailored cover letter using CareerOps templates",
    category="CareerOps",
    input_schema={"type": "object", "properties": {"company": {"type": "string"}, "role": {"type": "string"}}},
    output_schema={"type": "object", "properties": {"cover_letter": {"type": "string"}, "company": {"type": "string"}, "role": {"type": "string"}}},
    execute=_careerops_cover_letter_execute,
))

from services.tools import page_tools  # noqa: F401 — registers page CRUD tools
