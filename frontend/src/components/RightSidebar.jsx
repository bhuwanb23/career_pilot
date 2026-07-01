import { useState, useEffect } from "react";
import { listApplications } from "../services/api";
import { normalizeStatus } from "./kanban/kanbanConstants";

const stages = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "screening", label: "Screening" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function RightSidebar({ isCollapsed, onToggleCollapse }) {
  const [expandedStage, setExpandedStage] = useState("interview");
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    listApplications()
      .then((data) => {
        const mapped = data.map((app) => ({
          company: app.company,
          role: app.role,
          stage: normalizeStatus(app.status),
          logo: app.company?.[0]?.toUpperCase() || "?",
        }));
        setJobs(mapped);
      })
      .catch(() => setJobs([]));
  }, []);

  const grouped = stages.map((s) => ({
    ...s,
    jobs: jobs.filter((j) => j.stage === s.id),
  }));

  const activeIndex = grouped.findIndex((s) => s.id === expandedStage);

  return (
    <aside
      className={`bg-white border-l border-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-2">
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mb-1">Jobs</span>
          {grouped.map((stage) => (
            <button
              key={stage.id}
              title={`${stage.label}: ${stage.jobs.length}`}
              onClick={() => { setExpandedStage(stage.id); onToggleCollapse(); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                expandedStage === stage.id
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {stage.jobs.length}
            </button>
          ))}
          <button
            onClick={onToggleCollapse}
            className="mt-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            title="Expand"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="w-72 h-full flex flex-col">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Job Tracker</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{jobs.length} applications</p>
            </div>
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
              title="Collapse"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center gap-0.5">
              {grouped.map((s, i) => (
                <div key={s.id} className="flex-1 flex items-center">
                  <button
                    onClick={() => setExpandedStage(expandedStage === s.id ? null : s.id)}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= activeIndex ? "bg-brand-500" : "bg-gray-100"
                    }`}
                    title={`${s.label}: ${s.jobs.length}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-gray-300">{grouped[0].label}</span>
              <span className="text-[9px] text-gray-300">{grouped[grouped.length - 1].label}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            {grouped.map((stage) => {
              const isActive = expandedStage === stage.id;
              return (
                <div key={stage.id} className="mb-1">
                  <button
                    onClick={() => setExpandedStage(isActive ? null : stage.id)}
                    className={`w-full px-2 py-2 rounded-lg flex items-center justify-between transition-all ${
                      isActive ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-brand-500" : "bg-gray-300"}`} />
                      <span className={`text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                        {stage.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive ? "bg-brand-50 text-brand-600" : "text-gray-400"
                    }`}>
                      {stage.jobs.length}
                    </span>
                  </button>

                  {isActive && (
                    <div className="pl-5 pr-1 pb-2 space-y-1">
                      {stage.jobs.map((job, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                            {job.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-gray-700 truncate">{job.company}</p>
                            <p className="text-[9px] text-gray-400 truncate">{job.role}</p>
                          </div>
                        </div>
                      ))}
                      {stage.jobs.length === 0 && (
                        <p className="text-[10px] text-gray-300 text-center py-2">Empty</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-50">
            <button className="w-full py-2 rounded-lg bg-gray-50 text-gray-500 text-[11px] font-medium hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
