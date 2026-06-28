export function RequiredSkills({ skills = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-5 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Required Skills</h3>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">{skills.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.length > 0 ? skills.map((skill) => (
          <span key={skill} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium transition-all-smooth">
            {skill}
          </span>
        )) : (
          <p className="text-[11px] text-gray-400">No skills matched</p>
        )}
      </div>
    </div>
  );
}

export function MissingSkills({ skills = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-figma-hairline p-5 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Missing Skills</h3>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">{skills.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.length > 0 ? skills.map((skill) => (
          <span key={skill} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-medium transition-all-smooth">
            {skill}
          </span>
        )) : (
          <p className="text-[11px] text-gray-400">No missing skills</p>
        )}
      </div>
    </div>
  );
}

export default function SkillsAnalysis({ requiredSkills = [], missingSkills = [] }) {
  return (
    <div className="space-y-4">
      <RequiredSkills skills={requiredSkills} />
      <MissingSkills skills={missingSkills} />
    </div>
  );
}
