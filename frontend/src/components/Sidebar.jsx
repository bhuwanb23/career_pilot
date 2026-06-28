import { useNavigate, useLocation } from "react-router-dom";
import { MOCK_APPLICATIONS } from "../data/mockData";

const navItems = [
  { label: "Dashboard", path: "/", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
  { label: "Profile", path: "/profile", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
  { label: "Job Analysis", path: "/applications", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg> },
  { label: "Applications", path: "/kanban", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg> },
  { label: "Interview Prep", path: "/interview", icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg> },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  const stats = {
    total: MOCK_APPLICATIONS.length,
    interviews: MOCK_APPLICATIONS.filter((a) => a.status === "interview").length,
    offers: MOCK_APPLICATIONS.filter((a) => a.status === "offer").length,
    avgScore: Math.round(MOCK_APPLICATIONS.reduce((s, a) => s + (a.match_score || 0), 0) / MOCK_APPLICATIONS.length * 100),
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.email?.[0] || "U").toUpperCase();

  return (
    <aside
      className={`bg-white border-r border-[#e6e6e6] flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      <nav className={`flex-1 py-4 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-full text-sm transition-all duration-150 ${
                isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-4 py-2.5"
              } ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-[#f7f7f5] hover:text-black"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="flex-1 text-left font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-[#e6e6e6]">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2.5">Quick Stats</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: stats.total, label: "App" },
              { value: stats.interviews, label: "Int" },
              { value: stats.offers, label: "Off" },
              { value: `${stats.avgScore}%`, label: "Score" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-1.5 rounded-lg bg-[#f7f7f5] cursor-default">
                <span className="text-xs font-bold text-black">{s.value}</span>
                <span className="text-[9px] text-gray-400 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`border-t border-[#e6e6e6] ${isCollapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center rounded-full text-sm text-gray-400 hover:bg-[#f7f7f5] hover:text-black transition-all duration-150 ${
            isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-4 py-2.5"
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
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-full bg-[#f7f7f5] cursor-default">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">User</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email || "user@example.com"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#e6e6e6] hover:text-black transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="px-2 pb-3 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[11px] font-bold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#e6e6e6] hover:text-black transition-colors"
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
