import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getApplication, updateApplication, deleteApplication, getApplicationTimeline } from "../services/api";
import { STATUS_OPTIONS, displayScore, normalizeStatus } from "../components/kanban/kanbanConstants";

export default function ApplicationDetail({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getApplication(id),
      getApplicationTimeline(id).catch(() => []),
    ])
      .then(([data, timelineData]) => {
        setApp(data);
        setNotes(data.notes || "");
        setStatus(normalizeStatus(data.status || "draft"));
        setTimeline(Array.isArray(timelineData) ? timelineData : timelineData?.timeline || []);
      })
      .catch(() => navigate("/kanban"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const updated = await updateApplication(id, { status: newStatus });
      setApp(updated);
    } catch {
      setStatus(app.status);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const updated = await updateApplication(id, { notes });
      setApp(updated);
    } catch {
      setNotes(app.notes || "");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this application?")) {
      await deleteApplication(id);
      navigate("/kanban");
    }
  };

  const tabs = [
    { key: "details", label: "Details" },
    { key: "timeline", label: "Timeline" },
    { key: "jd", label: "Job Description" },
    { key: "cover", label: "Cover Letter" },
    { key: "messages", label: "Messages" },
  ];

  if (loading) {
    return (
      <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>
      </AppLayout>
    );
  }

  if (!app) return null;

  const s = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button onClick={() => navigate("/kanban")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Applications
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold">
                {app.company?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{app.company}</h1>
                <p className="text-sm text-gray-500">{app.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border-0 outline-none cursor-pointer ${s?.color || "bg-gray-100 text-gray-600"}`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{displayScore(app.match_score)}</p>
                <p className="text-[10px] text-gray-400">Match Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[400px]">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Company</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{app.company}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Role</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{app.role}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Status</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">{status}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Applied</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {app.match_analysis && (
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Match Analysis</label>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{app.match_analysis}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes..."
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none transition-all"
                />
                <button
                  onClick={handleSaveNotes}
                  className="mt-2 px-4 py-2 rounded-xl bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Save Notes
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Delete Application
                </button>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No timeline events yet</p>
              ) : (
                timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{event.details || ""}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(event.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "jd" && (
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Job Description</label>
              <div className="mt-2 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {app.job_description || "No job description available."}
              </div>
            </div>
          )}

          {activeTab === "cover" && (
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cover Letter</label>
              {app.cover_letter ? (
                <div className="mt-2 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {app.cover_letter}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No cover letter generated yet</p>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Recruiter Message</label>
              {app.recruiter_msg ? (
                <div className="mt-2 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {app.recruiter_msg}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No recruiter message generated yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
