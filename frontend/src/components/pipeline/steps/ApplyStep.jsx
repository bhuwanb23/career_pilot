export default function ApplyStep({ data }) {
  const applications = data?.applications || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Applications Submitted</h3>
      <div className="space-y-2">
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold">
                {app.company[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{app.company}</p>
                <p className="text-[10px] text-gray-500">{app.role}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-semibold">{app.status}</span>
              <p className="text-[9px] text-gray-400 mt-1">{app.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
