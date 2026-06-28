const statusConfig = {
  applied: { bg: "bg-brand-50", text: "text-brand-600", dot: "bg-brand-500", label: "Applied" },
  interview: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Interview" },
  offer: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Offer" },
  rejected: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Rejected" },
  screening: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Screening" },
};

export default function JobInfoCard({ company, role, status = "applied", matchScore, url }) {
  if (!company && !role) return null;

  const s = statusConfig[status] || statusConfig.applied;
  const scorePct = Math.round((matchScore || 0) * 100);

  const getScoreColor = (pct) => {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold shadow-sm">
            {company?.[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{company || "Unknown Company"}</h2>
            <p className="text-sm text-gray-500">{role || "Unknown Role"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {scorePct > 0 && (
            <div className="text-right">
              <p className={`text-2xl font-bold ${getScoreColor(scorePct)}`}>{scorePct}%</p>
              <p className="text-[10px] text-gray-400 font-medium">Match</p>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg}`}>
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
          </div>

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
