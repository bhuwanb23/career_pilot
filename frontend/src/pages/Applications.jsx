import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import KanbanColumn from "../components/kanban/KanbanColumn";
import DetailPanel from "../components/kanban/DetailPanel";

const API_BASE = "http://127.0.0.1:8000";

const columns = [
  { key: "saved", title: "Saved" },
  { key: "applied", title: "Applied" },
  { key: "screening", title: "Screening" },
  { key: "interview", title: "Interview" },
  { key: "offer", title: "Offer" },
  { key: "rejected", title: "Rejected" },
];

export default function Applications({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/applications`);
      if (!resp.ok) throw new Error("Failed to fetch applications");
      const data = await resp.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const grouped = columns.map((col) => ({
    ...col,
    apps: applications.filter((a) => a.status === col.key),
  }));

  const totalApps = applications.length;
  const interviewCount = applications.filter((a) => a.status === "interview").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;

  const handleCardClick = (app) => {
    setSelectedApp(app);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedApp(null), 300);
  };

  const handleUpdateApp = (updated) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedApp((prev) => (prev?.id === updated.id ? updated : prev));
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="h-full flex flex-col kanban-page">
        {/* Header */}
        <div className="flex-shrink-0 mb-5">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
            <span>Workspace</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-600">Applications</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Applications</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track and manage your job applications</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-xs font-medium text-gray-600">{totalApps} total</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">{interviewCount} interviews</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-100">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-purple-600">{offerCount} offers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="flex-shrink-0 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-gray-400">Loading applications...</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 h-full pb-4">
              {grouped.map((col) => (
                <KanbanColumn
                  key={col.key}
                  title={col.title}
                  stage={col.key}
                  applications={col.apps}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {panelOpen && (
          <DetailPanel
            application={selectedApp}
            onClose={handleClosePanel}
            onUpdate={handleUpdateApp}
          />
        )}
      </div>
    </AppLayout>
  );
}
