const experiences = [
  {
    company: "TechCorp",
    role: "Software Engineer Intern",
    period: "Jun 2024 - Aug 2024",
    bullets: [
      "Built REST APIs serving 10K+ daily requests",
      "Reduced load time by 40% through code optimization",
      "Led migration from monolith to microservices architecture",
    ],
  },
  {
    company: "StartupXYZ",
    role: "Frontend Developer",
    period: "Jan 2023 - May 2024",
    bullets: [
      "Developed React dashboard used by 5K+ users",
      "Implemented real-time notifications with WebSockets",
    ],
  },
];

export default function ExperienceTimeline() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Experience</h3>
        <button className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">+ Add</button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-6">
          {experiences.map((exp, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <p className="text-sm font-semibold text-gray-800">{exp.role}</p>
                <p className="text-xs text-brand-600 font-medium mt-0.5">{exp.company}</p>
                <p className="text-xs text-gray-400 mt-0.5">{exp.period}</p>
                <ul className="mt-2 space-y-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
