# CareerPilot AI - Full Project Context

## Overview
CareerPilot AI is a **privacy-first, fully local, AI-powered career assistant** and job application management platform. Located at `D:\projects\website\career_pilot`. GitHub: `bhuwanb23/career_pilot`.

## Tech Stack
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (WAL mode), PyMuPDF, httpx, websockets, tenacity, fpdf2, google-generativeai
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, react-router-dom v7, oxlint
- **AI Engine**: Ollama (default `llama3.2:1b`) or Gemini (`gemini-2.0-flash`)
- **Database**: SQLite at `data/career_pilot.db`

## Architecture
```
career_pilot/
├── backend/
│   ├── main.py              # FastAPI app, CORS, lifespan, router wiring
│   ├── config.py            # Pydantic settings (.env support)
│   ├── database.py          # SQLAlchemy engine, WAL PRAGMA, session
│   ├── models.py            # 4 tables: CareerProfile, Application, InterviewPrep, ChatMessage
│   ├── schemas.py           # Pydantic request/response models
│   ├── logging_config.py    # Structured logging setup
│   ├── routers/             # 6 API routers
│   │   ├── resume.py        # POST /api/resume/upload
│   │   ├── profile.py       # GET/PUT /api/profile
│   │   ├── applications.py  # CRUD /api/applications, POST /api/jobs/analyze
│   │   ├── interview.py     # POST /api/interview/prepare/{id}, GET/PUT /{id}
│   │   ├── chat.py          # WebSocket /ws/chat, intent detection, workflows
│   │   └── tools.py         # REST API for tool registry
│   ├── services/            # Business logic
│   │   ├── llm_client.py    # Dual provider: OllamaProvider + GeminiProvider (retry, streaming)
│   │   ├── llm_utils.py     # JSON parsing from LLM responses
│   │   ├── resume_parser.py # PyMuPDF extract → LLM structured parse
│   │   ├── job_analyzer.py  # JD vs profile analysis
│   │   ├── interview_prep.py # Company summary + questions + STAR answers
│   │   ├── cover_letter.py  # Tailored cover letter generation
│   │   ├── recruiter_msg.py # LinkedIn/email outreach messages
│   │   ├── resume_generator.py # LLM resume gen + fpdf2 PDF rendering
│   │   ├── analytics.py     # DB analytics + LLM narrative
│   │   ├── profile_service.py # Profile CRUD + dict conversion
│   │   ├── document_extractor.py # MinerU with PyMuPDF fallback
│   │   ├── exceptions.py    # LLMProviderError, LLMTimeoutError, LLMRateLimitError, LLMConfigError
│   │   ├── tool_registry.py # Tool registry with system prompt injection
│   │   ├── tools/__init__.py # 11 registered tools across 6 categories
│   │   ├── workflow.py      # WorkflowExecutor: step-based async pipeline
│   │   └── workflows/       # 9 intent workflows
│   │       ├── resume_upload.py
│   │       ├── resume_generate.py
│   │       ├── cover_letter.py
│   │       ├── recruiter_msg.py
│   │       ├── analyze_job.py
│   │       ├── interview_prep.py
│   │       ├── show_applications.py
│   │       ├── show_profile.py
│   │       └── analytics.py
│   └── tests/               # 12 test files
│       ├── test_api.py, test_chat.py, test_config.py, test_exceptions.py
│       ├── test_full_flow.py, test_intent.py, test_live_server.py
│       ├── test_llm_utils.py, test_tools.py, test_workflow.py
│       └── conftest.py, generate_samples.py
└── frontend/
    ├── src/
    │   ├── main.jsx          # React DOM entry
    │   ├── App.jsx           # Router: /login, /, /profile, /applications (protected)
    │   ├── index.css         # Tailwind v4 @theme with brand colors (indigo)
    │   ├── pages/
    │   │   ├── LoginPage.jsx      # Split layout, BrandingPanel + LoginForm
    │   │   ├── Dashboard.jsx      # QuickStats + 5 SVG charts + RecentActivity + UpcomingTasks
    │   │   ├── ProfilePage.jsx    # ResumeCard, ProfileDetails, ExperienceTimeline, ProjectCards, CareerPersonas
    │   │   └── JobAnalysis.jsx    # InputSection, MatchScore, SkillsAnalysis, ResumeSuggestions, CareerScoreGrid, ActionButtons
    │   └── components/
    │       ├── AppLayout.jsx       # 3-panel layout: Sidebar + main + RightSidebar
    │       ├── Sidebar.jsx         # Nav (Dashboard/Profile/Applications/Interview Prep), user avatar, logout
    │       ├── RightSidebar.jsx    # Job Tracker pipeline (Saved→Applied→Screening→Interview→Offer→Rejected)
    │       ├── TopNavbar.jsx
    │       ├── Header.jsx
    │       ├── AICopilot.jsx       # Chat interface (placeholder, not wired to WS yet)
    │       ├── QuickStats.jsx      # 4 stat cards (Applications/Interviews/Offers/Response Rate)
    │       ├── BrandingPanel.jsx
    │       ├── Logo.jsx
    │       ├── GoogleIcon.jsx
    │       ├── ScoreCard.jsx
    │       ├── LoginForm.jsx
    │       ├── RecentActivity.jsx
    │       ├── UpcomingTasks.jsx
    │       ├── charts/            # 5 pure SVG charts: Line, Bar, Donut, Area, Radar
    │       ├── analysis/          # 6 components: InputSection, MatchScore, SkillsAnalysis, etc.
    │       └── profile/           # 5 components: ResumeCard, ProfileDetails, etc.
    ├── package.json          # React 19, Vite 8, Tailwind v4, oxlint
    └── vite.config.js        # React + Tailwind plugins
```

