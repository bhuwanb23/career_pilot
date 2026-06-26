const requiredSkills = [
  "React", "TypeScript", "Node.js", "REST APIs", "SQL", "Git", "CSS/Tailwind",
];

const missingSkills = [
  "GraphQL", "AWS", "Docker", "Kubernetes",
];

export default function SkillsAnalysis() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Skills Analysis</h3>

      <div className="space-y-4">
        {/* Required */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-600">Required Skills</span>
            <span className="text-[10px] text-gray-400">({requiredSkills.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {requiredSkills.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Missing */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-gray-600">Missing Skills</span>
            <span className="text-[10px] text-gray-400">({missingSkills.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
