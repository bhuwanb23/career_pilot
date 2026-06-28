export default function RadarChart({ skills = [], loading = false }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;
  const levels = 5;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="w-28 h-4 rounded bg-gray-100 mb-4" />
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-full bg-gray-100" />
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Skill Coverage</h3>
        </div>
        <div className="flex items-center justify-center h-44 text-xs text-gray-400">No skills data</div>
      </div>
    );
  }

  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (index, radius) => {
    const angle = angleStep * index - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const polygonPoints = skills.map((s, i) => {
    const r = (s.value / 100) * maxR;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Skill Coverage</h3>
        <span className="text-xs text-gray-400">{n} skills</span>
      </div>
      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {Array.from({ length: levels }, (_, l) => {
            const r = (maxR / levels) * (l + 1);
            const pts = Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, r);
              return `${p.x},${p.y}`;
            }).join(" ");
            return <polygon key={l} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.8" />;
          })}
          {skills.map((_, i) => {
            const p = getPoint(i, maxR);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="0.8" />;
          })}
          <polygon points={polygonPoints} fill="url(#radar-fill)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
          {skills.map((s, i) => {
            const r = (s.value / 100) * maxR;
            const p = getPoint(i, r);
            return <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />;
          })}
          {skills.map((s, i) => {
            const p = getPoint(i, maxR + 20);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-[10px] font-medium">
                {s.skill}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
