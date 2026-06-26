import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import RightSidebar from "../components/RightSidebar";
import QuickStats from "../components/QuickStats";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import AreaChart from "../components/charts/AreaChart";
import RadarChart from "../components/charts/RadarChart";
import RecentActivity from "../components/RecentActivity";
import UpcomingTasks from "../components/UpcomingTasks";

export default function Dashboard() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Workspace");

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleLeft={() => setLeftCollapsed(!leftCollapsed)}
        onToggleRight={() => setRightCollapsed(!rightCollapsed)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <QuickStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart />
              <BarChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DonutChart />
              <AreaChart />
              <RadarChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <UpcomingTasks />
            </div>
          </div>
        </main>

        <RightSidebar isCollapsed={rightCollapsed} onToggleCollapse={() => setRightCollapsed(!rightCollapsed)} />
      </div>
    </div>
  );
}
