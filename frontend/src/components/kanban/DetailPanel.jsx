import { useState, useEffect } from "react";
import CareerScoreGrid from "../analysis/CareerScoreGrid";
import { STATUS_OPTIONS, displayScore, normalizeStatus } from "./kanbanConstants";
import {
  prepareInterview,
  getInterviewPrep,
  updateApplication,
  getApplication,
  getApplicationTimeline,
  addApplicationActivity,
  deleteApplication,
  generateCoverLetter,
  generateRecruiterMessage,
  syncApplicationCareerOps,
} from "../../services/api";

const tabs = [
  { key: "details", label: "Details" },
  { key: "timeline", label: "Timeline" },
  { key: "jd", label: "Job Description" },
  { key: "cover", label: "Cover Letter" },
  { key: "messages", label: "Messages" },
  { key: "interview", label: "Interview Kit" },
];

export default function DetailPanel({ application, onClose, onUpdate, onDelete }) {
  const [app, setApp] = useState(application);
  const [activeTab, setActiveTab] = useState("details");
  const [notes, setNotes] = useState(application?.notes || "");
  const [status, setStatus] = useState(normalizeStatus(application?.status || "draft"));
  const [priority, setPriority] = useState(application?.priority || "normal");
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderText, setReminderText] = useState("");

  useEffect(() => {
    if (!application?.id) return;
    setLoading(true);
    Promise.all([
      getApplication(application.id),
      getApplicationTimeline(application.id).catch(() => ({ events: [] })),
    ])
      .then(([fresh, tl]) => {
        setApp(fresh);
        setNotes(fresh.notes || "");
        setStatus(normalizeStatus(fresh.status));
        setPriority(fresh.priority || "normal");
        setTimeline(tl.events || []);
      })
      .catch(() => setApp(application))
      .finally(() => setLoading(false));
    setInterviewPrep(null);
    setActiveTab("details");
  }, [application?.id]);

  useEffect(() => {
    if (activeTab === "interview" && app?.id) {
      getInterviewPrep(app.id).then(setInterviewPrep).catch(() => setInterviewPrep(null));
    }
  }, [activeTab, app?.id]);

  if (!application) return null;

  const scorePct = displayScore(app || application);
  const statusOpt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const careerScores = [
    { label: "Fit", value: Math.round(app?.score_fit || 0), color: "#10b981", description: "Profile match" },
    { label: "Timing", value: Math.round(app?.score_timing || 0), color: "#6366f1", description: "Application timing" },
    { label: "Competition", value: Math.round(app?.score_competition || 0), color: "#f59e0b", description: "Market competition" },
    { label: "Readiness", value: Math.round(app?.score_readiness || 0), color: "#8b5cf6", description: "Interview readiness" },
  ];

  const patchAndUpdate = async (data) => {
    const updated = await updateApplication(app.id, data);
    setApp(updated);
    onUpdate?.(updated);
    return updated;
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await patchAndUpdate({ status: newStatus });
      const tl = await getApplicationTimeline(app.id);
      setTimeline(tl.events || []);
    } catch {
      setStatus(normalizeStatus(app.status));
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setPriority(newPriority);
    try {
      await patchAndUpdate({ priority: newPriority });
    } catch {
      setPriority(app.priority || "normal");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await patchAndUpdate({ notes });
    } catch {
      /* ignore */
    }
  };

  const handleAddReminder = async () => {
    if (!reminderText.trim()) return;
    try {
      await addApplicationActivity(app.id, { kind: "reminder", message: reminderText.trim() });
      setReminderText("");
      const tl = await getApplicationTimeline(app.id);
      setTimeline(tl.events || []);
    } catch {
      /* ignore */
    }
  };

  const handleGeneratePrep = async () => {
    setLoadingPrep(true);
    try {
      const prep = await prepareInterview(app.id);
      setInterviewPrep(prep);
    } catch {
      setInterviewPrep(null);
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleGenerateCover = async () => {
    setLoadingCover(true);
    try {
      const result = await generateCoverLetter(app.id);
      const updated = { ...app, cover_letter: result.cover_letter };
      setApp(updated);
      onUpdate?.(updated);
    } finally {
      setLoadingCover(false);
    }
  };

  const handleGenerateMsg = async () => {
    setLoadingMsg(true);
    try {
      const result = await generateRecruiterMessage(app.id);
      const updated = { ...app, recruiter_msg: result.recruiter_msg };
      setApp(updated);
      onUpdate?.(updated);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSyncCareerOps = async () => {
    try {
      await syncApplicationCareerOps(app.id);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete application for ${app.company}?`)) return;
    try {
      await deleteApplication(app.id);
      onDelete?.(app.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col kanban-page animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(app?.company || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{app?.company}</h2>
              <p className="text-xs text-gray-500 truncate">{app?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleSyncCareerOps} title="Sync to CareerOps" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-brand-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
            </button>
            <button onClick={handleDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3 flex-shrink-0 flex-wrap">
          <select value={status} onChange={(e) => handleStatusChange(e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${statusOpt.color}`}>
            {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
          <select value={priority} onChange={(e) => handlePriorityChange(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 outline-none cursor-pointer bg-white text-gray-600">
            <option value="low">Low priority</option>
            <option value="normal">Normal</option>
            <option value="high">High priority</option>
          </select>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-gray-700">Score: {scorePct}%</span>
          </div>
        </div>

        <div className="px-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && activeTab === "details" ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : activeTab === "details" && (
            <div className="space-y-5">
              {(app?.score_overall > 0 || app?.score_fit > 0) && (
                <CareerScoreGrid scores={careerScores} overall={Math.round(app?.score_overall || scorePct)} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Company</label>
                  <p className="text-sm font-semibold text-gray-900">{app?.company}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Role</label>
                  <p className="text-sm font-semibold text-gray-900">{app?.role}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Created</label>
                  <p className="text-sm text-gray-700">{app?.created_at ? new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                </div>
                {app?.applied_at && (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Applied</label>
                    <p className="text-sm text-gray-700">{new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                )}
                {app?.url && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Link</label>
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline truncate block">View posting</a>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add your notes about this application..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none transition-all" />
                <button onClick={handleSaveNotes} className="mt-2 px-4 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">Save Notes</button>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Follow-up reminder</label>
                <div className="flex gap-2">
                  <input value={reminderText} onChange={(e) => setReminderText(e.target.value)} placeholder="e.g. Follow up with recruiter" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-100" />
                  <button onClick={handleAddReminder} className="px-3 py-2 rounded-xl bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100">Add</button>
                </div>
              </div>
              {app?.match_analysis && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Match Analysis</label>
                  <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-600 leading-relaxed">{app.match_analysis}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No activity yet</p>
              ) : timeline.map((event, i) => (
                <div key={event.id || i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${event.kind === "status_change" ? "bg-brand-500" : event.kind === "reminder" ? "bg-amber-500" : "bg-gray-400"}`} />
                  <div>
                    <p className="text-xs text-gray-800">{event.message}</p>
                    {event.created_at && (
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(event.created_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "jd" && (
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Job Description</label>
              <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app?.job_description || "No job description available."}</div>
            </div>
          )}

          {activeTab === "cover" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cover Letter</label>
                <button onClick={handleGenerateCover} disabled={loadingCover} className="px-3 py-1.5 rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100 disabled:opacity-50">
                  {loadingCover ? "Generating..." : app?.cover_letter ? "Regenerate" : "Generate"}
                </button>
              </div>
              {app?.cover_letter ? (
                <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</div>
              ) : (
                <div className="text-center py-8"><p className="text-xs text-gray-400">No cover letter generated yet</p></div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Recruiter Message</label>
                <button onClick={handleGenerateMsg} disabled={loadingMsg} className="px-3 py-1.5 rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100 disabled:opacity-50">
                  {loadingMsg ? "Generating..." : app?.recruiter_msg ? "Regenerate" : "Generate"}
                </button>
              </div>
              {app?.recruiter_msg ? (
                <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.recruiter_msg}</div>
              ) : (
                <div className="text-center py-8"><p className="text-xs text-gray-400">No recruiter message generated yet</p></div>
              )}
            </div>
          )}

          {activeTab === "interview" && (
            <div className="space-y-5">
              {interviewPrep ? (
                <>
                  {interviewPrep.company_summary && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Company Summary</label>
                      <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed">{interviewPrep.company_summary}</div>
                    </div>
                  )}
                  {interviewPrep.questions?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Interview Questions ({interviewPrep.questions.length})</label>
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
                  {interviewPrep.star_answers?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">STAR Method Answers ({interviewPrep.star_answers.length})</label>
                      <div className="space-y-3">
                        {interviewPrep.star_answers.map((s, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                            <div><span className="text-[10px] font-bold text-brand-600">S:</span><span className="text-xs text-gray-700 ml-1">{s.situation}</span></div>
                            <div><span className="text-[10px] font-bold text-brand-600">T:</span><span className="text-xs text-gray-700 ml-1">{s.task}</span></div>
                            <div><span className="text-[10px] font-bold text-brand-600">A:</span><span className="text-xs text-gray-700 ml-1">{s.action}</span></div>
                            <div><span className="text-[10px] font-bold text-brand-600">R:</span><span className="text-xs text-gray-700 ml-1">{s.result}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-medium text-gray-500 mb-1">No interview prep yet</p>
                  <p className="text-xs text-gray-400 mb-4">Generate questions and STAR answers for this role</p>
                  <button onClick={handleGeneratePrep} disabled={loadingPrep} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm disabled:opacity-50">
                    {loadingPrep ? "Generating..." : "Generate Interview Kit"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } } .animate-slide-in { animation: slideIn 0.3s ease-out; }`}</style>
    </>
  );
}
