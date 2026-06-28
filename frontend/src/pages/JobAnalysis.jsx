import { useState } from "react";
import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import { RequiredSkills, MissingSkills } from "../components/analysis/SkillsAnalysis";
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
    { label: "Fit", value: fit, color: "#10b981", description: "Profile match" },
    { label: "Timing", value: 72, color: "#6366f1", description: "Timing score" },
    { label: "Competition", value: 58, color: "#f59e0b", description: "Competition level" },
    { label: "Readiness", value: 85, color: "#8b5cf6", description: "Interview ready" },
  ];
}

function parseSkillsFromAnalysis() {
  return {
    required: ["React", "TypeScript", "Node.js", "Git", "REST APIs"],
    missing: ["GraphQL", "AWS", "Docker"],
  };
}

function parseSuggestionsFromAnalysis() {
  return [
    { text: "Strengthen experience with role-specific keywords from the job description", priority: "high" },
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

  const skills = parseSkillsFromAnalysis();
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#f7f7f5] rounded-3xl p-10">
          <h1 className="text-4xl font-light text-black tracking-tight mb-2">Job Analysis</h1>
          <p className="text-lg text-gray-500 font-light">Paste a job description to analyze your fit</p>
        </div>

        {/* Input Section - Full Width */}
        <InputSection jd={jd} url={url} onJdChange={setJd} onUrlChange={setUrl} onAnalyze={handleAnalyze} loading={loading} />

        {/* Results Section */}
        {result ? (
          <>
            {/* Job Info Header - Full Width */}
            <JobInfoCard company={result.company} role={result.role} status={result.status} matchScore={result.match_score} url={result.url} />

            {/* 4-Column Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MatchScore score={result.match_score} analysis={result.match_analysis} />
              <RequiredSkills skills={skills.required} />
              <MissingSkills skills={skills.missing} />
              <ResumeSuggestions suggestions={suggestions} />
            </div>

            {/* CareerPilot Score */}
            <CareerScoreGrid scores={careerScores} />

            {/* Action Buttons */}
            <ActionButtons onAction={handleAction} loadingActions={loadingActions} disabled={!result} />
          </>
        ) : (
          <div className="bg-white border border-[#e6e6e6] rounded-3xl p-16 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#f7f7f5] flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500 mb-1">No analysis yet</p>
            <p className="text-sm text-gray-400">Paste a job description above and click Analyze</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
