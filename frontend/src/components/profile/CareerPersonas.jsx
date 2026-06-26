import { useState } from "react";

const personas = {
  Backend: [
    {
      title: "API Architect",
      description: "Designs scalable REST/GraphQL APIs, manages databases, and ensures system reliability.",
      skills: ["Python", "Node.js", "PostgreSQL", "Redis", "gRPC"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>,
    },
    {
      title: "Cloud Engineer",
      description: "Manages cloud infrastructure, CI/CD pipelines, and deployment automation.",
      skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Linux"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" /></svg>,
    },
    {
      title: "Database Specialist",
      description: "Optimizes queries, designs schemas, and manages data pipelines at scale.",
      skills: ["PostgreSQL", "MongoDB", "Redis", "SQL", "ETL"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
    },
  ],
  AI: [
    {
      title: "ML Engineer",
      description: "Builds and deploys machine learning models, optimizes inference pipelines.",
      skills: ["Python", "TensorFlow", "PyTorch", "MLOps", "SQL"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>,
    },
    {
      title: "NLP Specialist",
      description: "Develops language models, text analysis, and conversational AI systems.",
      skills: ["Python", "Transformers", "spaCy", "LLMs", "RAG"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>,
    },
    {
      title: "Data Scientist",
      description: "Analyzes complex data, builds predictive models, and generates business insights.",
      skills: ["Python", "Pandas", "Scikit-learn", "SQL", "Tableau"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" /></svg>,
    },
  ],
  Frontend: [
    {
      title: "React Specialist",
      description: "Builds complex UIs with React, manages state, and optimizes performance.",
      skills: ["React", "TypeScript", "Next.js", "Tailwind", "Redux"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25z" /></svg>,
    },
    {
      title: "UI/UX Engineer",
      description: "Bridges design and code, creates design systems, and implements pixel-perfect UIs.",
      skills: ["Figma", "CSS", "Framer Motion", "Storybook", "A11y"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>,
    },
    {
      title: "Mobile Developer",
      description: "Creates cross-platform mobile apps with React Native or Flutter.",
      skills: ["React Native", "Flutter", "iOS", "Android", "Firebase"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
    },
  ],
  DevOps: [
    {
      title: "SRE",
      description: "Ensures system reliability, monitors uptime, and automates incident response.",
      skills: ["Linux", "Prometheus", "Grafana", "PagerDuty", "Bash"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg>,
    },
    {
      title: "Platform Engineer",
      description: "Builds internal developer platforms, toolchains, and deployment infrastructure.",
      skills: ["Kubernetes", "Helm", "ArgoCD", "Go", "AWS"],
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0 4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" /></svg>,
    },
  ],
};

export default function CareerPersonas() {
  const [activeTab, setActiveTab] = useState("Backend");
  const [selectedPersona, setSelectedPersona] = useState(null);

  const tabs = Object.keys(personas);
  const currentPersonas = personas[activeTab];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Career Personas</h3>
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedPersona(null); }}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Persona cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {currentPersonas.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelectedPersona(selectedPersona === i ? null : i)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPersona === i
                ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                : "border-gray-100 hover:border-brand-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedPersona === i ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {p.icon}
              </div>
              {selectedPersona === i && (
                <svg className="w-4 h-4 text-brand-500 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800">{p.title}</p>
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Preview panel */}
      {selectedPersona !== null && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs font-semibold text-gray-800 mb-1">{currentPersonas[selectedPersona].title}</p>
          <p className="text-xs text-gray-500 mb-3">{currentPersonas[selectedPersona].description}</p>
          <div className="flex flex-wrap gap-1.5">
            {currentPersonas[selectedPersona].skills.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-[10px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
