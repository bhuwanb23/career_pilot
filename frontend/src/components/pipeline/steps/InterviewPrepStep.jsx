export default function InterviewPrepStep({ data }) {
  const preps = data?.preps || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Interview Preparation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preps.map((p, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{p.company}</h4>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Questions</span>
                <span className="font-medium text-gray-700">{p.questions}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">STAR Answers</span>
                <span className="font-medium text-gray-700">{p.starAnswers}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500">Readiness</span>
                <span className="font-semibold text-brand-600">{p.readiness}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.readiness}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
