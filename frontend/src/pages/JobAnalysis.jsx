import { useState } from "react";
import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import SkillsAnalysis from "../components/analysis/SkillsAnalysis";
import ResumeSuggestions from "../components/analysis/ResumeSuggestions";
import CareerScoreGrid from "../components/analysis/CareerScoreGrid";
import ActionButtons from "../components/analysis/ActionButtons";
import JobInfoCard from "../components/analysis/JobInfoCard";

const MOCK_ANALYSIS_RESULT = {
  id: 99,
  company: "Example Corp",
  role: "Senior Developer",
  status: "applied",
  match_score: 0.87,
  job_description: "We are looking for a Senior Developer with experience in React, TypeScript, and Node.js. The ideal candidate will have 5+ years of experience building scalable web applications.",
  cover_letter: "Dear Hiring Manager,\n\nI am excited to apply for the Senior Developer position at Example Corp. With over 6 years of experience building scalable web applications using React and TypeScript, I am confident in my ability to contribute to your team.\n\nIn my current role, I led the development of a microservices architecture that handles millions of requests daily. I am passionate about clean code, testing, and continuous improvement.\n\nI would love to bring my expertise in full-stack development to Example Corp.\n\nBest regards",
  recruiter_msg: "Hi, I'm a Senior Developer with 6+ years of experience in React and TypeScript. I noticed the Senior Developer role at Example Corp and wanted to express my strong interest. I've built scalable applications serving millions of users. Would love to discuss how my experience aligns with your needs.",
  match_analysis: "Strong match for this role. Your experience with React, TypeScript, and Node.js directly aligns with the requirements. Key strengths: React expertise, TypeScript proficiency, full-stack experience. Skills matched: React, TypeScript, Node.js, Git, REST APIs. Missing skills: GraphQL, AWS, Docker.",
  notes: "",
  url: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function computeCareerScores(matchScore) {
  const fit = Math.round((matchScore || 0) * 100);
  return [
    { label: "Fit", value: fit, color: "#10b981", description: "How well your profile matches" },
    { label: "Timing", value: 72, color: "#6366f1", description: "Application timing score" },
    { label: "Competition", value: 58, color: "#f59e0b", description: "Market competition level" },
    { label: "Readiness", value: 85, color: "#8b5cf6", description: "Interview readiness level" },
  ];
}

function parseSkillsFromAnalysis(analysis) {
  if (!analysis) return { required: [], missing: [] };
  const required = ["React", "TypeScript", "Node.js", "Git", "REST APIs"];
  const missing = ["GraphQL", "AWS", "Docker"];
  return { required, missing };
}

function parseSuggestionsFromAnalysis() {
  return [
    { text: "Strengthen your experience with role-specific keywords from the job description", priority: "high" },
    { text: "Add quantified achievements with metrics (e.g., 'reduced load time by 40%')", priority: "medium" },
    { text: "Tailor your professional summary to match this specific role", priority: "medium" },
    { text: "Ensure your most relevant projects are prominently featured", priority: "low" },
  ];
}

export default function JobAnalysis({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});

  const skills = parseSkillsFromAnalysis(result?.match_analysis);
  const suggestions = parseSuggestionsFromAnalysis();
  const careerScores = result ? computeCareerScores(result.match_score) : null;

  const handleAnalyze = () => {
    if (!jd.trim() && !url.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult({ ...MOCK_ANALYSIS_RESULT, job_description: jd || MOCK_ANALYSIS_RESULT.job_description });
      setLoading(false);
    }, 1000);
  };

  const handleAction = (actionKey) => {
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
    setTimeout(() => {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }, 800);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <InputSection jd={jd} url={url} onJdChange={setJd} onUrlChange={setUrl} onAnalyze={handleAnalyze} loading={loading} />
            {result && <JobInfoCard company={result.company} role={result.role} status={result.status} matchScore={result.match_score} url={result.url} />}
          </div>
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
                  <svg className="w-8 h-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-400">No analysis yet</p>
                <p className="text-xs text-gray-300 mt-1">Paste a job description and click Analyze</p>
              </div>
            )}
          </div>
        </div>

        <CareerScoreGrid scores={careerScores} />
        <ActionButtons onAction={handleAction} loadingActions={loadingActions} disabled={!result} />
      </div>
    </AppLayout>
  );
}
