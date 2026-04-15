import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RaiserDashboard from '../components/raiser/RaiserDashboard';
import NewRequest from '../components/raiser/NewRequest';
import MyRequests from '../components/raiser/MyRequests';
import RequestDetail from '../components/raiser/RequestDetail';

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

export default function RaiserPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <ErrorBoundary>
          <Routes>
            <Route index element={<RaiserDashboard />} />
            <Route path="new" element={<NewRequest />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="request/:id" element={<RequestDetail />} />
            <Route path="help" element={<HelpPage />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function HelpPage() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 className="page-title">Help & FAQ</h2>
      <p className="page-subtitle">Frequently asked questions and guides</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        {[
          { q: 'How do I raise a support request?', a: 'Go to "New Request" from the sidebar or dashboard. Select the eQMS module, fill in the details, and submit.' },
          { q: 'How do I chat with support?', a: 'Open your ticket from "My Requests" and use the Chat tab to communicate with your assigned resolver.' },
          { q: 'Can I make audio/video calls?', a: 'Yes! In the ticket detail page, switch to the "Calls" tab and choose Audio or Video call.' },
          { q: 'What is Remote Control?', a: 'The support resolver can request access to view/control your screen to directly fix issues. You must approve the request.' },
          { q: 'How do I track my ticket status?', a: 'Visit "My Requests" to see all your tickets with real-time status updates.' },
          { q: 'What eQMS modules are supported?', a: 'TMS (Training), CMS (Documents), CCN (Change Control), CAPA, Deviation, and Note to File.' },
        ].map((faq, i) => (
          <details key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
            <summary style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', cursor: 'pointer' }}>{faq.q}</summary>
            <p style={{ fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
