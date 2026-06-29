const techColors = {
  React: "bg-cyan-100 text-cyan-700", FastAPI: "bg-green-100 text-green-700",
  Python: "bg-blue-100 text-blue-700", JavaScript: "bg-amber-100 text-amber-700",
};

export default function ProjectCards({ projects = [] }) {
  if (!projects.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Projects</h3>
        <p className="text-sm text-gray-400">No projects parsed yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">Projects</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((p, i) => {
          const tech = p.tech || p.technologies || p.stack || [];
          return (
            <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">{p.title || p.name || "Project"}</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description || p.summary || ""}</p>
              {tech.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tech.map((t) => (
                    <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-medium ${techColors[t] || "bg-gray-100 text-gray-600"}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
