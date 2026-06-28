export default function LineChart({ data = [], loading = false }) {
  const W = 400;
  const H = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="w-40 h-4 rounded bg-gray-100 mb-4" />
        <div className="w-full h-44 rounded bg-gray-100" />
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - (d.value / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Applications Over Time</h3>
        <span className="text-xs text-gray-400">Last 8 weeks</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={pad.left} y1={pad.top + chartH * (1 - f)} x2={pad.left + chartW} y2={pad.top + chartH * (1 - f)} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#line-grad)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
        ))}
        {data.map((d, i) => (
          <text key={i} x={pad.left + (i / Math.max(data.length - 1, 1)) * chartW} y={H - 8} textAnchor="middle" className="fill-gray-400 text-[10px]">{d.week}</text>
        ))}
        {[0, 0.5, 1].map((f, i) => (
          <text key={i} x={pad.left - 8} y={pad.top + chartH * (1 - f) + 3} textAnchor="end" className="fill-gray-400 text-[10px]">{Math.round(maxVal * f)}</text>
        ))}
      </svg>
    </div>
  );
}
