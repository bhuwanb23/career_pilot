import { Link } from "react-router-dom";

function generateTasks(applications) {
  const tasks = [];

  const interviews = applications.filter((a) => a.status === "interview" || a.status === "assessment");
  interviews.slice(0, 2).forEach((a) => {
    tasks.push({
      title: `Interview prep for ${a.company}`,
      date: "Ready to practice",
      status: "active",
      color: "border-emerald-500",
      statusBg: "bg-emerald-50 text-emerald-600",
      href: `/interview?appId=${a.id}`,
    });
  });

  const applied = applications.filter((a) => a.status === "applied");
  applied.slice(0, 2).forEach((a) => {
    tasks.push({
      title: `Follow up with ${a.company}`,
      date: "Pending response",
      status: "pending",
      color: "border-brand-500",
      statusBg: "bg-amber-50 text-amber-600",
    });
  });

  if (tasks.length === 0) {
    tasks.push({
      title: "Analyze your first job",
      date: "Get started",
      status: "todo",
      color: "border-gray-400",
      statusBg: "bg-gray-100 text-gray-500",
    });
  }

  return tasks.slice(0, 4);
}

export default function UpcomingTasks({ applications = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-figma-hairline p-6 animate-pulse">
        <div className="w-28 h-4 rounded bg-figma-surface mb-5" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-figma-surface" />
          ))}
        </div>
      </div>
    );
  }

  const tasks = generateTasks(applications);

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6 hover-lift">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h3>
        <span className="text-[10px] text-gray-400">{tasks.length} items</span>
      </div>

      <div className="space-y-3">
        {tasks.map((t, i) => {
          const inner = (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.statusBg}`}>
                {t.status}
              </span>
            </>
          );

          if (t.href) {
            return (
              <Link
                key={i}
                to={t.href}
                className={`flex items-center gap-4 p-3.5 rounded-xl border-l-4 ${t.color} bg-figma-surface hover:bg-figma-hairline transition-all-smooth`}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border-l-4 ${t.color} bg-figma-surface hover:bg-figma-hairline transition-all-smooth cursor-pointer`}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
