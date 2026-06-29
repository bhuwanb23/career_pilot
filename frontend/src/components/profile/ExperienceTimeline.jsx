export default function ExperienceTimeline({ experience = [] }) {
  if (!experience.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Experience</h3>
        <p className="text-sm text-gray-400">No experience entries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">Experience</h3>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
        <div className="space-y-6">
          {experience.map((exp, i) => {
            const bullets = exp.bullets || exp.highlights || exp.description
              ? (Array.isArray(exp.bullets || exp.highlights) ? (exp.bullets || exp.highlights) : [exp.description])
              : [];
            const period = exp.period || [exp.start, exp.end].filter(Boolean).join(" - ") || exp.dates || "";
            return (
              <div key={i} className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-brand-500" />
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-semibold text-gray-800">{exp.role || exp.title || "Role"}</p>
                  <p className="text-xs text-brand-600 font-medium mt-0.5">{exp.company || exp.organization || ""}</p>
                  {period && <p className="text-xs text-gray-400 mt-0.5">{period}</p>}
                  {bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {bullets.map((b, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-0.5">•</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
