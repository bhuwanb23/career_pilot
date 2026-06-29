const URGENCY_STYLES = {
  overdue: { bg: "bg-red-50", text: "text-red-600", label: "Overdue" },
  urgent: { bg: "bg-amber-50", text: "text-amber-600", label: "Urgent" },
  waiting: { bg: "bg-blue-50", text: "text-blue-600", label: "Waiting" },
  cold: { bg: "bg-gray-100", text: "text-gray-500", label: "Cold" },
};

const STEP_LABELS = {
  initial: "Initial Outreach",
  follow_up: "Follow-up",
  thank_you: "Thank You",
};

const STATUS_STYLES = {
  pending: { bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
  draft: { bg: "bg-amber-50", text: "text-amber-600", label: "Draft" },
  sent: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Sent" },
};

export function getUrgencyStyle(urgency) {
  return URGENCY_STYLES[urgency] || URGENCY_STYLES.waiting;
}

export function getStepLabel(type) {
  return STEP_LABELS[type] || type;
}

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
}

export function formatDueDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

export function dashboardItemToApplication(item) {
  return {
    id: item.application_id,
    company: item.company,
    role: item.role,
    status: item.status,
    score_overall: item.score_overall,
    urgency: item.urgency,
    next_due_at: item.next_due_at,
    followup_count: item.followup_count,
    steps_completed: item.steps_completed,
    steps_total: item.steps_total,
    applied_at: item.applied_at,
  };
}
