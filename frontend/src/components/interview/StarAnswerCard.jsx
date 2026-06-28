import { useState } from "react";

const starConfig = [
  { key: "situation", label: "Situation", color: "brand", bg: "bg-brand-50", text: "text-brand-600", border: "border-brand-100" },
  { key: "task", label: "Task", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  { key: "action", label: "Action", color: "amber", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  { key: "result", label: "Result", color: "purple", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
];

function StarSection({ config, content }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content && content.length > 150;

  return (
    <div className={`rounded-xl border ${config.border} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>
      <p className={`text-[11px] text-gray-600 leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-brand-500 font-medium mt-1 hover:text-brand-600"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function StarAnswerCard({ answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            STAR Answer {index + 1}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {answer.situation?.slice(0, 60)}...
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-3">
          {starConfig.map((config) => (
            <StarSection
              key={config.key}
              config={config}
              content={answer[config.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
