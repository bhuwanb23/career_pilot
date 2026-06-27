import { useState } from "react";

const actions = [
  {
    key: "tailor_resume",
    label: "Tailor Resume",
    description: "Generate a tailored resume",
    color: "from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  {
    key: "cover_letter",
    label: "Cover Letter",
    description: "Generate a cover letter",
    color: "from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    key: "recruiter_msg",
    label: "Recruiter Message",
    description: "Draft an outreach message",
    color: "from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    key: "save",
    label: "Save Application",
    description: "Save to your tracker",
    color: "from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
      </svg>
    ),
  },
];

export default function ActionButtons({ onAction, loadingActions = {}, disabled = true }) {
  const [completed, setCompleted] = useState(null);

  const handleClick = async (key) => {
    if (!onAction || loadingActions[key]) return;
    await onAction(key);
    setCompleted(key);
    setTimeout(() => setCompleted(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
        <span className="text-[10px] text-gray-400">Quick actions for this application</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((a) => {
          const isLoading = loadingActions[a.key];
          const isDone = completed === a.key;

          return (
            <button
              key={a.key}
              onClick={() => handleClick(a.key)}
              disabled={disabled || isLoading}
              className={`group py-4 px-3 rounded-xl bg-gradient-to-r ${a.color} text-white transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex flex-col items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isDone ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                a.icon
              )}
              <span className="text-xs font-semibold">
                {isDone ? "Done!" : a.label}
              </span>
              <span className="text-[9px] opacity-70 hidden sm:block">{a.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
