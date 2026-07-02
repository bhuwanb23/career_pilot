import { useState, useRef, useEffect } from "react";
import AgentMessage from "./AgentMessage";
import ToolCard from "./ToolCard";
import ThinkingIndicator from "./ThinkingIndicator";
import TaskCard from "./TaskCard";
import ActionCard from "./ActionCard";
import { sendChatMessage, checkHealth } from "../../services/api";
import { getTasks, completeTask, deleteTask, getChatHistory, addChatMessage, clearChatHistory } from "../../services/taskStore";
import { useAgent } from "../../context/AgentContext";

const SESSION_KEY = "chatSessionId";

const suggestions = [
  { text: "I want to upload my resume", icon: "upload" },
  { text: "Analyze this job: React developer with 3 years experience", icon: "search" },
  { text: "Generate a cover letter for Google", icon: "edit" },
  { text: "Prepare interview for Amazon", icon: "book" },
  { text: "Show my profile", icon: "user" },
  { text: "Show my applications", icon: "list" },
];

const suggestionIcons = {
  search: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  edit: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>,
  book: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>,
  user: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  list: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  upload: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V8.25A2.25 2.25 0 0018.75 6H14.25a1.5 1.5 0 00-1.5 1.5v1.5m-3 0V6.75" /></svg>,
};

