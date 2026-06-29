import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import KanbanColumn from "../components/kanban/KanbanColumn";
import DetailPanel from "../components/kanban/DetailPanel";
import { listApplications } from "../services/api";

const columnGroups = [
  {
    key: "early",
    label: "Pipeline",
    columns: [
      { key: "saved", title: "Saved" },
      { key: "applied", title: "Applied" },
      { key: "screening", title: "Screening" },
    ],
  },
  {
    key: "late",
    label: "Results",
    columns: [
      { key: "interview", title: "Interview" },
      { key: "offer", title: "Offer" },
      { key: "rejected", title: "Rejected" },
    ],
  },
];

export default function Applications({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState("early");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listApplications();
      setApplications(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const currentGroup = columnGroups.find((g) => g.key === activeGroup);
  const grouped = currentGroup.columns.map((col) => ({
    ...col,
    apps: applications.filter((a) => a.status === col.key),
  }));

  const totalApps = applications.length;
  const interviewCount = applications.filter((a) => a.status === "interview").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;

  const getGroupCount = (groupKey) => {
    const group = columnGroups.find((g) => g.key === groupKey);
    return group.columns.reduce((sum, col) => sum + applications.filter((a) => a.status === col.key).length, 0);
  };

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
        <div className="flex-shrink-0 mb-4">
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
            <div className="flex items-center gap-3">
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

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        <div className="flex-shrink-0 mb-4">
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            {columnGroups.map((group) => {
              const isActive = activeGroup === group.key;
              const count = getGroupCount(group.key);
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={`relative px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {group.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? "bg-brand-50 text-brand-600" : "bg-gray-200 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading applications...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4 h-full">
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
