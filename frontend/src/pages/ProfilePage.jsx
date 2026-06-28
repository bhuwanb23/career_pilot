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
      {/* Hero - Dark */}
      <div className="bg-[#272729] py-20 px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-semibold text-white tracking-tight mb-2" style={{ letterSpacing: "-0.28px" }}>John Doe</h1>
            <p className="text-xl text-white/70 mb-1" style={{ lineHeight: "1.47" }}>john@example.com</p>
            <p className="text-sm text-white/50">UC Berkeley — Computer Science, 2025</p>
          </div>
          <button className="px-6 py-3 rounded-full bg-[#0066cc] text-white text-sm font-medium hover:bg-[#0071e3] transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Content - Light */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <ResumeCard />
          <ProfileDetails />
          <ExperienceTimeline />
          <ProjectCards />
          <CareerPersonas />
        </div>
      </div>
    </AppLayout>
  );
}
