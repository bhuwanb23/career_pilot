# Session Summary - July 2, 2025

## What Was Built This Session
1. CareerPilot Score system (fit, timing, competition, readiness)
2. JD parser and resume matcher services
3. Agent chat with REST API mode
4. Pipeline page with job list and timeline
5. Interview Hub page
6. Applications Kanban page
7. Application Detail full page view
8. Figma design tokens applied
9. Mock data removed from Pipeline/Approved pages
10. RightSidebar connected to real API
11. Dashboard scoreTrend computed from real data

## Key Issues Fixed
- Database table creation (deleted old DB)
- CORS configuration
- WebSocket null checks in workflows
- Duplicate key error in AgentChat
- DetailPanel converted to full page
- Cover letter workflow using wrong company
- Interview prep workflow using wrong company

## Current Issue
Ollama timeout - need to increase timeout from 120s to 300s

## Environment
- Frontend: localhost:5173
- Backend: localhost:8000
- Ollama: localhost:11434
- Model: llama3.2:1b
