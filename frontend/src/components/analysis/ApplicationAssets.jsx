import { useState } from "react";

const tabs = [
  { key: "cover", label: "Cover Letter" },
  { key: "recruiter", label: "Recruiter Message" },
  { key: "recommendations", label: "Recommendations" },
];

export default function ApplicationAssets({ coverLetter, recruiterMsg, recommendations = [] }) {
  const [activeTab, setActiveTab] = useState("cover");

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Application Package</h3>
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "cover" && (
        <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
          {coverLetter || "No cover letter yet. Click Generate Cover Letter above."}
        </div>
      )}

      {activeTab === "recruiter" && (
        <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
          {recruiterMsg || "No recruiter message yet. Click Recruiter Message above."}
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="space-y-2">
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-400">No recommendations available.</p>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-gray-50">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  rec.priority === "high" ? "bg-red-400" : rec.priority === "medium" ? "bg-amber-400" : "bg-gray-300"
                }`} />
                <p className="text-xs text-gray-700 leading-relaxed">{rec.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
