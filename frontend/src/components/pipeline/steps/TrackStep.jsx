const statusColors = {
  applied: "bg-brand-50 text-brand-600",
  screening: "bg-amber-50 text-amber-600",
  interview: "bg-emerald-50 text-emerald-600",
  offer: "bg-purple-50 text-purple-600",
  rejected: "bg-red-50 text-red-500",
};

export default function TrackStep({ data }) {
  const tracking = data?.tracking || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Application Tracking</h3>
      <div className="space-y-2">
        {tracking.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                {t.company[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.company}</p>
                <p className="text-[10px] text-gray-500">{t.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[t.status] || "bg-gray-100 text-gray-500"}`}>
                {t.status}
              </span>
              <span className="text-[9px] text-gray-400">{t.lastUpdate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
