import { useState, useRef, useEffect } from "react";
import AgentMessage from "./AgentMessage";
import ToolCard from "./ToolCard";
import ThinkingIndicator from "./ThinkingIndicator";
import TaskCard from "./TaskCard";
import ActionCard from "./ActionCard";
import { processMessage, getToolDefinitions } from "../../services/agentEngine";
import { getTasks, completeTask, deleteTask, getChatHistory, addChatMessage, clearChatHistory } from "../../services/taskStore";

const suggestions = [
  { text: "Analyze this job", icon: "search" },
  { text: "Generate cover letter", icon: "edit" },
  { text: "Prepare interview kit", icon: "book" },
  { text: "Show my profile", icon: "user" },
  { text: "View applications", icon: "list" },
  { text: "Create task", icon: "plus" },
  { text: "List tasks", icon: "checklist" },
  { text: "Run pipeline", icon: "play" },
];

const suggestionIcons = {
  search: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  edit: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>,
  book: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>,
  user: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  list: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  plus: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  checklist: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  play: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653z" /></svg>,
};

export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileTasks, setShowMobileTasks] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const savedHistory = getChatHistory();
    if (savedHistory.length > 0) {
      setMessages(savedHistory);
    } else {
      setMessages([{
        id: 1,
        type: "response",
        content: "Hi! I'm your AI career assistant. I can help you with analyzing jobs, generating cover letters, preparing for interviews, and managing your applications.\n\nWhat would you like to do?",
        isUser: false,
      }]);
    }
    setTasks(getTasks());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: msg,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    addChatMessage(userMessage);
    setInput("");
    setIsProcessing(true);

    try {
      for await (const event of processMessage(msg)) {
        if (event.type === "thinking") {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), type: "thinking", content: event.content },
          ]);
        } else if (event.type === "tool_start") {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== "thinking"),
            { id: Date.now() + Math.random(), type: "tool", tool: event.tool, status: "running", description: event.description },
          ]);
        } else if (event.type === "tool_end") {
          setMessages((prev) =>
            prev.map((m) =>
              m.type === "tool" && m.tool === event.tool
                ? { ...m, status: event.success ? "complete" : "error" }
                : m
            )
          );
        } else if (event.type === "response") {
          const responseMsg = { id: Date.now() + Math.random(), type: "response", content: event.content, isUser: false };
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== "thinking"),
            responseMsg,
          ]);
          addChatMessage(responseMsg);
        } else if (event.type === "task_created") {
          setTasks(getTasks());
        } else if (event.type === "pipeline_start") {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), type: "action", actionType: "pipeline", steps: event.steps },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), type: "response", content: "I encountered an error. Please try again.", isUser: false },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleTask = (taskId) => {
    completeTask(taskId);
    setTasks(getTasks());
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
    setTasks(getTasks());
  };

  const handleClearHistory = () => {
    clearChatHistory();
    setMessages([{
      id: Date.now(),
      type: "response",
      content: "Chat history cleared. How can I help you?",
      isUser: false,
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-figma-hairline shadow-sm flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-3 border-b border-figma-hairline flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">AI Career Copilot</h3>
            <p className="text-[10px] text-gray-400">Always ready to help</p>
          </div>
          <button onClick={handleClearHistory} className="text-[10px] text-gray-400 hover:text-gray-600 transition-all-smooth px-2 py-1 rounded-lg hover:bg-figma-surface">
            Clear
          </button>
          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded-full">Beta</span>
          {/* Mobile tasks toggle */}
          <button
            onClick={() => setShowMobileTasks(!showMobileTasks)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-figma-surface transition-all-smooth"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {messages.map((msg) => {
            if (msg.type === "thinking") {
              return <ThinkingIndicator key={msg.id} message={msg.content} />;
            }
            if (msg.type === "tool") {
              const tools = getToolDefinitions();
              return <ToolCard key={msg.id} tool={tools[msg.tool]} status={msg.status} description={msg.description} />;
            }
            if (msg.type === "action" && msg.actionType === "pipeline") {
              return (
                <ActionCard
                  key={msg.id}
                  type="info"
                  title="Pipeline Started"
                  message={`Executing ${msg.steps.length} steps: ${msg.steps.join(" → ")}`}
                />
              );
            }
            return <AgentMessage key={msg.id} content={msg.content} isUser={msg.isUser} />;
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-5 py-2 flex gap-2 flex-wrap flex-shrink-0 border-t border-figma-hairline">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.text)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium hover:bg-brand-100 transition-all-smooth disabled:opacity-50"
            >
              {suggestionIcons[s.icon]}
              <span className="hidden sm:inline">{s.text}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 py-3 flex-shrink-0 border-t border-figma-hairline">
          <div className="flex items-center gap-2 bg-figma-surface rounded-xl border border-figma-hairline px-4 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI copilot..."
              disabled={isProcessing}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none disabled:opacity-50 min-w-0"
            />
            <button
              onClick={() => handleSend()}
              disabled={isProcessing || !input.trim()}
              className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all-smooth press-scale disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Sidebar - Desktop */}
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
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      </div>

      {/* Tasks Panel - Mobile (overlay) */}
      {showMobileTasks && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMobileTasks(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-figma-hairline flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
              <button onClick={() => setShowMobileTasks(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-figma-surface">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">No tasks yet</p>
                  <p className="text-[10px] text-gray-300 mt-1">Ask me to create one</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
