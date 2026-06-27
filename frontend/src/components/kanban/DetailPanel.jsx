import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

const statusOptions = [
  { value: "saved", label: "Saved", color: "bg-gray-100 text-gray-600" },
  { value: "applied", label: "Applied", color: "bg-brand-50 text-brand-600" },
  { value: "screening", label: "Screening", color: "bg-amber-50 text-amber-600" },
  { value: "interview", label: "Interview", color: "bg-emerald-50 text-emerald-600" },
  { value: "offer", label: "Offer", color: "bg-purple-50 text-purple-600" },
  { value: "rejected", label: "Rejected", color: "bg-red-50 text-red-500" },
];

const tabs = [
  { key: "details", label: "Details" },
  { key: "jd", label: "Job Description" },
  { key: "cover", label: "Cover Letter" },
  { key: "messages", label: "Messages" },
  { key: "interview", label: "Interview Kit" },
];

export default function DetailPanel({ application, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("details");
  const [notes, setNotes] = useState(application?.notes || "");
  const [status, setStatus] = useState(application?.status || "applied");
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(application?.notes || "");
    setStatus(application?.status || "applied");
    setInterviewPrep(null);
    setActiveTab("details");
  }, [application?.id]);

  if (!application) return null;

  const scorePct = Math.round((application.match_score || 0) * 100);
  const statusOpt = statusOptions.find((s) => s.value === status) || statusOptions[1];

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await fetch(`${API_BASE}/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate?.({ ...application, status: newStatus });
    } catch {
      setStatus(application.status);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      onUpdate?.({ ...application, notes });
    } catch {
      setNotes(application.notes || "");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePrep = async () => {
    setLoadingPrep(true);
    try {
      const resp = await fetch(`${API_BASE}/api/interview/prepare/${application.id}`, {
        method: "POST",
      });
      if (resp.ok) {
        const data = await resp.json();
        setInterviewPrep(data);
      }
    } catch {
      // Silently handle
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleLoadPrep = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/interview/${application.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setInterviewPrep(data);
      }
    } catch {
      // Silently handle
    }
  };

  useEffect(() => {
    if (activeTab === "interview" && application.id) {
      handleLoadPrep();
    }
  }, [activeTab, application.id]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col kanban-page animate-slide-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(application.company || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{application.company}</h2>
              <p className="text-xs text-gray-500 truncate">{application.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status + Score Bar */}
        <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3 flex-shrink-0">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${statusOpt.color}`}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-gray-700">Match: {scorePct}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Company</label>
                  <p className="text-sm font-semibold text-gray-900">{application.company}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Role</label>
                  <p className="text-sm font-semibold text-gray-900">{application.role}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Applied</label>
                  <p className="text-sm text-gray-700">
                    {new Date(application.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {application.url && (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Link</label>
                    <a href={application.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline truncate block">
                      View posting
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add your notes about this application..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none transition-all"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </div>

              {/* Match Analysis */}
              {application.match_analysis && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Match Analysis</label>
                  <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-600 leading-relaxed">
                    {application.match_analysis}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "jd" && (
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Job Description</label>
              <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {application.job_description || "No job description available."}
              </div>
            </div>
          )}

          {activeTab === "cover" && (
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Cover Letter</label>
              {application.cover_letter ? (
                <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {application.cover_letter}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">No cover letter generated yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Recruiter Message</label>
                {application.recruiter_msg ? (
                  <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {application.recruiter_msg}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">No recruiter message generated yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "interview" && (
            <div className="space-y-5">
              {interviewPrep ? (
                <>
                  {/* Company Summary */}
                  {interviewPrep.company_summary && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Company Summary</label>
                      <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed">
                        {interviewPrep.company_summary}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {interviewPrep.questions?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Interview Questions ({interviewPrep.questions.length})
                      </label>
                      <div className="space-y-3">
                        {interviewPrep.questions.map((q, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-50">
                            <p className="text-xs font-semibold text-gray-900 mb-1">{q.question}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{q.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STAR Answers */}
                  {interviewPrep.star_answers?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        STAR Method Answers ({interviewPrep.star_answers.length})
                      </label>
                      <div className="space-y-3">
                        {interviewPrep.star_answers.map((s, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                            <div>
                              <span className="text-[10px] font-bold text-brand-600">S:</span>
                              <span className="text-xs text-gray-700 ml-1">{s.situation}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-brand-600">T:</span>
                              <span className="text-xs text-gray-700 ml-1">{s.task}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-brand-600">A:</span>
                              <span className="text-xs text-gray-700 ml-1">{s.action}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-brand-600">R:</span>
                              <span className="text-xs text-gray-700 ml-1">{s.result}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">No interview prep yet</p>
                  <p className="text-xs text-gray-400 mb-4">Generate questions and STAR answers for this role</p>
                  <button
                    onClick={handleGeneratePrep}
                    disabled={loadingPrep}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm disabled:opacity-50"
                  >
                    {loadingPrep ? "Generating..." : "Generate Interview Kit"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
