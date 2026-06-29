import AppLayout from "../components/AppLayout";
import AgentChat from "../components/agent/AgentChat";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email?.split("@")[0] || "there";
  } catch {
    return "there";
  }
}

export default function Workspace({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const userName = getFirstName();
  const greeting = getGreeting();

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}, {userName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your AI career assistant is ready to help</p>
        </div>

        <div className="flex-1 min-h-0">
          <AgentChat />
        </div>
      </div>
    </AppLayout>
  );
}
