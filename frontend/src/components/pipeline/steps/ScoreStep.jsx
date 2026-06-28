export default function ScoreStep({ data }) {
  const jobs = data?.scoredJobs || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Scored Against Your Resume</h3>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{job.company}</h4>
                <p className="text-[11px] text-gray-500">{job.role}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${job.score >= 80 ? "text-emerald-600" : job.score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                  {job.score}
                </p>
                <p className="text-[9px] text-gray-400">score</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-medium">{s}</span>
              ))}
              {job.gap.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium">{g}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
