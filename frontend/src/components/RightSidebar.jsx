import { useState } from "react";

const stages = [
  { id: "saved", label: "Saved", color: "#6366f1", bgColor: "bg-brand-50", textColor: "text-brand-600", icon: "bookmark" },
  { id: "applied", label: "Applied", color: "#3b82f6", bgColor: "bg-blue-50", textColor: "text-blue-600", icon: "send" },
  { id: "screening", label: "Screening", color: "#f59e0b", bgColor: "bg-amber-50", textColor: "text-amber-600", icon: "eye" },
  { id: "interview", label: "Interview", color: "#10b981", bgColor: "bg-emerald-50", textColor: "text-emerald-600", icon: "chat" },
  { id: "offer", label: "Offer", color: "#8b5cf6", bgColor: "bg-purple-50", textColor: "text-purple-600", icon: "star" },
  { id: "rejected", label: "Rejected", color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-600", icon: "x" },
];

const stageIcons = {
  bookmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>,
  send: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" /></svg>,
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
  chat: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  star: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>,
  x: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

const jobs = [
  { company: "Google", role: "SWE Intern", stage: "interview", logo: "G" },
  { company: "Meta", role: "Frontend Dev", stage: "applied", logo: "M" },
  { company: "Amazon", role: "Backend Dev", stage: "screening", logo: "A" },
  { company: "Apple", role: "iOS Developer", stage: "saved", logo: "A" },
  { company: "Netflix", role: "Full Stack", stage: "applied", logo: "N" },
  { company: "Stripe", role: "Payments Eng", stage: "applied", logo: "S" },
  { company: "Uber", role: "ML Engineer", stage: "saved", logo: "U" },
  { company: "Spotify", role: "Data Eng", stage: "offer", logo: "S" },
  { company: "Airbnb", role: "SRE", stage: "rejected", logo: "A" },
  { company: "Shopify", role: "Rails Dev", stage: "applied", logo: "S" },
  { company: "Discord", role: "Go Backend", stage: "screening", logo: "D" },
  { company: "Figma", role: "Systems Eng", stage: "saved", logo: "F" },
];

const logoColors = {
  G: "bg-blue-500", M: "bg-blue-600", A: "bg-orange-500",
  N: "bg-red-500", S: "bg-purple-500", U: "bg-black",
  D: "bg-indigo-500", F: "bg-pink-500",
};

export default function RightSidebar({ isCollapsed, onToggleCollapse }) {
  const [expandedStage, setExpandedStage] = useState("interview");

  const grouped = stages.map((s) => ({
    ...s,
    jobs: jobs.filter((j) => j.stage === s.id),
  }));

  return (
    <aside
      className={`bg-white border-l border-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Collapsed: icon-only stage badges */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-3">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pipeline</span>
          {grouped.map((stage) => (
            <div
              key={stage.id}
              title={`${stage.label}: ${stage.jobs.length}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: stage.color }}
            >
              {stage.jobs.length}
            </div>
          ))}
          <div className="mt-2">
            <button
              onClick={onToggleCollapse}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Expanded: full content */}
      {!isCollapsed && (
        <div className="w-72 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Job Tracker</h2>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{jobs.length} jobs</span>
              <button
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Pipeline flow */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {grouped.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setExpandedStage(expandedStage === s.id ? null : s.id)}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.jobs.length}
                    </div>
                  </div>
                  {i < grouped.length - 1 && (
                    <svg className="w-3 h-3 text-gray-300 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stages list */}
          <div className="flex-1 overflow-y-auto">
            {grouped.map((stage) => (
              <div key={stage.id} className="border-b border-gray-50">
                <button
                  onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor}`}>
                      {stage.jobs.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedStage === stage.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {expandedStage === stage.id && (
                  <div className="px-4 pb-3 space-y-2">
                    {stage.jobs.map((job, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg ${logoColors[job.logo] || "bg-gray-400"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {job.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{job.company}</p>
                          <p className="text-[10px] text-gray-400 truncate">{job.role}</p>
                        </div>
                      </div>
                    ))}
                    {stage.jobs.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No jobs</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add job */}
          <div className="p-4 border-t border-gray-100">
            <button className="w-full py-2.5 rounded-xl bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Job
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
