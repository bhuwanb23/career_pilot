const tasks = [
  {
    title: "Follow up with Google recruiter",
    date: "Tomorrow",
    status: "pending",
    color: "border-brand-500",
    statusBg: "bg-amber-50 text-amber-600",
  },
  {
    title: "Interview at Meta",
    date: "Friday, 10:00 AM",
    status: "upcoming",
    color: "border-emerald-500",
    statusBg: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Update resume for Amazon",
    date: "Next week",
    status: "todo",
    color: "border-gray-400",
    statusBg: "bg-gray-100 text-gray-500",
  },
];

export default function UpcomingTasks() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h3>
        <button className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">View all</button>
      </div>

      <div className="space-y-3">
        {tasks.map((t, i) => (
          <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border-l-4 ${t.color} bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{t.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.statusBg}`}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
