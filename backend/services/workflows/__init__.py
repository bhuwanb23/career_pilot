from . import (
    resume_upload,
    resume_generate,
    cover_letter,
    recruiter_msg,
    follow_up,
    show_outreach_due,
    analyze_job,
    interview_prep,
    show_applications,
    show_profile,
    analytics,
)

WORKFLOW_MODULES = {
    "upload_resume": resume_upload,
    "generate_resume": resume_generate,
    "generate_cover_letter": cover_letter,
    "generate_recruiter_msg": recruiter_msg,
    "generate_followup": follow_up,
    "show_outreach_due": show_outreach_due,
    "analyze_job": analyze_job,
    "prepare_interview": interview_prep,
    "show_applications": show_applications,
    "show_profile": show_profile,
    "placement_analytics": analytics,
}


def get_workflow(intent: str, user_msg: str, websocket):
    module = WORKFLOW_MODULES.get(intent)
    if module:
        return module.get_workflow(user_msg, websocket)
    return None
