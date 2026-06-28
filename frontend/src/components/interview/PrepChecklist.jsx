const categoryColors = {
  Research: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  Resume: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  Questions: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  STAR: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  General: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-500" },
};

function ChecklistItem({ item, onToggle }) {
  const cat = categoryColors[item.category] || categoryColors.General;

  return (
    <div className="flex items-center gap-3 py-2 group">
      <button
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          item.checked
            ? "bg-brand-500 border-brand-500"
            : "border-gray-300 group-hover:border-brand-400"
        }`}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>
      <span className={`text-xs flex-1 ${item.checked ? "text-gray-400 line-through" : "text-gray-700"}`}>
        {item.text}
      </span>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${cat.bg} ${cat.text}`}>
        {item.category}
      </span>
    </div>
  );
}

export default function PrepChecklist({ checklist = [], onToggle }) {
  const completed = checklist.filter((c) => c.checked).length;
  const total = checklist.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const categories = [...new Set(checklist.map((c) => c.category))];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Preparation Checklist</h3>
        </div>
        <span className="text-[10px] text-gray-400">{completed}/{total}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{progress}% complete</p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-0.5">
        {checklist.map((item) => (
          <ChecklistItem key={item.id} item={item} onToggle={onToggle} />
        ))}
      </div>

      {/* Category Legend */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const c = categoryColors[cat] || categoryColors.General;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              <span className="text-[9px] text-gray-400">{cat}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
