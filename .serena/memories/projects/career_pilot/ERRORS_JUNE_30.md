# Errors to Fix - June 30, 2025

## Error 1: no such table: chat_messages
- SQLite database doesn't have the chat_messages table
- Backend needs to run `init_db()` to create all tables
- Fix: Ensure database initialization happens before first request

## Error 2: CORS blocked
- `GET http://localhost:8000/api/analytics` blocked by CORS policy
- Backend CORS config exists in main.py but might not be working
- Fix: Verify CORS_ORIGINS in backend config includes localhost:5173

## Error 3: Duplicate keys in AgentChat
- `Encountered two children with the same key, 1782795841629`
- Same Date.now() issue as before
- Fix: Ensure msgIdRef counter is working correctly

## Key Files
- Backend: main.py (init_db), database.py, config.py
- Frontend: components/agent/AgentChat.jsx
