import AppLayout from "../components/AppLayout";
import ResumeCard from "../components/profile/ResumeCard";
import ProfileDetails from "../components/profile/ProfileDetails";
import ExperienceTimeline from "../components/profile/ExperienceTimeline";
import ProjectCards from "../components/profile/ProjectCards";
import CareerPersonas from "../components/profile/CareerPersonas";

export default function ProfilePage({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.email?.[0] || "U").toUpperCase();

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-figma-hairline p-6 flex items-center gap-5 hover-lift">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">John Doe</h1>
            <p className="text-sm text-gray-500">john@example.com</p>
            <p className="text-xs text-gray-400 mt-0.5">UC Berkeley — Computer Science, 2025</p>
          </div>
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Edit Profile
          </button>
        </div>

        <ResumeCard />
        <ProfileDetails />
        <ExperienceTimeline />
        <ProjectCards />
        <CareerPersonas />
      </div>
    </AppLayout>
  );
}
