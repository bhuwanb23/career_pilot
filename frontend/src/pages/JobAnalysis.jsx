import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import { RequiredSkills, MissingSkills } from "../components/analysis/SkillsAnalysis";
import ResumeSuggestions from "../components/analysis/ResumeSuggestions";
import CareerScoreGrid from "../components/analysis/CareerScoreGrid";
import ActionButtons from "../components/analysis/ActionButtons";
import JobInfoCard from "../components/analysis/JobInfoCard";
import {
  analyzeJob,
  generateCoverLetter,
  generateResumePdf,
  updateApplication,
} from "../services/api";

function computeCareerScores(matchScore) {
  const fit = Math.round((matchScore || 0) * 100);
  return [
    { label: "Fit", value: fit, color: "#10b981", description: "Profile match" },
    { label: "Timing", value: Math.min(95, fit + 5), color: "#6366f1", description: "Timing score" },
    { label: "Competition", value: Math.max(30, 100 - fit + 20), color: "#f59e0b", description: "Competition level" },
    { label: "Readiness", value: Math.min(95, fit + 10), color: "#8b5cf6", description: "Interview ready" },
  ];
}

function parseSkillsFromAnalysis(analysisText) {
  const required = [];
  const missing = [];
  if (!analysisText) return { required, missing };

  const matchedMatch = analysisText.match(/Skills matched[:\s]+([^.]+)/i);
  const missingMatch = analysisText.match(/Missing skills[:\s]+([^.]+)/i);
  if (matchedMatch) required.push(...matchedMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean));
  if (missingMatch) missing.push(...missingMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean));

  if (!required.length && !missing.length) {
    const words = analysisText.match(/\b[A-Z][a-zA-Z+#.]+\b/g) || [];
    return { required: words.slice(0, 5), missing: words.slice(5, 8) };
  }
  return { required, missing };
}

function parseSuggestionsFromAnalysis(analysisText, matchScore) {
  const suggestions = [];
  if (matchScore < 0.7) {
    suggestions.push({ text: "Strengthen experience with role-specific keywords from the job description", priority: "high" });
  }
  suggestions.push(
    { text: "Add quantified achievements with metrics (e.g., 'reduced load time by 40%')", priority: "medium" },
    { text: "Tailor your professional summary to match this specific role", priority: "medium" },
  );
  if (analysisText?.includes("Missing")) {
    suggestions.push({ text: "Address missing skills in your resume or cover letter", priority: "high" });
  }
  return suggestions;
}

export default function JobAnalysis({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [error, setError] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  const skills = result ? parseSkillsFromAnalysis(result.match_analysis) : { required: [], missing: [] };
  const suggestions = result ? parseSuggestionsFromAnalysis(result.match_analysis, result.match_score) : [];
  const careerScores = result ? computeCareerScores(result.match_score) : null;

  const handleAnalyze = async () => {
    if (!jd.trim() && !url.trim()) return;
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const data = await analyzeJob(jd, url);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionKey) => {
    if (!result) return;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
    setError(null);
    try {
      switch (actionKey) {
        case "tailor_resume": {
          const blob = await generateResumePdf(result.job_description);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "tailored-resume.pdf";
          a.click();
          setActionResult("Tailored resume downloaded.");
          break;
        }
        case "cover_letter": {
          const data = await generateCoverLetter(result.id);
          setResult((prev) => ({ ...prev, cover_letter: data.cover_letter }));
          setActionResult("Cover letter generated.");
          break;
        }
        case "recruiter_msg":
          setActionResult(result.recruiter_msg ? "Recruiter message is ready in the analysis." : "Recruiter message included in analysis.");
          break;
        case "save": {
          await updateApplication(result.id, { status: "saved" });
          setResult((prev) => ({ ...prev, status: "saved" }));
          setActionResult("Application saved to tracker.");
          break;
        }
        default:
          break;
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
            <span>Workspace</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            <span className="text-gray-600">Job Analysis</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Paste a job description to analyze your fit and get tailored recommendations</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}
        {actionResult && (
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">{actionResult}</div>
        )}

        <InputSection jd={jd} url={url} onJdChange={setJd} onUrlChange={setUrl} onAnalyze={handleAnalyze} loading={loading} />

        {result ? (
          <>
            <JobInfoCard company={result.company} role={result.role} status={result.status} matchScore={result.match_score} url={result.url} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MatchScore score={result.match_score} analysis={result.match_analysis} />
              <RequiredSkills skills={skills.required} />
              <MissingSkills skills={skills.missing} />
              <ResumeSuggestions suggestions={suggestions} />
            </div>
            <CareerScoreGrid scores={careerScores} />
            <ActionButtons onAction={handleAction} loadingActions={loadingActions} disabled={!result} />
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-figma-hairline p-16 flex flex-col items-center justify-center hover-lift">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-500 mb-1">No analysis yet</p>
            <p className="text-sm text-gray-400">Paste a job description above and click Analyze</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
