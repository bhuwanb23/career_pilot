import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import { listApplications } from "../services/api";
import { useAgent } from "../context/AgentContext";

const statusColors = {
  saved: "bg-gray-100 text-gray-600",
  applied: "bg-brand-50 text-brand-600",
  screening: "bg-amber-50 text-amber-600",
  interview: "bg-emerald-50 text-emerald-600",
  offer: "bg-purple-50 text-purple-600",
  rejected: "bg-red-50 text-red-500",
};

const gradients = [
  "from-brand-500 to-brand-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-purple-500 to-purple-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
];

function JobListCard({ job, onClick }) {
  const gradIdx = job.company.charCodeAt(0) % gradients.length;

  return (
    <button
      onClick={() => onClick(job)}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradients[gradIdx]} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
          {job.company[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">{job.company}</h4>
          <p className="text-[11px] text-gray-500 truncate">{job.role}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[job.status] || "bg-gray-100 text-gray-500"}`}>
          {job.status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          <span className="text-[10px] text-gray-500 font-medium">Step {job.currentStep} of 10</span>
        </div>
        <span className={`text-[10px] font-semibold ${
          job.matchScore >= 80 ? "text-emerald-600" :
          job.matchScore >= 60 ? "text-amber-600" : "text-red-500"
        }`}>
          {job.matchScore}%
        </span>
      </div>

      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
          style={{ width: `${(job.currentStep / 10) * 100}%` }}
        />
      </div>
    </button>
  );
}

export default function Pipeline({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const { registerRefreshHandler } = useAgent();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPipeline = useCallback(() => {
    setLoading(true);
    listApplications()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  useEffect(() => {
    return registerRefreshHandler("pipeline", loadPipeline);
  }, [registerRefreshHandler, loadPipeline]);

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status !== "rejected" && j.status !== "offer").length,
    interviews: jobs.filter((j) => j.status === "interview").length,
    offers: jobs.filter((j) => j.status === "offer").length,
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your job application journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
              <p className="text-[10px] text-white/60">Total</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{stats.interviews}</p>
              <p className="text-[10px] text-white/60">Interviews</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{stats.offers}</p>
              <p className="text-[10px] text-white/60">Offers</p>
            </div>
          </div>
        </div>

        <div className="bg-white py-16 px-8">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-400">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                </div>
                <p className="text-base font-medium text-gray-500 mb-1">No applications yet</p>
                <p className="text-sm text-gray-400">Start by analyzing a job description</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <JobListCard key={job.id} job={job} onClick={setSelectedJob} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
