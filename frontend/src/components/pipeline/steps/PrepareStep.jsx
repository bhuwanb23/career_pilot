export default function PrepareStep({ data }) {
  const coverLetters = data?.coverLetters || [];
  const messages = data?.messages || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Cover Letters</h3>
        <div className="space-y-2">
          {coverLetters.map((cl) => (
            <div key={cl.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cl.company}</p>
                <p className="text-[10px] text-gray-500">{cl.role}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cl.generated ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                {cl.generated ? "Generated" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Outreach Messages</h3>
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.company}</p>
                <p className="text-[10px] text-gray-500">{m.channel}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.generated ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                {m.generated ? "Generated" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
