import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import QuickStats from "../components/QuickStats";
import ScoreCard from "../components/ScoreCard";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import AreaChart from "../components/charts/AreaChart";
import RadarChart from "../components/charts/RadarChart";
import RecentActivity from "../components/RecentActivity";
import UpcomingTasks from "../components/UpcomingTasks";
import { getAnalytics, listApplications, getProfile } from "../services/api";
import { useAgent } from "../context/AgentContext";
import { normalizeStatus } from "../components/kanban/kanbanConstants";

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

function computeStats(applications, analytics) {
  const total = analytics?.total_applications ?? applications.length;
  const interviewCount = analytics?.interviews ?? applications.filter((a) => normalizeStatus(a.status) === "interview").length;
  const offerCount = analytics?.offers ?? applications.filter((a) => normalizeStatus(a.status) === "offer").length;
  const avgScore = analytics?.avg_career_pilot_score
    ? Math.round(analytics.avg_career_pilot_score)
    : total > 0
      ? Math.round(applications.reduce((sum, a) => sum + (a.score_overall || (a.match_score || 0) * 100), 0) / total)
      : 0;

  return [
    {
      label: "Total Applications",
      value: total,
      trend: `${applications.filter((a) => a.status === "applied").length} pending`,
      trendUp: true,
      gradient: "from-brand-500 to-brand-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      ),
    },
    {
      label: "Interviews",
      value: interviewCount,
      trend: interviewCount > 0 ? "In progress" : "None yet",
      trendUp: interviewCount > 0,
      gradient: "from-emerald-500 to-emerald-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
    },
    {
      label: "Offers",
      value: offerCount,
      trend: offerCount > 0 ? "Congratulations!" : "Keep going!",
      trendUp: offerCount > 0,
      gradient: "from-amber-500 to-amber-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
    },
    {
      label: "Avg CareerPilot Score",
      value: `${avgScore}`,
      trend: avgScore >= 70 ? "Strong match" : "Keep improving",
      trendUp: avgScore >= 70,
      gradient: "from-purple-500 to-purple-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
  ];
}

function computeStatusBreakdown(applications, analytics) {
  const counts = analytics?.status_breakdown || {};
  applications.forEach((a) => {
    const s = normalizeStatus(a.status);
    if (!analytics?.status_breakdown) counts[s] = (counts[s] || 0) + 1;
  });
  const colorMap = {
    draft: "#9ca3af", applied: "#6366f1", assessment: "#f59e0b",
    interview: "#10b981", offer: "#8b5cf6", rejected: "#ef4444", archived: "#64748b",
  };
  const labelMap = {
    draft: "Draft", applied: "Applied", assessment: "Assessment",
    interview: "Interview", offer: "Offer", rejected: "Rejected", archived: "Archived",
  };
  return Object.entries(counts)
    .map(([status, value]) => ({
      label: labelMap[status] || status,
      value,
      color: colorMap[status] || "#9ca3af",
    }))
    .filter((d) => d.value > 0);
}

function computeWeeklyData(applications) {
  const weeks = {};
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = `W${8 - i}`;
    weeks[key] = 0;
  }
  applications.forEach((a) => {
    const created = new Date(a.created_at);
    const diffWeeks = Math.floor((now - created) / (7 * 24 * 60 * 60 * 1000));
    const idx = 8 - Math.min(diffWeeks, 7);
    if (idx >= 1 && idx <= 8) {
      weeks[`W${idx}`] = (weeks[`W${idx}`] || 0) + 1;
    }
  });
  return Object.entries(weeks).map(([week, value]) => ({ week, value }));
}

