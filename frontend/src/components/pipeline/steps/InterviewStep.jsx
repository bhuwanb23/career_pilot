export default function InterviewStep({ data }) {
  const interviews = data?.interviews || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Scheduled Interviews</h3>
      {interviews.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No interviews scheduled yet</p>
      ) : (
        <div className="space-y-3">
          {interviews.map((int, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{int.company}</h4>
                  <p className="text-[10px] text-gray-500">{int.role}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  int.status === "scheduled" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {int.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <span>{int.date}</span>
                <span>•</span>
                <span>{int.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
