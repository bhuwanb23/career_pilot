function buildCareerScores(result) {
  if (!result) return null;
  return [
    { label: "Fit", value: Math.round(result.score_fit || 0), color: "#10b981", description: "Profile match" },
    { label: "Timing", value: Math.round(result.score_timing || 0), color: "#6366f1", description: "Timing score" },
    { label: "Competition", value: Math.round(result.score_competition || 0), color: "#f59e0b", description: "Competition level" },
    { label: "Readiness", value: Math.round(result.score_readiness || 0), color: "#8b5cf6", description: "Interview ready" },
  ];
}

function getSkillsFromResult(result) {
  const report = result?.match_report || {};
  return {
    required: report.matched_skills || [],
    missing: report.missing_skills || [],
  };
}

function getSuggestionsFromResult(result) {
  const recs = result?.recommendations || [];
  return recs.map((r) => ({ text: r.text, priority: r.priority || "medium" }));
}