function computeTopCompanies(applications, analytics, limit = 5) {
  if (analytics?.top_companies?.length) {
    return analytics.top_companies.map((c) => ({ company: c.company, count: c.count }));
  }
  const counts = {};
  applications.forEach((a) => {
    counts[a.company] = (counts[a.company] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([company, count]) => ({ company, count }));
}

function computeRecentActivity(applications) {
  return applications
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((a) => ({
      text: `Applied to ${a.company} — ${a.role}`,
      time: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      color: a.status === "interview" ? "bg-emerald-500" : a.status === "offer" ? "bg-purple-500" : "bg-brand-500",
    }));
}

function computeScoreMetrics(applications, profile) {
  const resumeScore = profile?.skills?.length > 0 ? Math.min(95, 50 + profile.skills.length * 5) : 50;
  const appScore = Math.min(95, applications.length * 8);
  const interviewScore = applications.filter((a) => a.status === "interview").length > 0 ? 75 : 40;
  const networkingScore = Math.min(80, 30 + applications.length * 3);
  const overall = Math.round((resumeScore + appScore + interviewScore + networkingScore) / 4);

  return {
    overall,
    metrics: [
      { label: "Resume", score: resumeScore, color: "#10b981" },
      { label: "Applications", score: appScore, color: "#6366f1" },
      { label: "Interview", score: interviewScore, color: "#f59e0b" },
      { label: "Networking", score: networkingScore, color: "#ef4444" },
    ],
  };
}

function computeSkills(profile) {
  if (!profile?.skills?.length) {
    return [{ skill: "Add skills", value: 50 }];
  }
  return profile.skills.slice(0, 6).map((s, i) => ({
    skill: s.length > 10 ? s.slice(0, 10) + "." : s,
    value: 65 + (i * 5) % 30,
  }));
}

function computeScoreTrend(applications) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      value: 0,
    });
  }

  applications.forEach((a) => {
    const created = new Date(a.created_at);
    const diffMonths = Math.floor((now - created) / (30 * 24 * 60 * 60 * 1000));
    const idx = 5 - Math.min(diffMonths, 5);
    if (idx >= 0 && idx < 6) {
      months[idx].value = Math.round((a.match_score || 0) * 100);
    }
  });

  return months;
}

export default function Dashboard({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const navigate = useNavigate();
  const { registerRefreshHandler } = useAgent();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    Promise.all([
      listApplications().catch(() => []),
      getAnalytics().catch(() => null),
      getProfile().catch(() => null),
    ]).then(([apps, stats, prof]) => {
      setApplications(apps);
      setAnalytics(stats);
      setProfile(prof);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const unregisterAnalytics = registerRefreshHandler("analytics", loadDashboard);
    const unregisterApplications = registerRefreshHandler("applications", loadDashboard);
    return () => {
      unregisterAnalytics();
      unregisterApplications();
    };
  }, [registerRefreshHandler, loadDashboard]);

  const stats = computeStats(applications, analytics);
  const statusBreakdown = computeStatusBreakdown(applications, analytics);
  const weeklyData = computeWeeklyData(applications);
  const topCompanies = computeTopCompanies(applications, analytics);
  const recentActivity = computeRecentActivity(applications);
  const scoreData = computeScoreMetrics(applications, profile);
  const skills = computeSkills(profile);
  const scoreTrend = computeScoreTrend(applications);

  const userName = getFirstName();
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">Loading dashboard...</div>
        ) : (
        <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}, {userName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/kanban")} className="px-4 py-2.5 rounded-xl bg-white border border-figma-hairline text-xs font-medium text-gray-600 hover:bg-figma-surface transition-all-smooth flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
              View Applications
            </button>
            <button onClick={() => navigate("/applications")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold hover:from-brand-700 hover:to-brand-600 transition-all-smooth flex items-center gap-2 press-scale">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Analyze Job
            </button>
          </div>
        </div>

        <QuickStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScoreCard score={scoreData.overall} metrics={scoreData.metrics} />
          <DonutChart data={statusBreakdown} total={applications.length} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart data={weeklyData} />
          <BarChart data={topCompanies} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AreaChart data={scoreTrend} />
          <RadarChart skills={skills} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity activities={recentActivity} />
          <UpcomingTasks applications={applications} />
        </div>
        </>
        )}
      </div>
    </AppLayout>
  );
}
