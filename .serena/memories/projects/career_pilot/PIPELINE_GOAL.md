# Pipeline Goal - Make Chat-Driven Pipeline Work

## User Request
Make the pipeline work end-to-end through chat:
1. Upload resume through chat
2. Profile is created from resume
3. Analyze jobs through chat
4. Full workflow: upload → profile → analyze → apply → interview prep

## Current State
- Backend has 376 tests, 365 pass (9 failures unrelated to chat)
- Chat REST endpoint works (POST /api/chat)
- Frontend now uses REST API mode (not WebSocket)
- .env file created with VITE_API_URL=http://localhost:8000
- Backend routers registered: resume, profile, applications, interview, chat, tools, careerops, personas, memory, analytics

## Key Files
- Backend: routers/chat.py (437 lines), services/workflows/
- Frontend: components/agent/AgentChat.jsx, services/api.js
