const defaultScores = [
  { label: "Fit", value: 0, color: "#10b981", description: "How well your profile matches" },
  { label: "Timing", value: 0, color: "#6366f1", description: "Application timing score" },
  { label: "Competition", value: 0, color: "#f59e0b", description: "Market competition level" },
  { label: "Readiness", value: 0, color: "#8b5cf6", description: "Interview readiness level" },
];

function CircularGauge({ score, color, size = 100, stroke = 8, label, description }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradientId = `gauge-${label}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#f3f4f6" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score > 0 ? (
            <>
              <span className="text-xl font-bold text-gray-900">{score}</span>
              <span className="text-[9px] text-gray-400 font-medium">/100</span>
            </>
          ) : (
            <span className="text-lg text-gray-300 font-medium">—</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-900">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[100px]">{description}</p>
      </div>
    </div>
  );
}

export default function CareerScoreGrid({ scores }) {
  const items = scores || defaultScores;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-sm font-semibold text-gray-900">CareerPilot Score</h3>
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {items.map((s) => (
          <CircularGauge
            key={s.label}
            score={s.value}
            color={s.color}
            label={s.label}
            description={s.description}
          />
        ))}
      </div>
    </div>
  );
}
