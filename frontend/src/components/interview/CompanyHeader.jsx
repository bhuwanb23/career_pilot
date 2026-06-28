export default function CompanyHeader({ application, checklist = [] }) {
  if (!application) return null;

  const completed = checklist.filter((c) => c.checked).length;
  const total = checklist.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const gradients = [
    "from-brand-500 to-brand-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-700",
    "from-purple-500 to-purple-700",
    "from-rose-500 to-rose-700",
  ];
  const gradientIdx = (application.company || "").charCodeAt(0) % gradients.length;

  return (
    <div className={`bg-gradient-to-br ${gradients[gradientIdx]} rounded-2xl p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
            {application.company?.[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{application.company}</h2>
            <p className="text-sm text-white/80">{application.role}</p>
            <p className="text-xs text-white/60 mt-0.5">
              Applied {new Date(application.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="mb-2">
            <span className="text-3xl font-bold">{progress}%</span>
            <span className="text-sm text-white/70 ml-1">ready</span>
          </div>
          <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-white/60 mt-1">{completed}/{total} tasks completed</p>
        </div>
      </div>
    </div>
  );
}
