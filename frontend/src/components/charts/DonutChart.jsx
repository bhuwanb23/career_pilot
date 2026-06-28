export default function DonutChart({ data = [], total = 0, loading = false }) {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = data.reduce((s, d) => s + d.value, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="w-32 h-4 rounded bg-gray-100 mb-4" />
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 rounded-full bg-gray-100" />
          <div className="space-y-2 flex-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 rounded bg-gray-100" />)}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0 || sum === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Status Breakdown</h3>
          <span className="text-xs text-gray-400">{total} total</span>
        </div>
        <div className="flex items-center justify-center h-40 text-xs text-gray-400">No data available</div>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Status Breakdown</h3>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {data.map((d, i) => {
              const pct = d.value / sum;
              const dashLen = circumference * pct;
              const dashOff = circumference - circumference * cumulative - dashLen;
              cumulative += pct;
              return (
                <circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={radius}
                  fill="none" stroke={d.color} strokeWidth={stroke}
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={dashOff} strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-gray-600 font-medium">{d.label}</span>
              <span className="text-[11px] font-bold text-gray-800 ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
