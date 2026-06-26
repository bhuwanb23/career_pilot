import { useState } from "react";

export default function InputSection({ onAnalyze }) {
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Analyze a Job</h3>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* JD textarea */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={6}
            placeholder="Paste the job description here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none transition-all"
          />
        </div>

        {/* URL + button */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Or paste job URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com/careers/..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
          />
          <button
            onClick={() => onAnalyze?.()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Analyze Job
          </button>
        </div>
      </div>
    </div>
  );
}
