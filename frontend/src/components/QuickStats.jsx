export default function QuickStats({ stats = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-figma-hairline p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-figma-surface" />
              <div className="w-16 h-5 rounded-full bg-figma-surface" />
            </div>
            <div className="w-12 h-8 rounded bg-figma-surface mb-1" />
            <div className="w-20 h-4 rounded bg-figma-surface" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white rounded-2xl border border-figma-hairline p-5 hover-lift fade-in"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              stat.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-figma-surface text-gray-500"
            }`}>
              {stat.trend}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
