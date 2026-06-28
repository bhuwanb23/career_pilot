export default function TaskCard({ task, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all-smooth ${
      task.completed
        ? "bg-figma-surface border-figma-hairline opacity-60"
        : "bg-white border-figma-hairline hover:border-brand-200"
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all-smooth ${
          task.completed
            ? "bg-brand-500 border-brand-500"
            : "border-gray-300 hover:border-brand-400"
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
          {task.text}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all-smooth flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
