import { useState, useEffect } from "react";

function groupPersonas(personas) {
  const groups = {};
  for (const p of personas) {
    const category = p.persona_slug?.split("-")[0] || p.persona_name?.split(" ")[0] || "Other";
    const key = category.charAt(0).toUpperCase() + category.slice(1);
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export default function CareerPersonas({ personas = [], onGenerate, generating = false, hasProfile = false }) {
  const grouped = groupPersonas(personas);
  const tabs = Object.keys(grouped);
  const [activeTab, setActiveTab] = useState("");
  const [selectedPersona, setSelectedPersona] = useState(null);

  useEffect(() => {
    if (tabs.length && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs.join(","), activeTab]);

  const currentPersonas = grouped[activeTab] || [];

  if (!hasProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm text-gray-400">Upload a resume to generate career personas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Career Personas</h3>
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
          </svg>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating..." : personas.length ? "Regenerate" : "Generate Personas"}
        </button>
      </div>

      {personas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Click Generate to create AI career personas from your profile.</p>
      ) : (
        <>
          {tabs.length > 1 && (
            <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedPersona(null); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {currentPersonas.map((p, i) => (
              <button
                key={p.id || i}
                onClick={() => setSelectedPersona(selectedPersona === i ? null : i)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedPersona === i
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                    : "border-gray-100 hover:border-brand-200 hover:bg-gray-50"
                }`}
              >
                <p className="text-xs font-semibold text-gray-800">{p.persona_name}</p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{p.ai_summary}</p>
                <p className="text-[10px] text-brand-600 mt-2 font-medium">
                  {Math.round((p.match_confidence || 0) * 100)}% match
                </p>
              </button>
            ))}
          </div>

          {selectedPersona !== null && currentPersonas[selectedPersona] && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              {(() => {
                const p = currentPersonas[selectedPersona];
                return (
                  <>
                    <p className="text-xs font-semibold text-gray-800 mb-1">{p.persona_name}</p>
                    <p className="text-xs text-gray-500 mb-3">{p.ai_summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.highlighted_skills || []).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-[10px] font-medium">{s}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
