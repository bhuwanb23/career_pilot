import { useState } from "react";
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="bg-[#f7f7f5] rounded-3xl p-10">
          <h1 className="text-4xl font-light text-black tracking-tight mb-2">
            {greeting}, {userName}
          </h1>
          <p className="text-lg text-gray-500 font-light">Here's your career overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Applications", value: totalApps, sub: "total" },
            { label: "Interviews", value: interviewCount, sub: "in progress" },
            { label: "Offers", value: offerCount, sub: "received" },
            { label: "Match Score", value: `${avgScore}%`, sub: "average" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[#e6e6e6] rounded-3xl p-6">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-light text-black">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Color Block: Lime */}
        <div className="bg-[#dceeb1] rounded-3xl p-10">
          <h2 className="text-2xl font-medium text-black mb-6">Your Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/60 rounded-2xl p-5">
              <p className="text-sm font-medium text-black mb-2">Active Applications</p>
              <p className="text-2xl font-light text-black">{applications.filter((a) => a.status === "applied").length}</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-5">
              <p className="text-sm font-medium text-black mb-2">In Interviews</p>
              <p className="text-2xl font-light text-black">{interviewCount}</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-5">
              <p className="text-sm font-medium text-black mb-2">Pending Decision</p>
              <p className="text-2xl font-light text-black">{applications.filter((a) => a.status === "screening").length}</p>
            </div>
          </div>
        </div>

        {/* Color Block: Lilac */}
        <div className="bg-[#c5b0f4] rounded-3xl p-10">
          <h2 className="text-2xl font-medium text-black mb-4">Skills Profile</h2>
          <p className="text-sm text-black/70 mb-6">Your top skills based on your career profile</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="px-4 py-2 rounded-full bg-white/60 text-sm font-medium text-black">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div>
          <h2 className="text-2xl font-medium text-black mb-6">Recent Applications</h2>
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => {
              const scorePct = Math.round((app.match_score || 0) * 100);
              return (
                <div key={app.id} className="bg-white border border-[#e6e6e6] rounded-2xl p-5 flex items-center justify-between hover:bg-[#f7f7f5] transition-colors cursor-pointer" onClick={() => navigate("/kanban")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold">
                      {app.company[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{app.company}</p>
                      <p className="text-xs text-gray-500">{app.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === "interview" ? "bg-[#c8e6cd] text-black" :
                      app.status === "offer" ? "bg-[#dceeb1] text-black" :
                      app.status === "rejected" ? "bg-[#efd4d4] text-black" :
                      "bg-[#f7f7f5] text-gray-600"
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-sm font-medium text-black">{scorePct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Block: Mint */}
        <div className="bg-[#c8e6cd] rounded-3xl p-10">
          <h2 className="text-2xl font-medium text-black mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/applications")} className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Analyze Job
            </button>
            <button onClick={() => navigate("/kanban")} className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium border border-[#e6e6e6] hover:bg-[#f7f7f5] transition-colors">
              View Applications
            </button>
            <button onClick={() => navigate("/pipeline")} className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium border border-[#e6e6e6] hover:bg-[#f7f7f5] transition-colors">
              Pipeline
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
