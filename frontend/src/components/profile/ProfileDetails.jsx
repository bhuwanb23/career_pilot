const SKILL_COLORS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-green-100 text-green-700",
  "bg-indigo-100 text-indigo-700", "bg-orange-100 text-orange-700",
];

export default function ProfileDetails({ profile }) {
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
        Upload a resume to see your profile details.
      </div>
    );
  }

  const details = [
    { label: "Name", value: profile.personal_name || "—" },
    { label: "Email", value: profile.personal_email || "—" },
    { label: "Location", value: profile.personal_location || "—" },
    { label: "Experience Level", value: profile.experience_level || "—" },
    { label: "LinkedIn", value: profile.personal_linkedin || "—" },
  ].filter((d) => d.value !== "—" || d.label === "Name" || d.label === "Email");

  const skills = profile.skills || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{d.label}</span>
              <span className="text-sm font-medium text-gray-800 truncate ml-4 max-w-[60%] text-right">{d.value}</span>
            </div>
          ))}
        </div>
        {profile.summary && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
          <span className="text-xs text-gray-400">{skills.length} skills</span>
        </div>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No skills parsed yet.</p>
        )}
      </div>
    </div>
  );
}
