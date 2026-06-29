const TECH_COLORS = {
  React: "bg-cyan-100 text-cyan-700", FastAPI: "bg-green-100 text-green-700",
  Python: "bg-blue-100 text-blue-700", JavaScript: "bg-amber-100 text-amber-700",
  Go: "bg-sky-100 text-sky-700", Docker: "bg-blue-100 text-blue-600",
  TypeScript: "bg-indigo-100 text-indigo-700", Node: "bg-emerald-100 text-emerald-700",
  SQL: "bg-purple-100 text-purple-700", PostgreSQL: "bg-blue-100 text-blue-700",
};

export default function ProjectCards({ profile }) {
  const projects = profile?.projects || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">Projects</h3>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-400">No projects listed yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">{p.name || p.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>
              {p.tech?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.tech.map((t, j) => (
                    <span key={j} className={`px-2 py-0.5 rounded text-[10px] font-medium ${TECH_COLORS[t] || "bg-gray-100 text-gray-600"}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
