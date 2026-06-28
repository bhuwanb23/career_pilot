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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#f4ecd6] rounded-3xl p-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-light text-black tracking-tight">John Doe</h1>
              <p className="text-lg text-black/60 font-light">john@example.com</p>
              <p className="text-sm text-black/40 mt-0.5">UC Berkeley — Computer Science, 2025</p>
            </div>
            <button className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Edit Profile
            </button>
          </div>
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
