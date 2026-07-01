# Chat Fix Plan

## Problem
Cover letter workflow uses latest app (TechCorp) instead of user-mentioned company (Google).

## Root Cause
`check_app` in workflows fetches latest application from DB, ignoring user input.

## Fix Required
1. Extract company name from user message
2. Pass company to workflow context
3. Use company in workflow instead of latest app

## Files to Fix
- services/workflows/cover_letter.py
- services/workflows/interview_prep.py  
- routers/chat.py (pass user_msg to workflow)
