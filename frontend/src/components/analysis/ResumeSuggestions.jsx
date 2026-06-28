const priorityConfig = {
  high: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100/50", label: "High" },
  medium: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100/50", label: "Med" },
  low: { bg: "bg-figma-surface", text: "text-gray-500", border: "border-figma-hairline/50", label: "Low" },
};

export default function ResumeSuggestions({ suggestions = [] }) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-figma-hairline p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Resume Suggestions</h3>
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">Analyze a job to get tailored suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6 hover-lift">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Resume Suggestions</h3>
        <span className="text-[10px] text-gray-400">{suggestions.length} items</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const p = priorityConfig[s.priority] || priorityConfig.low;
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-figma-surface transition-all-smooth group"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                {i + 1}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed flex-1 group-hover:text-gray-900 transition-all-smooth">
                {s.text}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 border ${p.bg} ${p.text} ${p.border}`}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
