import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import CompanyHeader from "../components/interview/CompanyHeader";
import InterviewKitView from "../components/interview/InterviewKitView";
import { buildChecklistFromPrep, dashboardItemToApplication } from "../components/interview/interviewUtils";
import {
  getInterviewDashboard,
  getInterviewPrep,
  prepareInterview,
  updateInterviewNotes,
} from "../services/api";

export default function InterviewHub({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [searchParams] = useSearchParams();
  const appIdParam = searchParams.get("appId");

  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [prep, setPrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewDashboard();
      const apps = (data.items || []).map(dashboardItemToApplication);
      setApplications(apps);
      const initialId = appIdParam ? Number(appIdParam) : apps[0]?.id;
      setSelectedAppId(initialId || null);
    } catch (e) {
      setError(e.message || "Failed to load interview dashboard");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [appIdParam]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedAppId) {
      setPrep(null);
      return;
    }
    setLoadingPrep(true);
    getInterviewPrep(selectedAppId)
      .then(setPrep)
      .catch(() => setPrep(null))
      .finally(() => setLoadingPrep(false));
    setCheckedIds(new Set());
  }, [selectedAppId]);

  const selectedApp = applications.find((a) => a.id === selectedAppId);
  const handleToggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checklist = buildChecklistFromPrep(prep?.prep_notes, checkedIds);

  const handleGenerate = async () => {
    if (!selectedAppId) return;
    setLoadingPrep(true);
    try {
      const result = await prepareInterview(selectedAppId);
      setPrep(result);
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedAppId ? { ...a, has_prep: true } : a))
      );
    } catch {
      /* ignore */
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedAppId) return;
    setLoadingPrep(true);
    try {
      const result = await prepareInterview(selectedAppId, { regenerate: true });
      setPrep(result);
    } catch {
      /* ignore */
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleSaveNotes = async (notes) => {
    if (!selectedAppId) return;
    try {
      const updated = await updateInterviewNotes(selectedAppId, notes);
      setPrep(updated);
    } catch {
      /* ignore */
    }
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
              <span>Workspace</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-600">Interview Hub</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Interview Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">Prepare for your upcoming interviews</p>
          </div>

          {applications.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Company:</label>
              <select
                value={selectedAppId || ""}
                onChange={(e) => setSelectedAppId(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} — {app.role}
                    {app.has_prep ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-16 text-sm text-gray-400">Loading applications...</div>
        )}

        {error && (
          <div className="text-center py-8 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-1">No upcoming interviews</p>
            <p className="text-xs text-gray-400">Move applications to Interview or Assessment status on the Kanban board</p>
          </div>
        )}

        {selectedApp && (
          <>
            <CompanyHeader
              application={selectedApp}
              checklist={checklist.map((item) => ({
                ...item,
                checked: checkedIds.has(item.id),
              }))}
            />

            <InterviewKitView
              prep={prep}
              loading={loadingPrep}
              checkedIds={checkedIds}
              onToggleCheck={handleToggleCheck}
              onGenerate={handleGenerate}
              onRegenerate={prep ? handleRegenerate : undefined}
              onSaveNotes={handleSaveNotes}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
