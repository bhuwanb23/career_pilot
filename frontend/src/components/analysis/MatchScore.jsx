export default function MatchScore({ score = 0, analysis = "" }) {
  const percentage = Math.round(score * 100);
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score) * circumference;

  const getColor = (s) => {
    if (s >= 80) return { main: "#10b981", gradient: ["#10b981", "#34d399"] };
    if (s >= 60) return { main: "#f59e0b", gradient: ["#f59e0b", "#fbbf24"] };
    return { main: "#ef4444", gradient: ["#ef4444", "#f87171"] };
  };

  const colors = getColor(percentage);
  const gradientId = `match-grad-${Math.random().toString(36).slice(2, 6)}`;

  const getLabel = (s) => {
    if (s >= 80) return "Excellent Match";
    if (s >= 60) return "Good Match";
    if (s >= 40) return "Moderate Match";
    return "Low Match";
  };

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6 flex flex-col items-center hover-lift">
      <div className="w-full flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Match Score</h3>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          percentage >= 80 ? "bg-emerald-50 text-emerald-600" :
          percentage >= 60 ? "bg-amber-50 text-amber-600" :
          "bg-red-50 text-red-600"
        }`}>
          {getLabel(percentage)}
        </span>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="100%" stopColor={colors.gradient[1]} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}</span>
          <span className="text-[10px] text-gray-400 font-medium">out of 100</span>
        </div>
      </div>

      {analysis && (
        <div className="mt-4 w-full">
          <div className="p-3 rounded-xl bg-figma-surface">
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
