import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AICopilot from "../components/AICopilot";
import ScoreCard from "../components/ScoreCard";
import QuickStats from "../components/QuickStats";
import RecentActivity from "../components/RecentActivity";
import UpcomingTasks from "../components/UpcomingTasks";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <Header />

          {/* Top row: AI Copilot + Score Card */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            <div className="lg:col-span-3">
              <AICopilot />
            </div>
            <div className="lg:col-span-2">
              <ScoreCard />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mb-6">
            <QuickStats />
          </div>

          {/* Bottom row: Recent Activity + Upcoming Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <UpcomingTasks />
          </div>
        </div>
      </main>
    </div>
  );
}
