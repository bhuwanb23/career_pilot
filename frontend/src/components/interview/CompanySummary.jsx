export default function CompanySummary({ summary, companyIntel = {} }) {
  const intel = companyIntel || {};
  const overview = intel.overview || summary;

  const sections = [
    overview && {
      title: "About the Company",
      content: overview,
      icon: "building",
    },
    intel.products && { title: "Products & Services", content: intel.products, icon: "box" },
    intel.tech_stack && { title: "Tech Stack", content: intel.tech_stack, icon: "code" },
    intel.role_expectations && { title: "Role Expectations", content: intel.role_expectations, icon: "role" },
    intel.culture && { title: "Culture", content: intel.culture, icon: "people" },
    intel.recent_news && { title: "Recent News", content: intel.recent_news, icon: "news" },
  ].filter(Boolean);

  if (sections.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Company Intelligence</h3>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            <span className="text-xs font-semibold text-gray-700">{section.title}</span>
            <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
