import { useProfile, usePersonas } from "../hooks/useProfile";
import { profileAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import ResumeCard from "../components/profile/ResumeCard";
import ProfileDetails from "../components/profile/ProfileDetails";
import ExperienceTimeline from "../components/profile/ExperienceTimeline";
import ProjectCards from "../components/profile/ProjectCards";
import CareerPersonas from "../components/profile/CareerPersonas";

export default function ProfilePage({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const { profile, loading, error, refetch } = useProfile();
  const { personas, refetch: refetchPersonas } = usePersonas();

  const personal = profile?.personal || {};
  const name = personal.name || "No Profile";
  const email = personal.email || "";
  const initials = (name[0] || "U").toUpperCase();

  const handleGenerateProfile = async () => {
    try {
      await profileAPI.generate();
      refetch();
    } catch (err) {
      console.error("Profile generation failed:", err);
    }
  };

  if (loading) {
    return (
      <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-figma-hairline p-6 animate-pulse">
            <div className="h-16 w-16 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <p className="text-gray-500">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Upload a resume to get started.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-figma-hairline p-6 flex items-center gap-5 hover-lift">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{name}</h1>
            <p className="text-sm text-gray-500">{email}</p>
            {personal.location && <p className="text-xs text-gray-400 mt-0.5">{personal.location}</p>}
            {profile?.experience_level && (
              <p className="text-xs text-brand-600 mt-0.5 font-medium">{profile.experience_level}</p>
            )}
          </div>
          <div className="flex gap-2">
            {profile && !profile.profile_generated_at && (
              <button onClick={handleGenerateProfile}
                className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-all">
                Generate AI Profile
              </button>
            )}
          </div>
        </div>

        {profile?.ai_summary && (
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">AI-Generated Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.ai_summary}</p>
          </div>
        )}

        <ResumeCard profile={profile} />
        <ProfileDetails profile={profile} />
        <ExperienceTimeline profile={profile} />
        <ProjectCards profile={profile} />

        {profile?.certifications?.length > 0 && (
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Certifications</h3>
            <div className="space-y-2">
              {profile.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                    {cert.name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                    <p className="text-xs text-gray-500">{cert.issuer} {cert.year && `(${cert.year})`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile?.languages?.length > 0 && (
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                  {lang.language}{lang.proficiency && ` (${lang.proficiency})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile?.tech_stack?.length > 0 && (
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tech Stack</h3>
            <div className="space-y-3">
              {profile.tech_stack.map((cat, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{cat.category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tools?.map((tool, j) => (
                      <span key={j} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">{tool}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile?.interests?.length > 0 && (
          <div className="bg-white rounded-2xl border border-figma-hairline p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm">{interest}</span>
              ))}
            </div>
          </div>
        )}

        <CareerPersonas personas={personas} onRefresh={refetchPersonas} />
      </div>
    </AppLayout>
  );
}
