import { getStatusStyle, getStepLabel, formatDueDate } from "./outreachUtils";

export default function OutreachStepCard({ step, loading, onGenerate, onMarkSent }) {
  const statusStyle = getStatusStyle(step.status);
  const dueLabel = formatDueDate(step.due_at);

  const handleCopy = () => {
    if (step.message) navigator.clipboard?.writeText(step.message);
  };

  return (
    <div className={`rounded-2xl border p-5 ${step.status === "sent" ? "border-emerald-100 bg-emerald-50/30" : "border-gray-100 bg-white"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{getStepLabel(step.type)}</h4>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-gray-100 text-gray-500 capitalize">
              {step.channel}
            </span>
          </div>
          {dueLabel && step.status !== "sent" && (
            <p className="text-[10px] text-gray-400 mt-1">Due {dueLabel}</p>
          )}
        </div>
      </div>

      {step.message ? (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{step.message}</p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3 italic">No message generated yet</p>
      )}

      <div className="flex flex-wrap gap-2">
        {step.status !== "sent" && onGenerate && (
          <button
            onClick={() => onGenerate(step)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100 disabled:opacity-50"
          >
            {loading ? "Generating..." : step.message ? "Regenerate" : "Generate"}
          </button>
        )}
        {step.message && (
          <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200">
            Copy
          </button>
        )}
        {step.message && step.status !== "sent" && onMarkSent && (
          <button
            onClick={() => onMarkSent(step.id)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
          >
            Mark Sent
          </button>
        )}
      </div>
    </div>
  );
}
