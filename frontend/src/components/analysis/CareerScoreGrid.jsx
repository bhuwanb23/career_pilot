const scores = [
  { label: "Fit", value: 92, color: "#10b981" },
  { label: "Timing", value: 74, color: "#6366f1" },
  { label: "Competition", value: 61, color: "#f59e0b" },
  { label: "Readiness", value: 90, color: "#8b5cf6" },
];

function MiniRing({ score, color, size = 80, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{score}</span>
      </div>
    </div>
  );
}

export default function CareerScoreGrid() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">CareerPilot Score</h3>
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {scores.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <MiniRing score={s.value} color={s.color} />
            <span className="text-xs font-medium text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
