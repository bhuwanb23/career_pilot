export default function BarChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="w-40 h-4 rounded bg-gray-100 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-6 rounded bg-gray-100" />)}
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Applications by Company</h3>
        <span className="text-xs text-gray-400">Top {data.length}</span>
      </div>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 text-right font-medium truncate">{d.company}</span>
            <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out"
                style={{ width: `${(d.count / maxVal) * 100}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
