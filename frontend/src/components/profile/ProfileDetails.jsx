const skills = [
  { name: "Python", color: "bg-blue-100 text-blue-700" },
  { name: "JavaScript", color: "bg-amber-100 text-amber-700" },
  { name: "React", color: "bg-cyan-100 text-cyan-700" },
  { name: "Node.js", color: "bg-emerald-100 text-emerald-700" },
  { name: "SQL", color: "bg-purple-100 text-purple-700" },
  { name: "FastAPI", color: "bg-green-100 text-green-700" },
  { name: "Docker", color: "bg-blue-100 text-blue-600" },
  { name: "Git", color: "bg-orange-100 text-orange-700" },
  { name: "TypeScript", color: "bg-indigo-100 text-indigo-700" },
  { name: "AWS", color: "bg-amber-100 text-amber-600" },
];

const details = [
  { label: "Name", value: "John Doe" },
  { label: "Email", value: "john@example.com" },
  { label: "University", value: "UC Berkeley" },
  { label: "Graduation", value: "2025" },
  { label: "Preferred Role", value: "Full Stack Developer" },
];

export default function ProfileDetails() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{d.label}</span>
              <span className="text-sm font-medium text-gray-800">{d.value}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
          Edit Profile
        </button>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
          <button className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">+ Add skill</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s.name} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${s.color}`}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
