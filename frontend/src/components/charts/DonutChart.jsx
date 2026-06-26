const data = [
  { label: "Applied", value: 40, color: "#6366f1" },
  { label: "Interview", value: 25, color: "#10b981" },
  { label: "Screening", value: 10, color: "#f59e0b" },
  { label: "Offer", value: 10, color: "#8b5cf6" },
  { label: "Rejected", value: 15, color: "#ef4444" },
];

const total = data.reduce((s, d) => s + d.value, 0);
const size = 160;
const stroke = 24;
const radius = (size - stroke) / 2;
const circumference = 2 * Math.PI * radius;

export default function DonutChart() {
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
              const pct = d.value / total;
              const dashLen = circumference * pct;
              const dashOff = circumference - circumference * cumulative - dashLen;
              cumulative += pct;
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={dashOff}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}%</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-gray-600">{d.label}</span>
              <span className="text-xs font-semibold text-gray-800 ml-auto">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
