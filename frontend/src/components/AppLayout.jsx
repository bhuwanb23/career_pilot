import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import RightSidebar from "./RightSidebar";

export default function AppLayout({ children }) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Workspace");

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        <RightSidebar isCollapsed={rightCollapsed} onToggleCollapse={() => setRightCollapsed(!rightCollapsed)} />
      </div>
    </div>
  );
}
