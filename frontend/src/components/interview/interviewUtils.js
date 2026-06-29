const QUESTION_CATEGORIES = ["hr", "technical", "behavioral", "role", "company"];

const CATEGORY_LABELS = {
  hr: "HR",
  technical: "Technical",
  behavioral: "Behavioral",
  role: "Role",
  company: "Company",
};

const CATEGORY_COLORS = {
  hr: { bg: "bg-blue-50", text: "text-blue-600" },
  technical: { bg: "bg-emerald-50", text: "text-emerald-600" },
  behavioral: { bg: "bg-purple-50", text: "text-purple-600" },
  role: { bg: "bg-amber-50", text: "text-amber-600" },
  company: { bg: "bg-rose-50", text: "text-rose-600" },
};

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "General";
}

export function getCategoryColors(category) {
  return CATEGORY_COLORS[category] || { bg: "bg-gray-100", text: "text-gray-600" };
}

export function groupQuestionsByCategory(questions = []) {
  const groups = {};
  for (const q of questions) {
    const cat = q.category && QUESTION_CATEGORIES.includes(q.category) ? q.category : "behavioral";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(q);
  }
  return Object.entries(groups).map(([category, items]) => ({
    category,
    label: getCategoryLabel(category),
    questions: items,
  }));
}

export function buildChecklistFromPrep(prepNotes = {}, checkedIds = new Set()) {
  const items = prepNotes.checklist || [];
  return items.map((text, i) => ({
    id: `check-${i}`,
    text: typeof text === "string" ? text : String(text),
    category: inferChecklistCategory(text),
    checked: checkedIds.has(`check-${i}`),
  }));
}

function inferChecklistCategory(text) {
  const lower = String(text).toLowerCase();
  if (lower.includes("resume") || lower.includes("cv")) return "Resume";
  if (lower.includes("star") || lower.includes("story")) return "STAR";
  if (lower.includes("question")) return "Questions";
  if (lower.includes("research") || lower.includes("company")) return "Research";
  return "General";
}

export function normalizePrepForView(prep) {
  if (!prep) return null;
  return {
    ...prep,
    company_intel: prep.company_intel || {},
    prep_notes: prep.prep_notes || {},
    ai_suggestions: prep.ai_suggestions || [],
    questions: prep.questions || [],
    star_answers: prep.star_answers || [],
  };
}

export function dashboardItemToApplication(item) {
  return {
    id: item.application_id,
    company: item.company,
    role: item.role,
    status: item.status,
    score_overall: item.score_overall,
    interview_at: item.interview_at,
    has_prep: item.has_prep,
    prep_created_at: item.prep_created_at,
  };
}
