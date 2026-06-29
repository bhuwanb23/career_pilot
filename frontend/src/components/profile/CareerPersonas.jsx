import { useState } from "react";
import { personasAPI } from "../../services/api";

const CATEGORY_ICONS = {
  backend: "M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6",
  frontend: "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z",
  fullstack: "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z",
  ai: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  data: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375",
};

function getCategoryKey(name) {
  const lower = name.toLowerCase();
  if (lower.includes("backend")) return "backend";
  if (lower.includes("frontend")) return "frontend";
  if (lower.includes("full")) return "fullstack";
  if (lower.includes("ai") || lower.includes("ml")) return "ai";
  if (lower.includes("data")) return "data";
  return "backend";
}

export default function CareerPersonas({ personas = [], onRefresh }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await personasAPI.generate();
      onRefresh?.();
    } catch (err) {
      console.error("Persona generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Career Personas</h3>
        <button onClick={handleGenerate} disabled={generating}
          className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-all disabled:opacity-50">
          {generating ? "Generating..." : "Generate Personas"}
        </button>
      </div>

      {personas.length === 0 ? (
        <p className="text-sm text-gray-400">No personas generated yet. Click "Generate Personas" to create career direction analyses.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona, i) => {
            const catKey = getCategoryKey(persona.persona_name);
            const confidence = Math.round((persona.match_confidence || 0) * 100);
            return (
              <div key={persona.id || i}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedIdx === i ? "border-brand-400 bg-brand-50 shadow-sm" : "border-gray-100 hover:border-brand-200 hover:shadow-sm"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORY_ICONS[catKey] || CATEGORY_ICONS.backend} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{persona.persona_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${confidence >= 70 ? "text-emerald-600" : confidence >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {confidence}% match
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{persona.ai_summary}</p>
                {persona.highlighted_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {persona.highlighted_skills.slice(0, 4).map((s, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600">{s}</span>
                    ))}
                  </div>
                )}
                {selectedIdx === i && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                    {persona.missing_skills?.length > 0 && (
                      <div>
                        <p className="font-medium text-red-600 mb-1">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {persona.missing_skills.map((s, j) => (
                            <span key={j} className="px-2 py-0.5 rounded bg-red-50 text-red-600">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {persona.suggested_focus?.length > 0 && (
                      <div>
                        <p className="font-medium text-blue-600 mb-1">Suggested Focus</p>
                        <ul className="space-y-0.5">
                          {persona.suggested_focus.map((f, j) => (
                            <li key={j} className="text-gray-500">- {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
