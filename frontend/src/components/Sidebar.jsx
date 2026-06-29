import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAnalytics } from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
  { label: "Profile", path: "/profile", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
  { label: "Job Analysis", path: "/applications", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg> },
  { label: "Applications", path: "/kanban", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg> },
  { label: "Interview Prep", path: "/interview", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg> },
  { label: "Outreach", path: "/outreach", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg> },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ total: 0, interviews: 0, offers: 0, avgScore: 0 });

  useEffect(() => {
    getAnalytics()
      .then((data) => {
        setStats({
          total: data.total_applications || 0,
          interviews: data.interviews || 0,
          offers: data.offers || 0,
          avgScore: Math.round(data.avg_career_pilot_score || 0),
        });
      })
      .catch(() => { });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.email?.[0] || "U").toUpperCase();

  return (
    <aside
      className={`bg-white border-r border-figma-hairline flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${isCollapsed ? "w-16" : "w-60"
        }`}
    >
      {/* Brand Header */}
      {/* <div className={`flex items-center border-b border-gray-100 flex-shrink-0 ${isCollapsed ? "justify-center p-4" : "gap-3 px-5 py-4"}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 tracking-tight block">CareerPilot</span>
            <span className="text-[10px] text-gray-400 font-medium">AI Career Assistant</span>
          </div>
        )}
      </div> */}

      {/* Navigation */}
      <nav className={`flex-1 py-3 space-y-0.5 ${isCollapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl text-[13px] font-medium transition-all-smooth group ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:bg-figma-surface hover:text-gray-900"
                }`}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
                {isActive && (
                  <div className="absolute -left-1.5 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </div>
              {!isCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats Section */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-figma-hairline">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Quick Stats</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: stats.total, label: "App", color: "text-brand-600" },
              { value: stats.interviews, label: "Int", color: "text-emerald-600" },
              { value: stats.offers, label: "Off", color: "text-amber-600" },
              { value: `${stats.avgScore}%`, label: "Score", color: "text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-1.5 rounded-lg bg-figma-surface hover:bg-figma-hairline transition-all-smooth cursor-default">
                <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                <span className="text-[9px] text-gray-400 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className={`border-t border-figma-hairline ${isCollapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center rounded-xl text-[13px] text-gray-400 hover:bg-figma-surface hover:text-gray-600 transition-all-smooth ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
        >
          {isCollapsed ? (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <>
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-gray-500">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User Section (expanded) */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-figma-surface transition-all-smooth cursor-default">
            <div className="w-8 h-8 rounded-lg bg-figma-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">User</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email || "user@example.com"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all-smooth flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* User Section (collapsed) */}
      {isCollapsed && (
        <div className="px-2 pb-3 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-figma-primary flex items-center justify-center text-white text-[11px] font-bold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}
