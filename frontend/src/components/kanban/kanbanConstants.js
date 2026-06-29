export const STATUS_ALIASES = {
  saved: "draft",
  screening: "assessment",
};

export function normalizeStatus(status) {
  return STATUS_ALIASES[status] || status;
}

export const KANBAN_COLUMNS = [
  { key: "draft", title: "Draft" },
  { key: "applied", title: "Applied" },
  { key: "assessment", title: "Assessment" },
  { key: "interview", title: "Interview" },
  { key: "offer", title: "Offer" },
  { key: "rejected", title: "Rejected" },
  { key: "archived", title: "Archived" },
];

export const COLUMN_GROUPS = [
  {
    key: "active",
    label: "Active Pipeline",
    columns: ["draft", "applied", "assessment", "interview"],
  },
  {
    key: "outcomes",
    label: "Outcomes",
    columns: ["offer", "rejected", "archived"],
  },
];

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-600" },
  { value: "applied", label: "Applied", color: "bg-brand-50 text-brand-600" },
  { value: "assessment", label: "Assessment", color: "bg-amber-50 text-amber-600" },
  { value: "interview", label: "Interview", color: "bg-emerald-50 text-emerald-600" },
  { value: "offer", label: "Offer", color: "bg-purple-50 text-purple-600" },
  { value: "rejected", label: "Rejected", color: "bg-red-50 text-red-500" },
  { value: "archived", label: "Archived", color: "bg-slate-100 text-slate-500" },
];

export const STAGE_COLORS = {
  draft: { dot: "bg-gray-400", header: "text-gray-600", count: "bg-gray-100 text-gray-600" },
  applied: { dot: "bg-brand-500", header: "text-brand-600", count: "bg-brand-50 text-brand-600" },
  assessment: { dot: "bg-amber-500", header: "text-amber-600", count: "bg-amber-50 text-amber-600" },
  interview: { dot: "bg-emerald-500", header: "text-emerald-600", count: "bg-emerald-50 text-emerald-600" },
  offer: { dot: "bg-purple-500", header: "text-purple-600", count: "bg-purple-50 text-purple-600" },
  rejected: { dot: "bg-red-400", header: "text-red-500", count: "bg-red-50 text-red-500" },
  archived: { dot: "bg-slate-400", header: "text-slate-500", count: "bg-slate-100 text-slate-500" },
  saved: { dot: "bg-gray-400", header: "text-gray-600", count: "bg-gray-100 text-gray-600" },
  screening: { dot: "bg-amber-500", header: "text-amber-600", count: "bg-amber-50 text-amber-600" },
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "deadline_asc", label: "Upcoming deadlines" },
];

export function appMatchesColumn(app, columnKey) {
  return normalizeStatus(app.status) === columnKey;
}

export function displayScore(app) {
  if (app.score_overall > 0) return Math.round(app.score_overall);
  return Math.round((app.match_score || 0) * 100);
}
