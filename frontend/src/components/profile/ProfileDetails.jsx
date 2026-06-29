const SKILL_COLORS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700", "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

export default function ProfileDetails({ profile }) {
  const personal = profile?.personal || {};
  const skills = profile?.skills || [];
  const education = profile?.education || [];

  const details = [
    { label: "Name", value: personal.name || "Not set" },
    { label: "Email", value: personal.email || "Not set" },
    { label: "Phone", value: personal.phone || "Not set" },
    { label: "Location", value: personal.location || "Not set" },
    { label: "LinkedIn", value: personal.linkedin || "Not set" },
    { label: "GitHub", value: personal.github || "Not set" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{d.label}</span>
              <span className="text-sm font-medium text-gray-800 truncate ml-4">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? skills.map((skill, i) => (
            <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
              {typeof skill === "string" ? skill : skill.name}
            </span>
          )) : (
            <p className="text-sm text-gray-400">No skills extracted yet</p>
          )}
        </div>

        {education.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">Education</h3>
            <div className="space-y-2">
              {education.map((edu, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                  <p className="text-xs text-gray-500">{edu.school}{edu.year && ` (${edu.year})`}</p>
                  {edu.gpa && <p className="text-xs text-gray-400">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