export default function AgentChat() {
  const { dispatchUiActions } = useAgent();
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [llmStatus, setLlmStatus] = useState("checking");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(localStorage.getItem(SESSION_KEY) || null);
  const msgIdRef = useRef(Date.now());

  useEffect(() => {
    const savedHistory = getChatHistory();
    if (savedHistory.length > 0) {
      setMessages(savedHistory);
    } else {
      setMessages([{
        id: 1,
        type: "response",
        content: "Hi! I'm your AI career assistant. I can help you:\n\n• **Upload your resume** — I'll parse it and create your profile\n• **Analyze jobs** — Get match scores and recommendations\n• **Generate cover letters** — Tailored to each role\n• **Prepare for interviews** — Questions and STAR answers\n• **Show your profile** — View your career summary\n• **Show applications** — Track your job applications\n\nWhat would you like to do?",
        isUser: false,
      }]);
    }
    setTasks(getTasks());
  }, []);

  useEffect(() => {
    checkHealth()
      .then((h) => setLlmStatus(h.llm ? "connected" : "offline"))
      .catch(() => setLlmStatus("offline"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || isProcessing) return;

    const userMessage = { id: ++msgIdRef.current, type: "user", content: msg, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    addChatMessage(userMessage);
    setInput("");
    setIsProcessing(true);

    setMessages((prev) => [...prev, { id: ++msgIdRef.current, type: "thinking", content: "Processing your request..." }]);

    try {
      const result = await sendChatMessage(msg, sessionIdRef.current);
      sessionIdRef.current = result.session_id;
      localStorage.setItem(SESSION_KEY, result.session_id);

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.type !== "thinking");

        if (result.tool_trace?.length) {
          for (const trace of result.tool_trace) {
            filtered.push({
              id: ++msgIdRef.current,
              type: "tool",
              tool: { name: trace.tool, color: trace.status === "error" ? "gray" : "brand" },
              status: trace.status === "error" ? "error" : "complete",
              description: trace.result_preview || "",
            });
          }
        }

        if (result.ui_actions?.length) {
          dispatchUiActions(result.ui_actions);
          filtered.push({
            id: ++msgIdRef.current,
            type: "actions",
            actions: result.ui_actions,
          });
        } else if (result.action_type) {
          filtered.push({
            id: ++msgIdRef.current,
            type: "action",
            actionType: result.action_type,
            actionData: result.action_data,
          });
        }

        const responseMsg = { id: ++msgIdRef.current, type: "response", content: result.response, isUser: false };
        addChatMessage(responseMsg);
        filtered.push(responseMsg);

        return filtered;
      });
    } catch (err) {
      const msg = err.status === 503
        ? "AI service unavailable. Is Ollama running?"
        : (err.message || "Is the backend running at http://localhost:8000?");
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "thinking"),
        { id: ++msgIdRef.current, type: "response", content: `Error: ${msg}`, isUser: false },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleTask = (taskId) => { completeTask(taskId); setTasks(getTasks()); };
  const handleDeleteTask = (taskId) => { deleteTask(taskId); setTasks(getTasks()); };
  const handleClearHistory = () => {
    clearChatHistory();
    localStorage.removeItem(SESSION_KEY);
    sessionIdRef.current = null;
    setMessages([{ id: ++msgIdRef.current, type: "response", content: "Chat history cleared. How can I help you?", isUser: false }]);
  };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="h-full flex gap-4">
      <div className="flex-1 bg-white rounded-2xl border border-figma-hairline shadow-sm flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-figma-hairline flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">AI Career Copilot</h3>
            <p className="text-[10px] text-gray-400">
              {llmStatus === "checking" && "Checking AI connection..."}
              {llmStatus === "connected" && "Ollama connected"}
              {llmStatus === "offline" && "Ollama offline — start Ollama to chat"}
            </p>
          </div>
          <button onClick={handleClearHistory} className="text-[10px] text-gray-400 hover:text-gray-600 transition-all-smooth px-2 py-1 rounded-lg hover:bg-figma-surface">
            Clear
          </button>
          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded-full">Beta</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {messages.map((msg) => {
            if (msg.type === "thinking") return <ThinkingIndicator key={msg.id} message={msg.content} />;
            if (msg.type === "action") {
              return (
                <ActionCard
                  key={msg.id}
                  type="info"
                  title={`Action: ${msg.actionType}`}
                  message={msg.actionData ? JSON.stringify(msg.actionData) : "Completed"}
                />
              );
            }
            if (msg.type === "actions") {
              return (
                <div key={msg.id} className="space-y-2">
                  {msg.actions.map((a, i) => (
                    <ActionCard
                      key={i}
                      type="success"
                      title={a.action.replace(/_/g, " ")}
                      message={a.path || a.target || (a.application_id ? `App #${a.application_id}` : a.message || "")}
                    />
                  ))}
                </div>
              );
            }
            if (msg.type === "tool") {
              const tools = { search: { name: "analyze_job", icon: "search", color: "brand" }, edit: { name: "generate_cover_letter", icon: "edit", color: "emerald" }, book: { name: "prepare_interview", icon: "book", color: "amber" }, user: { name: "get_profile", icon: "user", color: "gray" }, list: { name: "get_applications", icon: "list", color: "gray" } };
              return <ToolCard key={msg.id} tool={tools[msg.tool] || tools.search} status={msg.status || "complete"} />;
            }
            return <AgentMessage key={msg.id} content={msg.content} isUser={msg.isUser} />;
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-2 flex gap-2 flex-wrap flex-shrink-0 border-t border-figma-hairline">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSend(s.text)} disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium hover:bg-brand-100 transition-all-smooth disabled:opacity-50">
              {suggestionIcons[s.icon]}
              <span className="hidden sm:inline">{s.text}</span>
            </button>
          ))}
        </div>

        <div className="px-5 py-3 flex-shrink-0 border-t border-figma-hairline">
          <div className="flex items-center gap-2 bg-figma-surface rounded-xl border border-figma-hairline px-4 py-2.5">
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="Ask your AI copilot..." disabled={isProcessing}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none disabled:opacity-50 min-w-0" />
            <button onClick={() => handleSend()} disabled={isProcessing || !input.trim()}
              className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all-smooth press-scale disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-72 bg-white rounded-2xl border border-figma-hairline shadow-sm flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-figma-hairline flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
          <span className="text-[10px] text-gray-400">{tasks.filter((t) => !t.completed).length} pending</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">No tasks yet</p>
              <p className="text-[10px] text-gray-300 mt-1">Ask me to create one</p>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />)
          )}
        </div>
      </div>
    </div>
  );
}
