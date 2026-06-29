import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import KanbanColumn from "../components/kanban/KanbanColumn";
import DetailPanel from "../components/kanban/DetailPanel";
import {
  COLUMN_GROUPS,
  KANBAN_COLUMNS,
  SORT_OPTIONS,
  appMatchesColumn,
  normalizeStatus,
} from "../components/kanban/kanbanConstants";
import { listApplications, updateApplication, getAnalytics } from "../services/api";

export default function Applications({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sort };
      if (search.trim()) params.q = search.trim();
      if (statusFilter) params.status = statusFilter;
      const [data, stats] = await Promise.all([
        listApplications(params),
        getAnalytics().catch(() => null),
      ]);
      setApplications(data);
      if (stats) setAnalytics(stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, sort, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    const onFocus = () => loadApplications();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadApplications]);

  const currentGroup = COLUMN_GROUPS.find((g) => g.key === activeGroup);
  const visibleColumns = KANBAN_COLUMNS.filter((col) => currentGroup.columns.includes(col.key));
  const grouped = visibleColumns.map((col) => ({
    ...col,
    apps: applications.filter((a) => appMatchesColumn(a, col.key)),
  }));

  const getGroupCount = (groupKey) => {
    const group = COLUMN_GROUPS.find((g) => g.key === groupKey);
    return group.columns.reduce(
      (sum, colKey) => sum + applications.filter((a) => appMatchesColumn(a, colKey)).length,
      0,
    );
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

  const handleDeleteApp = (id) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    handleClosePanel();
  };

  const handleDrop = async (appId, newStatus) => {
    const app = applications.find((a) => a.id === appId);
    if (!app || normalizeStatus(app.status) === newStatus) return;
    try {
      const updated = await updateApplication(appId, { status: newStatus });
      handleUpdateApp(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  const totalApps = analytics?.total_applications ?? applications.length;
  const interviewCount = analytics?.interviews ?? applications.filter((a) => normalizeStatus(a.status) === "interview").length;
  const offerCount = analytics?.offers ?? applications.filter((a) => normalizeStatus(a.status) === "offer").length;
  const activeCount = analytics?.active_applications ?? totalApps;

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Applications</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track and manage your job applications</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-xs font-medium text-gray-600">{totalApps} total</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-600">{activeCount} active</span>
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

        <div className="flex-shrink-0 mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, skills..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All statuses</option>
            {KANBAN_COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>{c.title}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-brand-100"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={loadApplications}
            className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        <div className="flex-shrink-0 mb-4">
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            {COLUMN_GROUPS.map((group) => {
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

        <div className="flex-1 min-h-0 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading applications...</div>
          ) : (
            <div className={`flex gap-4 h-full pb-2 ${visibleColumns.length <= 3 ? "grid grid-cols-3" : ""}`}
              style={visibleColumns.length > 3 ? { minWidth: `${visibleColumns.length * 240}px` } : undefined}
            >
              {grouped.map((col) => (
                <KanbanColumn
                  key={col.key}
                  title={col.title}
                  stage={col.key}
                  applications={col.apps}
                  onCardClick={handleCardClick}
                  onDrop={handleDrop}
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
            onDelete={handleDeleteApp}
          />
        )}
      </div>
    </AppLayout>
  );
}
