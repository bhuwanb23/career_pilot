const PRIORITY_STYLES = {
  high: { bg: "bg-red-50", text: "text-red-600", label: "High" },
  medium: { bg: "bg-amber-50", text: "text-amber-600", label: "Medium" },
  low: { bg: "bg-gray-100", text: "text-gray-600", label: "Low" },
};

export default function AISuggestions({ suggestions = [] }) {
  if (!suggestions.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">AI Suggestions</h3>
        <span className="ml-auto text-[10px] text-gray-400">{suggestions.length} tips</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const priority = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.medium;
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0 ${priority.bg} ${priority.text}`}>
                {priority.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">{s.text}</p>
                {s.category && (
                  <span className="text-[9px] text-gray-400 mt-1 inline-block capitalize">{s.category}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
