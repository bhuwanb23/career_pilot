import { useState } from "react";
import AppLayout from "../components/AppLayout";
import KanbanColumn from "../components/kanban/KanbanColumn";
import DetailPanel from "../components/kanban/DetailPanel";
import { MOCK_APPLICATIONS } from "../data/mockData";

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
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState("early");

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
    return group.columns.reduce((sum, col) => {
      return sum + applications.filter((a) => a.status === col.key).length;
    }, 0);
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
        {/* Header */}
        <div className="bg-[#272729] py-16 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-semibold text-white tracking-tight mb-4" style={{ letterSpacing: "-0.28px" }}>Applications</h1>
            <p className="text-xl text-white/70 mb-8" style={{ lineHeight: "1.47" }}>Track and manage your job applications</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{totalApps}</p>
                <p className="text-xs text-white/60">Total</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{interviewCount}</p>
                <p className="text-xs text-white/60">Interviews</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{offerCount}</p>
                <p className="text-xs text-white/60">Offers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Tab Control */}
        <div className="flex-shrink-0 mb-4">
          <div className="inline-flex bg-[#f5f5f7] rounded-full p-1">
            {columnGroups.map((group) => {
              const isActive = activeGroup === group.key;
              const count = getGroupCount(group.key);
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#0066cc] text-white"
                      : "text-[#1d1d1f]/60 hover:text-[#1d1d1f]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {group.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#e0e0e0] text-[#1d1d1f]/60"
                    }`}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 min-h-0">
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