## Key Features Built
1. **Resume Parsing**: PDF upload → PyMuPDF text extraction → LLM structured parse → DB storage
2. **Job Matching**: JD analysis with match score, cover letter, recruiter message
3. **Interview Prep**: Company summary, 8-10 questions, 3-4 STAR answers
4. **Cover Letter Generation**: Tailored, professional, tone-configurable
5. **Recruiter Messages**: LinkedIn/email/cold outreach under 150 words
6. **Resume Generation**: LLM-powered resume → fpdf2 PDF rendering
7. **Analytics Dashboard**: Status breakdown, score distribution, top companies, LLM narrative
8. **AI Chat Engine**: WebSocket with hybrid intent detection (keyword + LLM fallback)
9. **Tool Registry**: 11 tools in 6 categories (Resume, JD, CareerOps, MinerU, Interview, Database)
10. **Workflow Engine**: Step-based async pipeline with progress reporting
11. **Login System**: Split layout with branding panel, localStorage-based auth
12. **3-Panel Dashboard**: Left sidebar + main content + right job tracker sidebar
13. **5 SVG Charts**: Line, Bar, Donut, Area, Radar (all pure SVG, no chart library)

## Database Schema (4 tables)
1. **career_profile**: id, raw_resume, summary, skills (JSON), projects (JSON), education (JSON), experience (JSON), timestamps
2. **applications**: id, company, role, job_description, status, cover_letter, recruiter_msg, match_score, match_analysis, notes, url, timestamps
3. **interview_prep**: id, application_id (FK→applications), company_summary, questions (JSON), star_answers (JSON), notes, created_at
4. **chat_messages**: id, session_id, role, content, action_type, action_data, created_at

## API Endpoints (20+)
- `GET /api/health` - Server + LLM status
- `POST /api/resume/upload` - PDF upload & parse
- `GET/PUT /api/profile` - Career profile CRUD
- `POST /api/jobs/analyze` - Analyze JD against profile
- `GET/PATCH/DELETE /api/applications/{id}` - Application CRUD
- `GET /api/applications?status=` - List with filter
- `POST /api/interview/prepare/{id}` - Generate interview prep
- `GET/PUT /api/interview/{id}` - Get/update prep
- `WebSocket /ws/chat` - Real-time AI chat
- `GET /api/chat/history` - Chat history
- `GET /api/chat/sessions` - Chat sessions list
- `POST /api/resume/generate` - Generate resume PDF
- `GET /api/tools` - List tools
- `GET /api/tools/categories` - Tool categories
- `POST /api/tools/{name}/execute` - Execute tool

## LLM Integration
- **Dual Provider**: Ollama (local, default) or Gemini (cloud)
- **Retry**: 3 attempts with exponential backoff
- **Streaming**: Both providers support streaming responses
- **JSON Extraction**: `strip_markdown_fences()` + `parse_llm_json()` with fallback
- **System Prompts**: Each service has its own system prompt with exact JSON schemas

## Intent Detection (Chat)
- **Hybrid**: Keyword matching → LLM classification fallback
- **9 Intents**: upload_resume, generate_resume, generate_cover_letter, generate_recruiter_msg, analyze_job, prepare_interview, show_applications, show_profile, placement_analytics
- **Workflows**: Each intent maps to a multi-step workflow (check → prepare → LLM → save → respond)

## Frontend Design
- **Brand Color**: Indigo (#6366f1) with Tailwind v4 `@theme` custom tokens
- **Layout**: 3-panel with collapsible sidebars (animated width transitions)
- **Auth**: localStorage-based (`loggedIn`, `user`)
- **Charts**: 5 hand-crafted SVG charts (no external chart library)
- **Job Tracker**: Kanban-style pipeline with stages (Saved→Applied→Screening→Interview→Offer→Rejected)

## Git History (30 commits)
Built in phases:
1. Backend foundation (LLM client, DB, models, routers)
2. Frontend foundation (React + Vite, pages, components)
3. Chat engine (WebSocket, intent detection, workflows)
4. Tool registry and REST API
5. Dashboard redesign (3-panel layout, SVG charts, job tracker)

## Tests
12 test files covering API, chat, config, exceptions, full flow, intent detection, LLM utils, tools, and workflow execution. Both mock and live server tests.

## .env Configuration
```
LLM_PROVIDER=ollama|gemini
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
MAX_UPLOAD_SIZE_MB=5
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```
