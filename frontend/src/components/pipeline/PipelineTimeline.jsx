export default function PipelineTimeline({ steps, currentStep, activeStep, onStepClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Timeline</h3>

      <div className="relative">
        {steps.map((step, i) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isActive = step.key === activeStep;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepClick(step.key)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? "bg-brand-500 text-white shadow-md shadow-brand-200 ring-2 ring-brand-100"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-brand-100 text-brand-600 ring-2 ring-brand-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                {!isLast && (
                  <div className={`w-0.5 h-6 transition-colors ${
                    isCompleted ? "bg-emerald-300" : "bg-gray-200"
                  }`} />
                )}
              </div>

              {/* Step content */}
              <button
                onClick={() => onStepClick(step.key)}
                className={`flex-1 text-left pb-4 ${!isLast ? "" : ""}`}
              >
                <p className={`text-xs font-semibold ${
                  isActive ? "text-brand-600" :
                  isCompleted ? "text-emerald-600" :
                  isCurrent ? "text-gray-900" : "text-gray-400"
                }`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{step.description}</p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
