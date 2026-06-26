const metrics = [
  { label: "Resume", score: 90, color: "#10b981" },
  { label: "Applications", score: 75, color: "#6366f1" },
  { label: "Interview", score: 68, color: "#f59e0b" },
  { label: "Networking", score: 54, color: "#ef4444" },
];

function ScoreRing({ score, size = 160, stroke = 12 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={stroke}
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

function MiniBar({ label, score, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function ScoreCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 self-start">
        <h3 className="text-sm font-semibold text-gray-900">CareerPilot Score</h3>
        <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs font-medium rounded-full">82/100</span>
      </div>

      <ScoreRing score={82} />

      <div className="w-full mt-6 space-y-3">
        {metrics.map((m) => (
          <MiniBar key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
