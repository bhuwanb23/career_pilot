export default function DecideStep({ data }) {
  const decisions = data?.decisions || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Final Decisions</h3>
      {decisions.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No decisions to make yet</p>
      ) : (
        <div className="space-y-3">
          {decisions.map((d, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{d.company}</h4>
                  <p className="text-[10px] text-gray-500">{d.role}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  d.verdict === "accepted" ? "bg-emerald-50 text-emerald-600" :
                  d.verdict === "declined" ? "bg-red-50 text-red-500" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {d.verdict}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 mb-1">Pros</p>
                  {d.pros.map((p, j) => (
                    <p key={j} className="text-[11px] text-gray-600 flex items-center gap-1">
                      <span className="text-emerald-500">+</span> {p}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-red-500 mb-1">Cons</p>
                  {d.cons.map((c, j) => (
                    <p key={j} className="text-[11px] text-gray-600 flex items-center gap-1">
                      <span className="text-red-400">-</span> {c}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
