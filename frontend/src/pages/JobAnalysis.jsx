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
      {/* Hero Section - Dark */}
      <div className="bg-[#272729] py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-semibold text-white tracking-tight mb-4" style={{ letterSpacing: "-0.28px" }}>Job Analysis</h1>
          <p className="text-xl text-white/70" style={{ lineHeight: "1.47" }}>Paste a job description to analyze your fit</p>
        </div>
      </div>

      {/* Input Section - Light */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <InputSection jd={jd} url={url} onJdChange={setJd} onUrlChange={setUrl} onAnalyze={handleAnalyze} loading={loading} />
        </div>
      </div>

      {/* Results Section - Parchment */}
      {result ? (
        <div className="bg-[#f5f5f7] py-16 px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <JobInfoCard company={result.company} role={result.role} status={result.status} matchScore={result.match_score} url={result.url} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MatchScore score={result.match_score} analysis={result.match_analysis} />
              <RequiredSkills skills={skills.required} />
              <MissingSkills skills={skills.missing} />
              <ResumeSuggestions suggestions={suggestions} />
            </div>

            <CareerScoreGrid scores={careerScores} />

            <ActionButtons onAction={handleAction} loadingActions={loadingActions} disabled={!result} />
          </div>
        </div>
      ) : (
        <div className="bg-[#f5f5f7] py-16 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-[#e0e0e0] rounded-2xl p-16 flex flex-col items-center justify-center">
              <p className="text-lg text-[#1d1d1f]/60 mb-1">No analysis yet</p>
              <p className="text-sm text-[#1d1d1f]/40">Paste a job description above and click Analyze</p>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
