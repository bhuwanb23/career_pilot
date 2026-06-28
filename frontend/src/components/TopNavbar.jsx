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
    <header className="h-14 bg-white border-b border-[#e6e6e6] flex items-center px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
          <span className="text-white text-xs font-bold">CP</span>
        </div>
        <span className="text-sm font-medium text-black tracking-tight hidden md:block">CareerPilot</span>
      </div>

      <nav className="flex-1 flex items-center justify-center gap-2">
        {tabs.map((tab) => {
          const isActive = activePath === tab.path || (tab.path === "/" && activePath === "/");
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-black border border-[#e6e6e6] hover:bg-[#f7f7f5]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <button className="px-4 py-2 text-sm font-medium rounded-full bg-white text-black border border-[#e6e6e6] hover:bg-[#f7f7f5] transition-colors">
          Sign in
        </button>
        <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
}
