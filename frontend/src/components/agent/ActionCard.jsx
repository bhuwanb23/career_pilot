const actionStyles = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  info: { bg: "bg-brand-50", border: "border-brand-200", icon: "text-brand-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
};

const actionIcons = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.375c-.868 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.375L13.949 3.378c-.867-1.5-3.032-1.5-3.898 0L2.694 16.125zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

export default function ActionCard({ type = "info", title, message }) {
  const style = actionStyles[type] || actionStyles.info;
  const icon = actionIcons[type] || actionIcons.info;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${style.border} ${style.bg} fade-in`}>
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${style.icon}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className="text-xs font-semibold text-gray-900 mb-0.5">{title}</p>}
        <p className="text-[11px] text-gray-600 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
