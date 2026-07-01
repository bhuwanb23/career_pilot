# Complete Project State - CareerPilot AI

## Project Structure
- Frontend: React 19 + Vite + Tailwind at localhost:5173
- Backend: FastAPI + SQLAlchemy + SQLite at localhost:8000
- AI: Ollama at localhost:11434, model llama3.2:1b
- Environment: VITE_API_URL=http://localhost:8000

## All Pages (10 total)
1. Dashboard (/) - Stats, charts, real API data
2. Workspace (/workspace) - AI agent chat via REST API
3. Job Analysis (/applications) - JD input, match score
4. Applications (/kanban) - Kanban board with 6 columns
5. Application Detail (/kanban/:id) - Full page detail view
6. Interview Hub (/interview) - Questions, STAR answers
7. Outreach Hub (/outreach) - Recruiter outreach
8. Pipeline (/pipeline) - Job list with timeline
9. Approved (/approved) - Offer management
10. Profile (/profile) - Career profile

## Backend API (35+ endpoints)
- Profile, resume, applications, interview, outreach, chat, tools, analytics, personas, memory

## Key Fixes Applied This Session
- Database table creation (deleted old DB)
- CORS configuration
- WebSocket null checks in workflows
- Duplicate key error in AgentChat
- DetailPanel converted to full page
- RightSidebar connected to real API
- Dashboard scoreTrend computed from real data

## Chat Configuration
- Frontend: REST API mode (POST /api/chat)
- Backend: Intent detection + workflow routing
- LLM: Ollama at localhost:11434, model llama3.2:1b
