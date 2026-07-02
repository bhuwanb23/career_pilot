---
name: career-pilot
description: CareerPilot app agent — pages, tools, UI actions, and chat validation (not CareerOps repo)
arguments: mode
user_invocable: true
---

# CareerPilot Agent Skill

Scope: **CareerPilot application only** — backend tools, frontend pages, and the Workspace chat agent.  
**Not in scope:** full `career-ops-src/` tree, upstream CareerOps modes, batch runners, OpenCode CLI.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — analytics, recent apps |
| `/profile` | Career profile, resume upload, personas |
| `/workspace` | AI chat copilot |
| `/applications` | Job Analysis — paste JD |
| `/kanban` | Applications Kanban |
| `/kanban/{id}` | Application detail |
| `/interview` | Interview prep kits |
| `/outreach` | Outreach sequences |
| `/pipeline` | Pipeline progress |
| `/approved` | Approved placements |

## UI Actions

The agent emits `ui_actions` in chat responses. Frontend handles them via `AgentContext`:

| Action | Effect |
|--------|--------|
| `navigate` | Go to `path` |
| `open_application` | Open `/kanban/{application_id}` |
| `open_interview` | Open `/interview?appId={id}` |
| `open_outreach` | Open `/outreach?appId={id}` |
| `refresh` | Reload page data (`profile`, `applications`, `analytics`, `interview`, `outreach`, `pipeline`) |
| `show_upload` | Navigate to profile for resume upload |
| `toast` | Show notification |

## Tool Catalog

List all tools: `GET /api/tools`

Execute a tool: `POST /api/tools/{name}/execute` with JSON params.

### Core flows

**Onboard**
1. `profile_get` — check profile exists
2. If missing: emit `show_upload` ui_action
3. After upload: `profile_get`, `persona_generate`

**Analyze job**
1. `profile_get`
2. `application_create` with `job_description`
3. ui_actions: `open_application`, `refresh: applications`

**Cover letter**
1. `application_get` or `applications_list`
2. `cover_letter_generate` with company, role, job_description
3. Save via application update if needed

**Interview prep**
1. `interview_prepare` with `application_id`
2. ui_actions: `open_interview`, `refresh: interview`

**Outreach**
1. `outreach_due` or `outreach_dashboard`
2. `outreach_generate` for a step
3. ui_actions: `open_outreach`, `refresh: outreach`

**Analytics**
1. `analytics_get`
2. ui_actions: `navigate /`, `refresh: analytics`

### Tool categories

- **Resume:** `resume_parse`, `resume_generate`
- **JD:** `job_analyze`, `jd_parse`, `resume_match`, `career_pilot_score`
- **Applications:** `application_create`, `application_get`, `application_list`, `application_update`, `application_delete`, `application_timeline`, `application_score`
- **Outreach:** `outreach_dashboard`, `outreach_get`, `outreach_generate`, `outreach_mark_sent`, `outreach_due`
- **Interview:** `interview_dashboard`, `interview_prepare`, `interview_get`, `interview_update`
- **Personas:** `persona_generate`, `persona_list`, `persona_get`, `persona_delete`
- **Memory:** `memory_list`, `memory_store`, `memory_delete`
- **Pipeline:** `pipeline_status`, `pipeline_application`
- **Profile:** `profile_get`, `profile_update`
- **CareerOps (wrapped):** `careerops_sync`, `careerops_scan`, `careerops_evaluate`, `careerops_pdf`, `careerops_cover_letter`
- **Database:** `analytics_get`

## Chat API

```http
POST /api/chat
Content-Type: application/json

{"content": "Show my applications", "session_id": "optional-uuid"}
```

Response includes:
- `response` — assistant message
- `ui_actions` — page navigation/refresh commands
- `tool_trace` — tools executed this turn
- `action_type` / `action_data` — legacy action hints

## Validation

```bash
cd backend
pytest tests/test_agent_loop.py tests/test_agent_tools_coverage.py -q
python scripts/agent_smoke_test.py
```

## Agent Runtime

- Loop: `backend/services/agent_loop.py` (max 8 tool steps, JSON ReAct)
- Fallback: keyword workflows in `backend/routers/chat.py` when Ollama offline
- LLM: Ollama via `backend/services/llm_client.py`
