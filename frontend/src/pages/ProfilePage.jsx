import { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/AppLayout";
import ResumeCard from "../components/profile/ResumeCard";
import ProfileDetails from "../components/profile/ProfileDetails";
import ExperienceTimeline from "../components/profile/ExperienceTimeline";
import ProjectCards from "../components/profile/ProjectCards";
import CareerPersonas from "../components/profile/CareerPersonas";
import { getProfile, uploadResume, listPersonas, generatePersonas } from "../services/api";

export default function ProfilePage({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [profile, setProfile] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingPersonas, setGeneratingPersonas] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, personaList] = await Promise.all([
        getProfile(),
        listPersonas().catch(() => []),
      ]);
      setProfile(p);
      setPersonas(Array.isArray(personaList) ? personaList : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);
    try {
      await uploadResume(file);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePersonas = async () => {
    if (!profile) return;
    setGeneratingPersonas(true);
    setError(null);
    try {
      const result = await generatePersonas();
      setPersonas(result.personas || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setGeneratingPersonas(false);
    }
  };

  const displayName = profile?.personal_name || user.email?.split("@")[0] || "User";
  const displayEmail = profile?.personal_email || user.email || "";
  const initials = (displayName[0] || "U").toUpperCase();
  const education = profile?.education?.[0];
  const educationLine = education
    ? `${education.institution || education.school || ""}${education.degree ? ` — ${education.degree}` : ""}${education.year ? `, ${education.year}` : ""}`
    : null;

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-figma-hairline p-6 flex items-center gap-5 hover-lift">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{displayName}</h1>
            <p className="text-sm text-gray-500">{displayEmail}</p>
            {educationLine && <p className="text-xs text-gray-400 mt-0.5">{educationLine}</p>}
            {profile?.ai_summary && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{profile.ai_summary}</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">Loading profile...</div>
        ) : (
          <>
            <ResumeCard profile={profile} onUpload={handleUpload} uploading={uploading} />
            <ProfileDetails profile={profile} />
            <ExperienceTimeline experience={profile?.experience || []} />
            <ProjectCards projects={profile?.projects || []} />
            <CareerPersonas
              personas={personas}
              onGenerate={handleGeneratePersonas}
              generating={generatingPersonas}
              hasProfile={!!profile}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
