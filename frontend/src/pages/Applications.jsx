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
        <div className="bg-[#f7f7f5] rounded-3xl p-10">
          <h1 className="text-4xl font-light text-black tracking-tight mb-2">Applications</h1>
          <p className="text-lg text-gray-500 font-light">Track and manage your job applications</p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6e6e6]">
              <span className="text-sm font-medium text-black">{totalApps} total</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6e6e6]">
              <span className="text-sm font-medium text-black">{interviewCount} interviews</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6e6e6]">
              <span className="text-sm font-medium text-black">{offerCount} offers</span>
            </div>
          </div>
        </div>

        {/* Segmented Tab Control */}
        <div className="flex-shrink-0 mb-4">
          <div className="inline-flex bg-[#f7f7f5] rounded-full p-1">
            {columnGroups.map((group) => {
              const isActive = activeGroup === group.key;
              const count = getGroupCount(group.key);
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-500 hover:text-black"
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
