function SmoothAreaChart({ data }) {
  const W = 400;
  const H = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const values = data.map((d) => d.value);
  const minData = Math.min(...values);
  const maxData = Math.max(...values);
  const range = maxData - minData || 1;
  const minVal = Math.max(0, minData - range * 0.1);
  const maxVal = maxData + range * 0.1;

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
  }));

  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (curr.x - prev.x) / 3;
      const cpy2 = curr.y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const linePath = smoothPath(points);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="area-grad-smooth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={pad.left} y1={pad.top + chartH * (1 - f)} x2={pad.left + chartW} y2={pad.top + chartH * (1 - f)} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={areaPath} fill="url(#area-grad-smooth)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#6366f1" strokeWidth="2" className="transition-all duration-200" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pad.left + (i / Math.max(data.length - 1, 1)) * chartW} y={H - 8} textAnchor="middle" className="fill-gray-400 text-[10px]">{d.month}</text>
      ))}
      {[0, 0.5, 1].map((f, i) => (
        <text key={i} x={pad.left - 8} y={pad.top + chartH * (1 - f) + 3} textAnchor="end" className="fill-gray-400 text-[10px]">{Math.round(minVal + (maxVal - minVal) * f)}</text>
      ))}
    </svg>
  );
}

export default function AreaChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="w-28 h-4 rounded bg-gray-100 mb-4" />
        <div className="w-full h-44 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Score Trend</h3>
        <span className="text-xs text-gray-400">Last 6 months</span>
      </div>
      {data.length > 0 ? (
        <SmoothAreaChart data={data} />
      ) : (
        <div className="flex items-center justify-center h-44 text-xs text-gray-400">No data available</div>
      )}
    </div>
  );
}
