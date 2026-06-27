const tabs = ["Workspace", "Pipeline", "Approved"];

export default function TopNavbar({ activeTab, onTabChange }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.email?.[0] || "U").toUpperCase();

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 flex-shrink-0">
      {/* Left: Logo + Heading */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-sm font-bold text-gray-900 tracking-tight hidden md:block">CareerPilot</span>
      </div>

      {/* Center: Tab Navigation */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab
                ? "text-brand-700 bg-brand-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Right: Profile */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
}
