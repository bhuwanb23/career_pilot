export default function SkillsAnalysis({ requiredSkills = [], missingSkills = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="w-full flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Skills Analysis</h3>
        <span className="text-[10px] text-gray-400">
          {requiredSkills.length} required · {missingSkills.length} missing
        </span>
      </div>

      <div className="space-y-5">
        {requiredSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Matching Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Missing Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {requiredSkills.length === 0 && missingSkills.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400">Analyze a job to see skills breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
}
