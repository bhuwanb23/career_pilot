import { displayScore } from "./kanbanConstants";

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

function getScoreColor(scorePct) {
  if (scorePct >= 80) return "bg-emerald-50 text-emerald-600";
  if (scorePct >= 60) return "bg-amber-50 text-amber-600";
  return "bg-red-50 text-red-600";
}

const PRIORITY_BADGES = {
  high: "bg-red-100 text-red-600",
  low: "bg-slate-100 text-slate-500",
};

export default function KanbanCard({ application, onClick }) {
  const { company, role, created_at, priority, deadline } = application;
  const initials = (company || "?")[0].toUpperCase();
  const scorePct = displayScore(application);
  const scoreColor = getScoreColor(scorePct);

  const gradients = [
    "from-brand-500 to-brand-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-700",
    "from-purple-500 to-purple-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
  ];
  const gradientIdx = (company || "").charCodeAt(0) % gradients.length;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("application/id", String(application.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const deadlineSoon = deadline && new Date(deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick?.(application)}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradients[gradientIdx]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors flex-1">
              {company || "Unknown"}
            </h4>
            {priority && priority !== "normal" && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${PRIORITY_BADGES[priority] || ""}`}>
                {priority}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{role || "Unknown Role"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${scoreColor}`}>
          {scorePct}%
        </span>
        <div className="flex items-center gap-2">
          {deadlineSoon && (
            <span className="text-[9px] text-amber-600 font-medium">Due soon</span>
          )}
          <span className="text-[10px] text-gray-400">{getRelativeDate(created_at)}</span>
        </div>
      </div>
    </button>
  );
}
