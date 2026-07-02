# React Error Fix

## Error
"Cannot update a component (BrowserRouter) while rendering a different component (AgentChat)"

## Root Cause
This happens when setState is called during render. In AgentChat, the useEffect might be triggering state updates that affect the parent BrowserRouter.

## Likely Cause
The AgentChat component's useEffect is calling setMessages which might trigger a re-render of the parent component during the initial render cycle.

## Fix
Ensure all state updates in useEffect are properly deferred and don't cause cascading re-renders during initial mount.

## Key Files
- src/components/agent/AgentChat.jsx
- src/pages/Workspace.jsx
