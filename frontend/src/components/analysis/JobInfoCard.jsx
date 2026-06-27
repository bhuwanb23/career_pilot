const statusConfig = {
  applied: { bg: "bg-brand-50", text: "text-brand-600", dot: "bg-brand-500" },
  interview: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  offer: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  rejected: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  screening: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
};

export default function JobInfoCard({ company, role, status = "applied", matchScore, url }) {
  if (!company && !role) return null;

  const s = statusConfig[status] || statusConfig.applied;
  const scorePct = Math.round((matchScore || 0) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {company?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{company || "Unknown Company"}</h4>
            <p className="text-xs text-gray-500 truncate">{role || "Unknown Role"}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg} flex-shrink-0`}>
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-[10px] font-medium ${s.text}`}>{status}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
        {scorePct > 0 && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" />
            </svg>
            <span className="text-[11px] text-gray-500">
              Match <span className="font-semibold text-gray-700">{scorePct}%</span>
            </span>
          </div>
        )}

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-brand-600 hover:text-brand-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            View posting
          </a>
        )}
      </div>
    </div>
  );
}
