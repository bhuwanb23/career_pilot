import { useState } from "react";
import { getCategoryColors, getCategoryLabel, groupQuestionsByCategory } from "./interviewUtils";

function QuestionItem({ question, answer, index, isOpen, onToggle, category }) {
  const colors = category ? getCategoryColors(category) : null;

  return (
    <div className={`border rounded-xl transition-all duration-200 ${isOpen ? "border-brand-200 bg-brand-50/30" : "border-gray-100 hover:border-gray-200"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${isOpen ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
          {index + 1}
        </div>
        <span className={`text-sm font-medium flex-1 ${isOpen ? "text-brand-700" : "text-gray-700"}`}>
          {question}
        </span>
        {colors && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${colors.bg} ${colors.text}`}>
            {getCategoryLabel(category)}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-10">
            <div className="p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionAccordion({ questions = [], groupByCategory = false }) {
  const [openKey, setOpenKey] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = groupByCategory ? groupQuestionsByCategory(questions) : null;
  const flatQuestions = groupByCategory
    ? categories.flatMap((g) => g.questions.map((q) => ({ ...q, _group: g.category })))
    : questions;

  const filtered = filterCategory === "all"
    ? flatQuestions
    : flatQuestions.filter((q) => (q.category || q._group || "behavioral") === filterCategory);

  const uniqueCategories = [...new Set(flatQuestions.map((q) => q.category || q._group || "behavioral"))];

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Interview Questions</h3>
          <span className="ml-auto text-[10px] text-gray-400">0 questions</span>
        </div>
        <p className="text-xs text-gray-400 text-center py-6">No questions generated yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Interview Questions</h3>
        <span className="ml-auto text-[10px] text-gray-400">{questions.length} questions</span>
      </div>

      {groupByCategory && uniqueCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${filterCategory === "all" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All
          </button>
          {uniqueCategories.map((cat) => {
            const colors = getCategoryColors(cat);
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${filterCategory === cat ? `${colors.bg} ${colors.text}` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((q, i) => {
          const key = `${q.question}-${i}`;
          return (
            <QuestionItem
              key={key}
              question={q.question}
              answer={q.answer}
              index={i}
              category={q.category || q._group}
              isOpen={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
            />
          );
        })}
      </div>
    </div>
  );
}
