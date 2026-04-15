import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import AuditLog from '../components/admin/AuditLog';
import ReportsDashboard from '../components/admin/ReportsDashboard';
import AuditorDashboard from '../components/auditor/AuditorDashboard';

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

export default function AuditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <ErrorBoundary>
            <Routes>
              <Route index element={<AuditorDashboard />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="reports" element={<ReportsDashboard />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
