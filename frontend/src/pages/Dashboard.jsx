import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { MOCK_APPLICATIONS, MOCK_PROFILE } from "../data/mockData";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email?.split("@")[0] || "there";
  } catch {
    return "there";
  }
}

export default function Dashboard({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const navigate = useNavigate();
  const applications = MOCK_APPLICATIONS;
  const profile = MOCK_PROFILE;

  const totalApps = applications.length;
  const interviewCount = applications.filter((a) => a.status === "interview").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;
  const avgScore = totalApps > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.match_score || 0), 0) / totalApps * 100)
    : 0;

  const userName = getFirstName();
  const greeting = getGreeting();

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      {/* Hero Section - Dark */}
      <div className="bg-[#272729] py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-semibold text-white tracking-tight mb-4" style={{ letterSpacing: "-0.28px" }}>
            {greeting}, {userName}
          </h1>
          <p className="text-xl text-white/70 mb-8" style={{ lineHeight: "1.47" }}>Here's your career overview</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => navigate("/applications")} className="px-6 py-3 rounded-full bg-[#0066cc] text-white text-sm font-medium hover:bg-[#0071e3] transition-colors">
              Analyze Job
            </button>
            <button onClick={() => navigate("/kanban")} className="px-6 py-3 rounded-full border border-[#0066cc] text-[#0066cc] text-sm font-medium hover:bg-[#0066cc]/10 transition-colors">
              View Applications
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section - Light */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Applications", value: totalApps, sub: "total" },
              { label: "Interviews", value: interviewCount, sub: "in progress" },
              { label: "Offers", value: offerCount, sub: "received" },
              { label: "Match Score", value: `${avgScore}%`, sub: "average" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-semibold text-[#1d1d1f] mb-1" style={{ letterSpacing: "-0.374px" }}>{stat.value}</p>
                <p className="text-sm text-[#1d1d1f]/60">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Section - Parchment */}
      <div className="bg-[#f5f5f7] py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] text-center mb-3" style={{ letterSpacing: "-0.374px" }}>Your Pipeline</h2>
          <p className="text-lg text-[#1d1d1f]/60 text-center mb-10">Track your application progress</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Active Applications", value: applications.filter((a) => a.status === "applied").length },
              { label: "In Interviews", value: interviewCount },
              { label: "Pending Decision", value: applications.filter((a) => a.status === "screening").length },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-8 text-center border border-[#e0e0e0]">
                <p className="text-4xl font-semibold text-[#1d1d1f] mb-2">{item.value}</p>
                <p className="text-sm text-[#1d1d1f]/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Section - Dark */}
      <div className="bg-[#272729] py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-white text-center mb-3" style={{ letterSpacing: "-0.374px" }}>Skills Profile</h2>
          <p className="text-lg text-white/60 text-center mb-10">Your top skills based on your career profile</p>
          <div className="flex flex-wrap justify-center gap-3">
            {profile.skills.map((skill) => (
              <span key={skill} className="px-5 py-2.5 rounded-full bg-white/10 text-sm text-white font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications - Light */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] text-center mb-3" style={{ letterSpacing: "-0.374px" }}>Recent Applications</h2>
          <p className="text-lg text-[#1d1d1f]/60 text-center mb-10">Your latest job applications</p>
          <div className="space-y-4">
            {applications.slice(0, 5).map((app) => {
              const scorePct = Math.round((app.match_score || 0) * 100);
              return (
                <div key={app.id} className="flex items-center justify-between p-5 rounded-2xl border border-[#e0e0e0] hover:bg-[#f5f5f7] transition-colors cursor-pointer" onClick={() => navigate("/kanban")}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white text-sm font-semibold">
                      {app.company[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#1d1d1f]">{app.company}</p>
                      <p className="text-sm text-[#1d1d1f]/60">{app.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#1d1d1f]/60 capitalize">{app.status}</span>
                    <span className="text-sm font-semibold text-[#0066cc]">{scorePct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions - Dark */}
      <div className="bg-[#272729] py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-white mb-8" style={{ letterSpacing: "-0.374px" }}>Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate("/applications")} className="px-8 py-3.5 rounded-full bg-[#0066cc] text-white text-base font-medium hover:bg-[#0071e3] transition-colors">
              Analyze Job
            </button>
            <button onClick={() => navigate("/kanban")} className="px-8 py-3.5 rounded-full border border-[#0066cc] text-[#0066cc] text-base font-medium hover:bg-[#0066cc]/10 transition-colors">
              View Applications
            </button>
            <button onClick={() => navigate("/pipeline")} className="px-8 py-3.5 rounded-full border border-[#0066cc] text-[#0066cc] text-base font-medium hover:bg-[#0066cc]/10 transition-colors">
              Pipeline
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
