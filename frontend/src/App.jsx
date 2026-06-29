import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import ProfilePage from "./pages/ProfilePage";
import JobAnalysis from "./pages/JobAnalysis";
import Applications from "./pages/Applications";
import InterviewHub from "./pages/InterviewHub";
import OutreachHub from "./pages/OutreachHub";
import Pipeline from "./pages/Pipeline";
import Approved from "./pages/Approved";

function ProtectedRoute({ children, leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight });
}

function GuestRoute({ children }) {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const sidebarProps = {
    leftCollapsed,
    rightCollapsed,
    onToggleLeft: () => setLeftCollapsed(!leftCollapsed),
    onToggleRight: () => setRightCollapsed(!rightCollapsed),
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <Dashboard {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/workspace" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <Workspace {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <ProfilePage {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <JobAnalysis {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/kanban" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <Applications {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <InterviewHub {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/outreach" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <OutreachHub {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/pipeline" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <Pipeline {...props} />}
          </ProtectedRoute>
        } />
        <Route path="/approved" element={
          <ProtectedRoute {...sidebarProps}>
            {(props) => <Approved {...props} />}
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
