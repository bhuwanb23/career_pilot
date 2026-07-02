"""CareerPilot page CRUD tools — applications, outreach, interview, personas, memory, pipeline."""

import json
import logging

from models import Application, ConversationMemory, PipelineStage
from services.application_management import (
    apply_status_update,
    build_timeline,
    effective_score,
    query_applications,
    record_activity,
    validate_status,
)
from services.interview_kit import build_and_save_prep, get_dashboard_items
from services.memory import get_all_memory, set_memory
from services.outreach import generate_step, get_sequence_state, mark_step_sent
from services.persona_generator import generate_personas
from services.persona_service import create_persona, delete_all_personas, delete_persona, get_persona, get_personas, persona_to_dict
from services.pipeline import get_pipeline_status, get_user_progress
from services.profile_service import create_or_update_profile, get_profile, profile_to_dict
from services.smart_application import apply_smart_result_to_application, run_smart_application
from services.tool_registry import Tool, registry

logger = logging.getLogger(__name__)


def _app_to_dict(app: Application) -> dict:
    return {
        "id": app.id,
        "company": app.company,
        "role": app.role,
        "status": app.status,
        "match_score": app.match_score,
        "score_overall": effective_score(app),
        "url": app.url or "",
        "notes": app.notes or "",
        "created_at": str(app.created_at),
    }


async def _application_create_execute(db=None, job_description: str = "", url: str = "", profile_data: dict = None, **kw):
    profile = get_profile(db)
    if not profile and not profile_data:
        return {"error": "No career profile found. Upload a resume first."}
    pd = profile_data or profile_to_dict(profile)
    if not job_description.strip():
        return {"error": "job_description is required"}
    result = await run_smart_application(job_description, url or "", pd)
    app = Application(job_description=job_description, url=url or "", status="draft")
    apply_smart_result_to_application(app, result)
    db.add(app)
    db.commit()
    db.refresh(app)
    record_activity(db, app.id, "status_change", "Application created via agent", {"to": "draft"})
    db.commit()
    try:
        from services.pipeline import advance_pipeline
        advance_pipeline(db, app.id, PipelineStage.JD_PARSED)
    except Exception:
        pass
    return {"application": _app_to_dict(app), "match_score": app.match_score}


