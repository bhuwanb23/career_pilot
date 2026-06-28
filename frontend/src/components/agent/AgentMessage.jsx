function formatMessage(content) {
  if (!content) return null;

  const lines = content.split("\n");
  return lines.map((line, i) => {
    let formatted = line;

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700">$1</code>');

    if (formatted.startsWith("• ") || formatted.startsWith("- ")) {
      return (
        <div key={i} className="flex items-start gap-2 ml-2">
          <span className="text-gray-400 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
        </div>
      );
    }

    if (formatted === "---") {
      return <hr key={i} className="my-2 border-gray-200" />;
    }

    if (formatted.trim() === "") {
      return <div key={i} className="h-2" />;
    }

    return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

export default function AgentMessage({ content, isUser = false }) {
  if (isUser) {
    return (
      <div className="flex justify-end fade-in">
        <div className="max-w-[80%] bg-brand-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] shadow-sm">
        <div className="text-sm text-gray-700 space-y-1">
          {formatMessage(content)}
        </div>
      </div>
    </div>
  );
}
