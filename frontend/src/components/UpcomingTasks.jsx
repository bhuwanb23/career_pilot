import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOutreachDue } from "../services/api";
import { getUrgencyStyle, formatDueDate } from "./outreach/outreachUtils";

export default function UpcomingTasks({ applications = [], loading = false }) {
  const [dueItems, setDueItems] = useState([]);
  const [dueLoading, setDueLoading] = useState(true);

  useEffect(() => {
    getOutreachDue()
      .then((data) => setDueItems(data.items || []))
      .catch(() => setDueItems([]))
      .finally(() => setDueLoading(false));
  }, [applications.length]);

  if (loading || dueLoading) {
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

  const tasks = dueItems.slice(0, 4).map((item) => {
    const urg = getUrgencyStyle(item.urgency);
    const due = formatDueDate(item.next_due_at);
    return {
      title: `Follow up with ${item.company}`,
      date: due ? `Due ${due}` : urg.label,
      status: item.urgency,
      color: item.urgency === "overdue" ? "border-red-500" : "border-amber-500",
      statusBg: `${urg.bg} ${urg.text}`,
      href: `/outreach?appId=${item.application_id}`,
    };
  });

  if (tasks.length === 0) {
    const applied = applications.filter((a) => a.status === "applied");
    applied.slice(0, 2).forEach((a) => {
      tasks.push({
        title: `Track outreach for ${a.company}`,
        date: "No urgent follow-ups",
        status: "waiting",
        color: "border-brand-500",
        statusBg: "bg-blue-50 text-blue-600",
        href: `/outreach?appId=${a.id}`,
      });
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: "Analyze your first job",
      date: "Get started",
      status: "todo",
      color: "border-gray-400",
      statusBg: "bg-gray-100 text-gray-500",
    });
  }

  const displayTasks = tasks.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-6 hover-lift">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h3>
        <span className="text-[10px] text-gray-400">{displayTasks.length} items</span>
      </div>

      <div className="space-y-3">
        {displayTasks.map((t, i) => {
          const inner = (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${t.statusBg}`}>
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
            <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border-l-4 ${t.color} bg-figma-surface`}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
