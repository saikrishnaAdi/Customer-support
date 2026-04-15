import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import ResolverDashboard from '../components/resolver/ResolverDashboard';
import TicketQueue from '../components/resolver/TicketQueue';
import TicketWorkspace from '../components/resolver/TicketWorkspace';
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
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#94a3b8' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ResolverPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <ErrorBoundary>
          <Routes>
            <Route index element={<ResolverDashboard />} />
            <Route path="queue" element={<TicketQueue />} />
            <Route path="ticket/:id" element={<TicketWorkspace />} />
            <Route path="kb" element={<KnowledgeBase />} />
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="agents" element={<TeamPage />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function TeamPage() {
  const team = [
    { name: 'David Chen', status: 'Online', tickets: 8, csat: '4.7' },
    { name: 'Sarah Johnson', status: 'Online', tickets: 5, csat: '4.8' },
  ];
  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 className="page-title">👥 Team</h2>
      <p className="page-subtitle">Support team members and availability</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {team.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{t.name.split(' ').map(n => n[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14, color: '#1e293b' }}>{t.name}</strong>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>● {t.status}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.tickets} active</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>CSAT: {t.csat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
