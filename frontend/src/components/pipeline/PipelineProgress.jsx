export default function PipelineProgress({ steps, activeStep, completedSteps, onStepClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between overflow-x-auto">
        {steps.map((step, i) => {
          const isActive = activeStep === step.key;
          const isCompleted = completedSteps.includes(step.key);
          const isPast = steps.findIndex((s) => s.key === activeStep) > i;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onStepClick(step.key)}
                className={`flex flex-col items-center gap-1.5 min-w-[60px] group`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-200"
                    : isCompleted || isPast
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                }`}>
                  {isCompleted || isPast ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive ? "text-brand-600" : isCompleted || isPast ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 rounded-full transition-colors ${
                  isPast || isCompleted ? "bg-emerald-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
