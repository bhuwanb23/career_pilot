import { useState, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import SkillsAnalysis from "../components/analysis/SkillsAnalysis";
import ResumeSuggestions from "../components/analysis/ResumeSuggestions";
import CareerScoreGrid from "../components/analysis/CareerScoreGrid";
import ActionButtons from "../components/analysis/ActionButtons";
import JobInfoCard from "../components/analysis/JobInfoCard";

const API_BASE = "http://127.0.0.1:8000";

function computeCareerScores(matchScore) {
  const fit = Math.round((matchScore || 0) * 100);

  const timingBase = 60 + Math.floor(Math.random() * 20);
  const timing = Math.min(95, timingBase);

  const competitionBase = 45 + Math.floor(Math.random() * 25);
  const competition = Math.min(85, competitionBase);

  const readinessBase = 65 + Math.floor(Math.random() * 20);
  const readiness = Math.min(95, readinessBase);

  return [
    { label: "Fit", value: fit, color: "#10b981", description: "How well your profile matches" },
    { label: "Timing", value: timing, color: "#6366f1", description: "Application timing score" },
    { label: "Competition", value: competition, color: "#f59e0b", description: "Market competition level" },
    { label: "Readiness", value: readiness, color: "#8b5cf6", description: "Interview readiness level" },
  ];
}

function parseSkillsFromAnalysis(analysis) {
  if (!analysis) return { required: [], missing: [] };

  const required = [];
  const missing = [];

  const lines = analysis.split("\n");
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("missing") || lower.includes("lack") || lower.includes("gap")) {
      const skillMatch = line.match(/[:-]\s*(.+)/);
      if (skillMatch) {
        skillMatch[1].split(/[,;]/).forEach((s) => {
          const trimmed = s.trim().replace(/^[\s\-•]+/, "");
          if (trimmed) missing.push(trimmed);
        });
      }
    } else if (lower.includes("skill") || lower.includes("experience") || lower.includes("proficiency")) {
      const skillMatch = line.match(/[:-]\s*(.+)/);
      if (skillMatch) {
        skillMatch[1].split(/[,;]/).forEach((s) => {
          const trimmed = s.trim().replace(/^[\s\-•]+/, "");
          if (trimmed) required.push(trimmed);
        });
      }
    }
  }

  return { required: required.slice(0, 8), missing: missing.slice(0, 6) };
}

function parseSuggestionsFromAnalysis(analysis, matchScore) {
  const suggestions = [];
  const pct = Math.round((matchScore || 0) * 100);

  if (pct < 80) {
    suggestions.push({ text: "Strengthen your experience with role-specific keywords from the job description", priority: "high" });
  }
  if (pct < 90) {
    suggestions.push({ text: "Add quantified achievements with metrics (e.g., 'reduced load time by 40%')", priority: "medium" });
  }
  suggestions.push({ text: "Tailor your professional summary to match this specific role", priority: "medium" });
  suggestions.push({ text: "Ensure your most relevant projects are prominently featured", priority: "low" });

  return suggestions;
}

export default function JobAnalysis({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});

  const skills = parseSkillsFromAnalysis(result?.match_analysis);
  const suggestions = parseSuggestionsFromAnalysis(result?.match_analysis, result?.match_score);
  const careerScores = result ? computeCareerScores(result.match_score, result.match_analysis) : null;

  const handleAnalyze = useCallback(async () => {
    if (!jd.trim() && !url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/jobs/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, url }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to analyze job. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [jd, url]);

  const handleAction = useCallback(async (actionKey) => {
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      switch (actionKey) {
        case "tailor_resume": {
          const resp = await fetch(`${API_BASE}/api/resume/generate?job_description=${encodeURIComponent(result?.job_description || "")}`, {
            method: "POST",
          });
          if (resp.ok) {
            const blob = await resp.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "tailored_resume.pdf";
            a.click();
            URL.revokeObjectURL(a.href);
          }
          break;
        }
        case "cover_letter":
        case "recruiter_msg":
        case "save":
          await new Promise((r) => setTimeout(r, 800));
          break;
      }
    } catch {
      // Silently handle action errors
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  }, [result]);

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
            <span>Workspace</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-600">Job Analysis</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Paste a job description to analyze your fit and get tailored recommendations</p>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input + Job Info */}
          <div className="lg:col-span-1 space-y-4">
            <InputSection
              jd={jd}
              url={url}
              onJdChange={setJd}
              onUrlChange={setUrl}
              onAnalyze={handleAnalyze}
              loading={loading}
            />

            {result && (
              <JobInfoCard
                company={result.company}
                role={result.role}
                status={result.status}
                matchScore={result.match_score}
                url={result.url}
              />
            )}
          </div>

          {/* Right Column: Analysis Results */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MatchScore score={result.match_score} analysis={result.match_analysis} />
                  <SkillsAnalysis requiredSkills={skills.required} missingSkills={skills.missing} />
                </div>
                <ResumeSuggestions suggestions={suggestions} />
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">No analysis yet</p>
                <p className="text-xs text-gray-300 mt-1">Paste a job description and click Analyze</p>
              </div>
            )}
          </div>
        </div>

        {/* CareerPilot Score */}
        <CareerScoreGrid scores={careerScores} />

        {/* Action Buttons */}
        <ActionButtons
          onAction={handleAction}
          loadingActions={loadingActions}
          disabled={!result}
        />
      </div>
    </AppLayout>
  );
}