async def _application_get_execute(db=None, application_id: int = 0, **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    data = _app_to_dict(app)
    data["cover_letter"] = (app.cover_letter or "")[:500]
    data["match_analysis"] = (app.match_analysis or "")[:500]
    return data


async def _application_list_execute(db=None, status: str = "", q: str = "", **kw):
    statuses = [status] if status else None
    apps = query_applications(db, q=q or None, statuses=statuses)
    return {"applications": [_app_to_dict(a) for a in apps], "total": len(apps)}


async def _application_update_execute(
    db=None, application_id: int = 0, status: str = "", notes: str = "", **kw
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    if status:
        apply_status_update(db, app, validate_status(status))
    if notes:
        app.notes = notes
        record_activity(db, app.id, "note", notes[:200])
    db.commit()
    db.refresh(app)
    try:
        from services.careerops import sync_application_to_tracker
        sync_application_to_tracker(app)
    except Exception:
        pass
    return {"application": _app_to_dict(app)}


async def _application_delete_execute(db=None, application_id: int = 0, **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    db.delete(app)
    db.commit()
    return {"deleted": application_id}


async def _application_timeline_execute(db=None, application_id: int = 0, **kw):
    events = build_timeline(db, application_id)
    return {"application_id": application_id, "events": events}


async def _application_score_execute(db=None, application_id: int = 0, **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    return {
        "application_id": application_id,
        "match_score": app.match_score,
        "score_overall": effective_score(app),
        "score_fit": app.score_fit,
        "score_timing": app.score_timing,
        "score_competition": app.score_competition,
        "score_readiness": app.score_readiness,
    }


async def _outreach_dashboard_execute(db=None, **kw):
    from services.followup_cadence import build_due_items
    due = build_due_items(db)
    return {"due_items": due, "total": len(due)}


async def _outreach_get_execute(db=None, application_id: int = 0, **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    return get_sequence_state(db, app)


async def _outreach_generate_execute(
    db=None, application_id: int = 0, step_type: str = "follow_up", channel: str = "linkedin", **kw
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    try:
        return await generate_step(db, app, step_type=step_type, channel=channel)
    except ValueError as e:
        return {"error": str(e)}


async def _outreach_mark_sent_execute(db=None, application_id: int = 0, step_id: str = "", **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    try:
        return mark_step_sent(db, app, step_id)
    except ValueError as e:
        return {"error": str(e)}


async def _outreach_due_execute(db=None, **kw):
    from services.followup_cadence import build_due_items
    return {"items": build_due_items(db)}


async def _interview_dashboard_execute(db=None, **kw):
    return {"items": get_dashboard_items(db)}


async def _interview_prepare_execute(db=None, application_id: int = 0, regenerate: bool = False, **kw):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": f"Application {application_id} not found"}
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found"}
    prep = await build_and_save_prep(db, app, profile_to_dict(profile), regenerate=regenerate)
    return {
        "application_id": application_id,
        "company": app.company,
        "role": app.role,
        "has_prep": True,
        "company_summary": (prep.company_summary or "")[:300],
    }


async def _interview_get_execute(db=None, application_id: int = 0, **kw):
    from models import InterviewPrep
    prep = db.query(InterviewPrep).filter(InterviewPrep.application_id == application_id).first()
    if not prep:
        return {"error": "No interview prep found", "application_id": application_id}
    return {
        "application_id": application_id,
        "company_summary": prep.company_summary,
        "questions": prep.get_questions(),
        "star_answers": prep.get_star_answers(),
    }


async def _interview_update_execute(db=None, application_id: int = 0, prep_notes: dict = None, **kw):
    from models import InterviewPrep
    from services.interview_kit import apply_prep_to_model
    prep = db.query(InterviewPrep).filter(InterviewPrep.application_id == application_id).first()
    if not prep:
        return {"error": "No interview prep found"}
    if prep_notes:
        existing = prep.get_prep_notes()
        existing.update(prep_notes)
        prep.set_prep_notes(existing)
    db.commit()
    return {"application_id": application_id, "updated": True}


async def _persona_generate_execute(db=None, profile_data: dict = None, persona_names: list = None, **kw):
    profile = get_profile(db)
    if not profile and not profile_data:
        return {"error": "No career profile found"}
    pd = profile_data or profile_to_dict(profile)
    persona_data_list = await generate_personas(pd, persona_names)
    delete_all_personas(db, profile.id)
    created = [create_persona(db, profile.id, pd_item) for pd_item in persona_data_list]
    return {"personas": [persona_to_dict(p) for p in created], "count": len(created)}


async def _persona_list_execute(db=None, **kw):
    profile = get_profile(db)
    if not profile:
        return {"error": "No career profile found", "personas": []}
    personas = get_personas(db, profile.id)
    return {"personas": [persona_to_dict(p) for p in personas]}


async def _persona_get_execute(db=None, persona_id: int = 0, **kw):
    p = get_persona(db, persona_id)
    if not p:
        return {"error": f"Persona {persona_id} not found"}
    return persona_to_dict(p)


async def _persona_delete_execute(db=None, persona_id: int = 0, **kw):
    ok = delete_persona(db, persona_id)
    return {"deleted": persona_id} if ok else {"error": f"Persona {persona_id} not found"}


async def _memory_list_execute(db=None, category: str = "", **kw):
    if category:
        from services.memory import get_memory_by_category
        return {"memories": get_memory_by_category(db, category)}
    return {"memories": get_all_memory(db)}


async def _memory_store_execute(db=None, key: str = "", value: str = "", category: str = "general", **kw):
    if not key or not value:
        return {"error": "key and value required"}
    set_memory(db, key, value, category)
    return {"stored": key}


async def _memory_delete_execute(db=None, memory_id: int = 0, **kw):
    mem = db.query(ConversationMemory).filter(ConversationMemory.id == memory_id).first()
    if not mem:
        return {"error": f"Memory {memory_id} not found"}
    db.delete(mem)
    db.commit()
    return {"deleted": memory_id}


async def _pipeline_status_execute(db=None, **kw):
    return get_user_progress(db)


async def _pipeline_application_execute(db=None, application_id: int = 0, **kw):
    return get_pipeline_status(db, application_id)


async def _profile_update_execute(db=None, updates: dict = None, **kw):
    if not updates:
        return {"error": "updates dict required"}
    profile = create_or_update_profile(db, updates)
    return profile_to_dict(profile)


def register_page_tools():
    tools = [
        Tool("application_create", "Create application from job description with full smart analysis", "Applications",
             {"type": "object", "properties": {"job_description": {"type": "string"}, "url": {"type": "string"}, "profile_data": {"type": "object"}}, "required": ["job_description"]},
             {"type": "object"}, _application_create_execute),
        Tool("application_get", "Get single application by ID", "Applications",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _application_get_execute),
        Tool("application_list", "List applications with optional status filter and search", "Applications",
             {"type": "object", "properties": {"status": {"type": "string"}, "q": {"type": "string"}}},
             {"type": "object"}, _application_list_execute),
        Tool("application_update", "Update application status or notes", "Applications",
             {"type": "object", "properties": {"application_id": {"type": "integer"}, "status": {"type": "string"}, "notes": {"type": "string"}}, "required": ["application_id"]},
             {"type": "object"}, _application_update_execute),
        Tool("application_delete", "Delete an application", "Applications",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _application_delete_execute),
        Tool("application_timeline", "Get application activity timeline", "Applications",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _application_timeline_execute),
        Tool("application_score", "Get CareerPilot score breakdown for application", "Applications",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _application_score_execute),
        Tool("outreach_dashboard", "Outreach dashboard with due follow-ups", "Outreach",
             {"type": "object", "properties": {}}, {"type": "object"}, _outreach_dashboard_execute),
        Tool("outreach_get", "Get outreach sequence for application", "Outreach",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _outreach_get_execute),
        Tool("outreach_generate", "Generate outreach message for a sequence step", "Outreach",
             {"type": "object", "properties": {"application_id": {"type": "integer"}, "step_type": {"type": "string"}, "channel": {"type": "string"}}, "required": ["application_id"]},
             {"type": "object"}, _outreach_generate_execute),
        Tool("outreach_mark_sent", "Mark outreach step as sent", "Outreach",
             {"type": "object", "properties": {"application_id": {"type": "integer"}, "step_id": {"type": "string"}}, "required": ["application_id", "step_id"]},
             {"type": "object"}, _outreach_mark_sent_execute),
        Tool("outreach_due", "List overdue/urgent outreach items", "Outreach",
             {"type": "object", "properties": {}}, {"type": "object"}, _outreach_due_execute),
        Tool("interview_dashboard", "Interview hub dashboard items", "Interview",
             {"type": "object", "properties": {}}, {"type": "object"}, _interview_dashboard_execute),
        Tool("interview_prepare", "Generate interview prep kit for application", "Interview",
             {"type": "object", "properties": {"application_id": {"type": "integer"}, "regenerate": {"type": "boolean"}}, "required": ["application_id"]},
             {"type": "object"}, _interview_prepare_execute),
        Tool("interview_get", "Get existing interview prep for application", "Interview",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _interview_get_execute),
        Tool("interview_update", "Update interview prep notes", "Interview",
             {"type": "object", "properties": {"application_id": {"type": "integer"}, "prep_notes": {"type": "object"}}, "required": ["application_id"]},
             {"type": "object"}, _interview_update_execute),
        Tool("persona_generate", "Generate career personas from profile", "Personas",
             {"type": "object", "properties": {"profile_data": {"type": "object"}}},
             {"type": "object"}, _persona_generate_execute),
        Tool("persona_list", "List all career personas", "Personas",
             {"type": "object", "properties": {}}, {"type": "object"}, _persona_list_execute),
        Tool("persona_get", "Get persona by ID", "Personas",
             {"type": "object", "properties": {"persona_id": {"type": "integer"}}, "required": ["persona_id"]},
             {"type": "object"}, _persona_get_execute),
        Tool("persona_delete", "Delete persona by ID", "Personas",
             {"type": "object", "properties": {"persona_id": {"type": "integer"}}, "required": ["persona_id"]},
             {"type": "object"}, _persona_delete_execute),
        Tool("memory_list", "List conversation memory entries", "Memory",
             {"type": "object", "properties": {"category": {"type": "string"}}},
             {"type": "object"}, _memory_list_execute),
        Tool("memory_store", "Store a memory key-value", "Memory",
             {"type": "object", "properties": {"key": {"type": "string"}, "value": {"type": "string"}, "category": {"type": "string"}}, "required": ["key", "value"]},
             {"type": "object"}, _memory_store_execute),
        Tool("memory_delete", "Delete memory entry by ID", "Memory",
             {"type": "object", "properties": {"memory_id": {"type": "integer"}}, "required": ["memory_id"]},
             {"type": "object"}, _memory_delete_execute),
        Tool("pipeline_status", "Get overall pipeline progress across applications", "Pipeline",
             {"type": "object", "properties": {}}, {"type": "object"}, _pipeline_status_execute),
        Tool("pipeline_application", "Get pipeline status for one application", "Pipeline",
             {"type": "object", "properties": {"application_id": {"type": "integer"}}, "required": ["application_id"]},
             {"type": "object"}, _pipeline_application_execute),
        Tool("profile_update", "Update career profile fields", "Profile",
             {"type": "object", "properties": {"updates": {"type": "object"}}, "required": ["updates"]},
             {"type": "object"}, _profile_update_execute),
    ]
    for t in tools:
        registry.register(t)


register_page_tools()
