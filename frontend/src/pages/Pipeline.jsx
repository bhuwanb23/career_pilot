import { useState } from "react";
import AppLayout from "../components/AppLayout";
import PipelineTimeline from "../components/pipeline/PipelineTimeline";
import { MOCK_PIPELINE_JOBS, MOCK_PIPELINE_STEPS, MOCK_PIPELINE_STEP_DETAILS } from "../data/mockData";

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
  const stepIdx = MOCK_PIPELINE_STEPS.findIndex((s) => s.id === job.currentStep);
  const stepTitle = MOCK_PIPELINE_STEPS[stepIdx]?.title || "Discover";

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
          <span className="text-[10px] text-gray-500 font-medium">{stepTitle}</span>
        </div>
        <span className={`text-[10px] font-semibold ${
          job.matchScore >= 80 ? "text-emerald-600" :
          job.matchScore >= 60 ? "text-amber-600" : "text-red-500"
        }`}>
          {job.matchScore}%
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
          style={{ width: `${(job.currentStep / 10) * 100}%` }}
        />
      </div>
    </button>
  );
}

function JobDetailView({ job, onBack }) {
  const [activeStep, setActiveStep] = useState(MOCK_PIPELINE_STEPS[job.currentStep - 1]?.key || "discover");
  const stepDetails = MOCK_PIPELINE_STEP_DETAILS[activeStep];
  const stepIdx = MOCK_PIPELINE_STEPS.findIndex((s) => s.key === activeStep);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Pipeline
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {job.company[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{job.company}</h2>
              <p className="text-sm text-gray-500">{job.role}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{job.location} · {job.salary}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${job.matchScore >= 80 ? "text-emerald-600" : job.matchScore >= 60 ? "text-amber-600" : "text-red-500"}`}>
              {job.matchScore}%
            </p>
            <p className="text-[10px] text-gray-400">match score</p>
          </div>
        </div>
      </div>

      {/* Timeline + Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Timeline */}
        <div className="lg:col-span-1">
          <PipelineTimeline
            steps={MOCK_PIPELINE_STEPS}
            currentStep={job.currentStep}
            activeStep={activeStep}
            onStepClick={setActiveStep}
          />
        </div>

        {/* Step Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-600">{stepIdx + 1}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{stepDetails?.title}</h3>
                <p className="text-xs text-gray-500">{stepDetails?.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {stepDetails?.actions?.map((action, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{action}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Step {stepIdx + 1} of 10</span>
                <span>{Math.round(((job.currentStep - 1) / 10) * 100)}% through pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pipeline({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [selectedJob, setSelectedJob] = useState(null);

  const stats = {
    total: MOCK_PIPELINE_JOBS.length,
    active: MOCK_PIPELINE_JOBS.filter((j) => j.status !== "rejected" && j.status !== "offer").length,
    interviews: MOCK_PIPELINE_JOBS.filter((j) => j.status === "interview").length,
    offers: MOCK_PIPELINE_JOBS.filter((j) => j.status === "offer").length,
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
              <span>Workspace</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-600">Pipeline</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your job application journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-xs font-medium text-gray-600">{stats.total} total</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">{stats.interviews} interviews</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-100">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs font-medium text-purple-600">{stats.offers} offers</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {selectedJob ? (
          <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MOCK_PIPELINE_JOBS.map((job) => (
              <JobListCard key={job.id} job={job} onClick={setSelectedJob} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
