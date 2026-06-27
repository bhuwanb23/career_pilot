import AppLayout from "../components/AppLayout";
import QuickStats from "../components/QuickStats";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import AreaChart from "../components/charts/AreaChart";
import RadarChart from "../components/charts/RadarChart";
import RecentActivity from "../components/RecentActivity";
import UpcomingTasks from "../components/UpcomingTasks";

export default function Dashboard({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
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
    </AppLayout>
  );
}
