# CareerPilot AI — Agent Instructions

CareerPilot is a local-first career assistant (FastAPI + React + Ollama). The **runtime agent** lives in the Workspace chat and drives the app via backend tools.

## Primary Skill

Read and follow: [`.agents/skills/career-pilot/SKILL.md`](.agents/skills/career-pilot/SKILL.md)

This skill documents:
- All pages and routes
- The full tool registry (~40 tools)
- UI action contract (`navigate`, `refresh`, `open_application`, etc.)
- How to validate via `POST /api/chat` and `POST /api/tools/{name}/execute`

## Legacy

[`.agents/skills/career-ops/SKILL.md`](.agents/skills/career-ops/SKILL.md) covers CareerOps CLI file-sync only. Do **not** use the full `career-ops-src/` repo as agent context for CareerPilot development.

## Architecture

```
User → Workspace (AgentChat) → POST /api/chat → agent_loop.py → ToolRegistry → SQLite
                                                      ↓
                                              ui_actions → React pages refresh
```

## Key Files

| Area | Path |
|------|------|
| Agent loop | `backend/services/agent_loop.py` |
| Agent prompt | `backend/services/agent_prompt.py` |
| Tools | `backend/services/tools/` |
| Chat API | `backend/routers/chat.py` |
| UI bridge | `frontend/src/context/AgentContext.jsx` |

## Running Locally

```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend
cd frontend && npm run dev

# Ollama (required for agent)
ollama serve
ollama pull llama3.2:3b
```

Recommended model: `llama3.2:3b` or larger for reliable JSON tool calls.
