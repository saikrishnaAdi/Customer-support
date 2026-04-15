import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import AuditLog from '../components/admin/AuditLog';
import AutomationRules from '../components/admin/AutomationRules';
import KnowledgeBase from '../components/resolver/KnowledgeBase';
import ReportsDashboard from '../components/admin/ReportsDashboard';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#ef4444' }}>
          <h3>Something went wrong</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <ErrorBoundary>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="rules" element={<AutomationRules />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="kb" element={<KnowledgeBase />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
