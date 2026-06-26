import Logo from "./Logo";

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-4.25-11.396c.251.023.501.05.75.082M5 14.5l-1.43 1.43a2.25 2.25 0 0 0 0 3.18l3.39 3.39a2.25 2.25 0 0 0 3.18 0L12 21m7-6.5l1.43 1.43a2.25 2.25 0 0 1 0 3.18l-3.39 3.39a2.25 2.25 0 0 1-3.18 0L12 14.5" />
      </svg>
    ),
    text: "AI-Powered Resume Analysis",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    ),
    text: "Smart Job Matching",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
      </svg>
    ),
    text: "Interview Preparation",
  },
];

export default function BrandingPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[55%] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-brand-400/10 rounded-full blur-2xl" />

      {/* Floating cards */}
      <div className="absolute top-16 right-12 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-white/80 text-xs font-medium">Resume parsed successfully</span>
        </div>
      </div>
      <div className="absolute bottom-32 left-8 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <span className="text-white/80 text-xs font-medium">Match score: 87%</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
        <div>
          <Logo className="w-12 h-12" />
        </div>

        <div className="my-auto">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            Your AI Command
            <br />
            Centre for Job
            <br />
            Applications
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-md leading-relaxed">
            Manage your entire job search through a single AI assistant.
            No more switching between tools.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-white/80">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/90">
                {f.icon}
              </div>
              <span className="text-sm font-medium">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
