import { createContext, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const navigate = useNavigate();
  const refreshHandlers = useRef(new Map());
  const uploadHandler = useRef(null);
  const toastHandler = useRef(null);

  const registerRefreshHandler = useCallback((pageKey, fn) => {
    refreshHandlers.current.set(pageKey, fn);
    return () => refreshHandlers.current.delete(pageKey);
  }, []);

  const registerUploadHandler = useCallback((fn) => {
    uploadHandler.current = fn;
    return () => { uploadHandler.current = null; };
  }, []);

  const registerToastHandler = useCallback((fn) => {
    toastHandler.current = fn;
    return () => { toastHandler.current = null; };
  }, []);

  const dispatchUiActions = useCallback((actions = []) => {
    if (!Array.isArray(actions)) return;
    for (const action of actions) {
      if (!action?.action) continue;
      switch (action.action) {
        case "navigate":
          if (action.path) navigate(action.path);
          break;
        case "open_application":
          if (action.application_id) navigate(`/kanban/${action.application_id}`);
          break;
        case "open_interview":
          if (action.application_id) navigate(`/interview?appId=${action.application_id}`);
          else navigate("/interview");
          break;
        case "open_outreach":
          if (action.application_id) navigate(`/outreach?appId=${action.application_id}`);
          else navigate("/outreach");
          break;
        case "refresh": {
          const fn = refreshHandlers.current.get(action.target);
          if (fn) fn();
          break;
        }
        case "show_upload":
          navigate("/profile");
          if (uploadHandler.current) uploadHandler.current();
          break;
        case "toast":
          if (toastHandler.current) {
            toastHandler.current(action.message || "", action.level || "info");
          }
          break;
        default:
          break;
      }
    }
  }, [navigate]);

  return (
    <AgentContext.Provider value={{
      dispatchUiActions,
      registerRefreshHandler,
      registerUploadHandler,
      registerToastHandler,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}

export function useAgentRefresh(pageKey, loadFn) {
  const { registerRefreshHandler } = useAgent();
  const loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  return useCallback(() => {
    return registerRefreshHandler(pageKey, () => loadRef.current?.());
  }, [pageKey, registerRefreshHandler]);
}
