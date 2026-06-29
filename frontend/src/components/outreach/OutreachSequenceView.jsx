import OutreachStepCard from "./OutreachStepCard";
import { getUrgencyStyle, formatDueDate } from "./outreachUtils";

export default function OutreachSequenceView({
  sequence,
  loading = false,
  compact = false,
  hubLink,
  onGenerate,
  onMarkSent,
}) {
  if (loading && !sequence) {
    return (
      <div className="text-center py-10">
        <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading outreach sequence...</p>
      </div>
    );
  }

  if (!sequence?.steps?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-medium text-gray-500 mb-1">No outreach sequence yet</p>
        <p className="text-xs text-gray-400">Move this application to Applied status to start the sequence</p>
      </div>
    );
  }

  const urgency = getUrgencyStyle(sequence.urgency);
  const nextDue = formatDueDate(sequence.next_due_at);
  const completed = sequence.steps.filter((s) => s.status === "sent").length;

  const header = (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${urgency.bg} ${urgency.text}`}>
          {urgency.label}
        </span>
        {nextDue && (
          <span className="text-[10px] text-gray-400">Next due {nextDue}</span>
        )}
        <span className="text-[10px] text-gray-400">{completed}/{sequence.steps.length} sent</span>
      </div>
      <div className="flex gap-2">
        {hubLink && (
          <a href={hubLink} className="px-3 py-1.5 rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100">
            Open in Outreach Hub
          </a>
        )}
      </div>
    </div>
  );

  const steps = (
    <div className={`space-y-4 ${compact ? "" : "max-w-2xl"}`}>
      {sequence.steps.map((step) => (
        <OutreachStepCard
          key={step.id}
          step={step}
          loading={loading}
          onGenerate={onGenerate}
          onMarkSent={onMarkSent}
        />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        {header}
        {steps}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-bold">{sequence.company}</h2>
        <p className="text-sm text-white/80">{sequence.role}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold capitalize">{sequence.status}</span>
          <span className="text-[10px] text-white/70">{completed}/{sequence.steps.length} steps complete</span>
        </div>
      </div>
      {header}
      {steps}
    </div>
  );
}
