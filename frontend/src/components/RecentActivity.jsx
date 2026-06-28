export default function RecentActivity({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-figma-hairline p-6 animate-pulse">
        <div className="w-28 h-4 rounded bg-figma-surface mb-5" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-figma-surface" />
              <div className="flex-1">
                <div className="h-4 rounded bg-figma-surface mb-1 w-3/4" />
                <div className="h-3 rounded bg-figma-surface w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const empty = activities.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6 hover-lift">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        {!empty && <span className="text-[10px] text-gray-400">{activities.length} items</span>}
      </div>

      {empty ? (
        <div className="text-center py-8">
          <p className="text-xs text-gray-400">No activity yet. Start by analyzing a job!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                {i < activities.length - 1 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-figma-hairline" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm text-gray-700 font-medium">{a.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
