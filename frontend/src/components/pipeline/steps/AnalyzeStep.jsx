export default function AnalyzeStep({ data }) {
  const analyses = data?.analyses || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Fit Analysis</h3>
      <div className="space-y-3">
        {analyses.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{a.company} — {a.role}</h4>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                a.fit >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}>
                {a.fit}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 mb-1">Strengths</p>
                {a.strengths.map((s, i) => (
                  <p key={i} className="text-[11px] text-gray-600 flex items-center gap-1">
                    <span className="text-emerald-500">+</span> {s}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-amber-600 mb-1">Gaps</p>
                {a.weaknesses.map((w, i) => (
                  <p key={i} className="text-[11px] text-gray-600 flex items-center gap-1">
                    <span className="text-amber-500">-</span> {w}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-brand-600 font-medium">{a.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
