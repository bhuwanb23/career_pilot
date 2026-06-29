import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import OutreachSequenceView from "../components/outreach/OutreachSequenceView";
import CadenceTimeline from "../components/outreach/CadenceTimeline";
import { dashboardItemToApplication, getUrgencyStyle } from "../components/outreach/outreachUtils";
import {
  getOutreachDashboard,
  getOutreachSequence,
  generateOutreachMessage,
  markOutreachSent,
  getApplicationTimeline,
} from "../services/api";

export default function OutreachHub({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [searchParams] = useSearchParams();
  const appIdParam = searchParams.get("appId");

  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeq, setLoadingSeq] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOutreachDashboard();
      const apps = (data.items || []).map(dashboardItemToApplication);
      setApplications(apps);
      const initialId = appIdParam ? Number(appIdParam) : apps[0]?.id;
      setSelectedAppId(initialId || null);
    } catch (e) {
      setError(e.message || "Failed to load outreach dashboard");
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
      setSequence(null);
      setTimeline([]);
      return;
    }
    setLoadingSeq(true);
    Promise.all([
      getOutreachSequence(selectedAppId),
      getApplicationTimeline(selectedAppId).catch(() => ({ events: [] })),
    ])
      .then(([seq, tl]) => {
        setSequence(seq);
        setTimeline(tl.events || []);
      })
      .catch(() => {
        setSequence(null);
        setTimeline([]);
      })
      .finally(() => setLoadingSeq(false));
  }, [selectedAppId]);

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  const handleGenerate = async (step) => {
    if (!selectedAppId) return;
    setLoadingSeq(true);
    try {
      const result = await generateOutreachMessage(selectedAppId, {
        stepType: step.type,
        channel: step.channel,
        stepId: step.id,
      });
      setSequence(result);
    } catch {
      /* ignore */
    } finally {
      setLoadingSeq(false);
    }
  };

  const handleMarkSent = async (stepId) => {
    if (!selectedAppId) return;
    setLoadingSeq(true);
    try {
      const result = await markOutreachSent(selectedAppId, stepId);
      setSequence(result);
      const tl = await getApplicationTimeline(selectedAppId);
      setTimeline(tl.events || []);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedAppId
            ? { ...a, steps_completed: (a.steps_completed || 0) + 1 }
            : a
        )
      );
    } catch {
      /* ignore */
    } finally {
      setLoadingSeq(false);
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
              <span className="text-gray-600">Outreach Hub</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Outreach Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage recruiter sequences and follow-ups</p>
          </div>

          {applications.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Application:</label>
              <select
                value={selectedAppId || ""}
                onChange={(e) => setSelectedAppId(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white"
              >
                {applications.map((app) => {
                  const urg = getUrgencyStyle(app.urgency);
                  return (
                    <option key={app.id} value={app.id}>
                      {app.company} — {app.role} [{urg.label}]
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {loading && <div className="text-center py-16 text-sm text-gray-400">Loading applications...</div>}
        {error && <div className="text-center py-8 text-sm text-red-500">{error}</div>}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-1">No active outreach</p>
            <p className="text-xs text-gray-400">Move applications to Applied, Assessment, or Interview status</p>
          </div>
        )}

        {selectedApp && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OutreachSequenceView
                sequence={sequence}
                loading={loadingSeq}
                onGenerate={handleGenerate}
                onMarkSent={handleMarkSent}
              />
            </div>
            <div className="lg:col-span-1">
              <CadenceTimeline events={timeline} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
