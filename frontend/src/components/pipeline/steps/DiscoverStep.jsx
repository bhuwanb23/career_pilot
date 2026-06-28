export default function DiscoverStep({ data }) {
  const jobs = data?.jobs || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Discovered Jobs</h3>
        <span className="text-[10px] text-gray-400">{jobs.length} jobs found</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => {
          const gradients = ["from-brand-500 to-brand-700", "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700", "from-purple-500 to-purple-700"];
          const gradIdx = job.company.charCodeAt(0) % gradients.length;

          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradients[gradIdx]} flex items-center justify-center text-white text-sm font-bold`}>
                  {job.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{job.company}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{job.role}</p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {job.location}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.222A15.005 15.005 0 0012 12c-1.32 0-2.558-.337-3.636-.879" />
                  </svg>
                  {job.salary}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">{job.posted}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  job.match >= 85 ? "bg-emerald-50 text-emerald-600" :
                  job.match >= 70 ? "bg-amber-50 text-amber-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {job.match}% match
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
