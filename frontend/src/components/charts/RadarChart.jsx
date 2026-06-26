const skills = [
  { label: "Python", value: 90 },
  { label: "React", value: 80 },
  { label: "SQL", value: 70 },
  { label: "Docker", value: 60 },
  { label: "AWS", value: 50 },
  { label: "Git", value: 85 },
];

const size = 200;
const cx = size / 2;
const cy = size / 2;
const maxR = 80;
const levels = 4;
const n = skills.length;

const angleStep = (2 * Math.PI) / n;

const getPoint = (index, radius) => {
  const angle = angleStep * index - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
};

const polygonPoints = skills
  .map((s, i) => {
    const r = (s.value / 100) * maxR;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  })
  .join(" ");

export default function RadarChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Skill Coverage</h3>
        <span className="text-xs text-gray-400">6 skills</span>
      </div>
      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid polygons */}
          {Array.from({ length: levels }, (_, l) => {
            const r = (maxR / levels) * (l + 1);
            const pts = Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, r);
              return `${p.x},${p.y}`;
            }).join(" ");
            return <polygon key={l} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
          })}

          {/* Axis lines */}
          {skills.map((_, i) => {
            const p = getPoint(i, maxR);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />;
          })}

          {/* Data polygon */}
          <polygon points={polygonPoints} fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" />

          {/* Data dots */}
          {skills.map((s, i) => {
            const r = (s.value / 100) * maxR;
            const p = getPoint(i, r);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />;
          })}

          {/* Labels */}
          {skills.map((s, i) => {
            const p = getPoint(i, maxR + 18);
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-500 text-[10px] font-medium"
              >
                {s.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
