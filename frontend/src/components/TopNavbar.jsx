import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { label: "Workspace", path: "/" },
  { label: "Pipeline", path: "/pipeline" },
  { label: "Approved", path: "/approved" },
];

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.email?.[0] || "U").toUpperCase();

  const activePath = location.pathname;

  return (
    <header className="h-11 bg-black flex items-center px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="text-sm font-medium text-white tracking-tight hidden md:block">CareerPilot</span>
      </div>

      <nav className="flex-1 flex items-center justify-center gap-6">
        {tabs.map((tab) => {
          const isActive = activePath === tab.path || (tab.path === "/" && activePath === "/");
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`text-xs tracking-tight transition-all duration-200 ${
                isActive
                  ? "text-white font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <button className="px-4 py-1.5 text-xs font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-colors">
          Sign in
        </button>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
}
