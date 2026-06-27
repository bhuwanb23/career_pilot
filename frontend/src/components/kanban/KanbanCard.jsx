function getRelativeDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getScoreColor(score) {
  const pct = Math.round(score * 100);
  if (pct >= 80) return "bg-emerald-50 text-emerald-600";
  if (pct >= 60) return "bg-amber-50 text-amber-600";
  return "bg-red-50 text-red-600";
}

export default function KanbanCard({ application, onClick }) {
  const { company, role, match_score, created_at, url } = application;
  const initials = (company || "?")[0].toUpperCase();
  const scorePct = Math.round((match_score || 0) * 100);
  const scoreColor = getScoreColor(match_score);

  const gradients = [
    "from-brand-500 to-brand-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-700",
    "from-purple-500 to-purple-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
  ];
  const gradientIdx = (company || "").charCodeAt(0) % gradients.length;

  return (
    <button
      onClick={() => onClick?.(application)}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradients[gradientIdx]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
            {company || "Unknown"}
          </h4>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{role || "Unknown Role"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${scoreColor}`}>
          {scorePct}%
        </span>
        <span className="text-[10px] text-gray-400">{getRelativeDate(created_at)}</span>
      </div>
    </button>
  );
}
