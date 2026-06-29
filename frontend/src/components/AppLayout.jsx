import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import RightSidebar from "./RightSidebar";

export default function AppLayout({ children, leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [activeTab, setActiveTab] = useState("Workspace");

  return (
    <div className="h-screen flex flex-col bg-figma-surface overflow-hidden">
      <TopNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={leftCollapsed} onToggleCollapse={onToggleLeft} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          {children}
        </main>

        <RightSidebar isCollapsed={rightCollapsed} onToggleCollapse={onToggleRight} />
      </div>
    </div>
  );
}
