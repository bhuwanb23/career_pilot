export default function InputSection({ jd, url, onJdChange, onUrlChange, onAnalyze, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Job Description</h3>
            <p className="text-xs text-gray-400">Paste the JD or provide a URL to analyze</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Paste Job Description</label>
          <textarea
            value={jd}
            onChange={(e) => onJdChange(e.target.value)}
            rows={8}
            placeholder="We are looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and modern web technologies..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 resize-none transition-all leading-relaxed"
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[10px] text-gray-300">{jd.length} characters</span>
            {jd.length > 0 && (
              <button onClick={() => onJdChange("")} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[10px] text-gray-400 uppercase tracking-wider font-medium">or</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Job URL</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://company.com/careers/role"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading || (!jd.trim() && !url.trim())}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
              Analyze Job
            </>
          )}
        </button>
      </div>
    </div>
  );
}
