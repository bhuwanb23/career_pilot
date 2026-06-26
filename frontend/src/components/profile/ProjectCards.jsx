const projects = [
  {
    title: "CareerPilot AI",
    description: "AI-powered career operating system. Chat-based interface for resume analysis, job matching, and interview prep.",
    tech: ["React", "FastAPI", "SQLite", "Ollama"],
    link: "#",
  },
  {
    title: "CloudDeploy CLI",
    description: "Command-line tool for one-click deployment to AWS, GCP, and Azure with automatic CI/CD pipeline generation.",
    tech: ["Go", "Docker", "Terraform"],
    link: "#",
  },
  {
    title: "RealTime Dashboard",
    description: "WebSocket-powered analytics dashboard with live charts, event streaming, and customizable widgets.",
    tech: ["Next.js", "D3.js", "Socket.io", "PostgreSQL"],
    link: "#",
  },
];

const techColors = {
  React: "bg-cyan-100 text-cyan-700",
  FastAPI: "bg-green-100 text-green-700",
  SQLite: "bg-blue-100 text-blue-700",
  Ollama: "bg-purple-100 text-purple-700",
  Go: "bg-sky-100 text-sky-700",
  Docker: "bg-blue-100 text-blue-600",
  Terraform: "bg-purple-100 text-purple-600",
  "Next.js": "bg-gray-100 text-gray-700",
  "D3.js": "bg-orange-100 text-orange-700",
  "Socket.io": "bg-gray-100 text-gray-600",
  PostgreSQL: "bg-blue-100 text-blue-700",
};

export default function ProjectCards() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
        <button className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">+ Add project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((p, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">{p.title}</h4>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-medium ${techColors[t] || "bg-gray-100 text-gray-600"}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
