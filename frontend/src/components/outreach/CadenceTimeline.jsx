import { getUrgencyStyle, formatDueDate } from "./outreachUtils";

export default function CadenceTimeline({ events = [] }) {
  const past = events.filter((e) => e.kind !== "upcoming");
  const upcoming = events.filter((e) => e.kind === "upcoming");

  if (!events.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs text-gray-400 text-center py-4">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Outreach Timeline</h3>

      {upcoming.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Upcoming</p>
          <div className="space-y-2">
            {upcoming.map((e, i) => {
              const urg = getUrgencyStyle(e.meta?.urgency);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/30">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${urg.bg} ${urg.text}`}>{urg.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">{e.message}</p>
                    {e.meta?.due_at && (
                      <p className="text-[10px] text-gray-400">Due {formatDueDate(e.meta.due_at)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {past.slice(0, 8).map((e, i) => (
          <div key={e.id || i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.kind === "outreach_sent" ? "bg-emerald-500" : "bg-gray-300"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700">{e.message}</p>
              {e.created_at && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
