import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  Eye, Shield, Clock, AlertTriangle, FileText, BarChart3,
  ChevronDown, ChevronUp, User, Search
} from 'lucide-react';
import './AuditorDashboard.css';

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slaReport, setSlaReport] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.getTickets(user.id, 'auditor').catch(() => []),
      api.getSLAReport().catch(() => null),
    ]).then(([tix, sla]) => {
      setTickets(tix);
      setSlaReport(sla);
      setLoading(false);
    });
  }, [user.id]);

  const filtered = tickets.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q) || t.module?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="auditor-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">🔍 Compliance Audit View</h2>
          <p className="page-subtitle">Read-only inspection of all tickets and SLA compliance</p>
        </div>
      </div>

      {/* Summary */}
      <div className="auditor-stats">
        <div className="auditor-stat">
          <Eye size={18} className="aud-icon" />
          <div>
            <span className="aud-val">{tickets.length}</span>
            <span className="aud-lbl">Total Tickets</span>
          </div>
        </div>
        <div className="auditor-stat">
          <Shield size={18} className="aud-icon sla" />
          <div>
            <span className="aud-val">{slaReport?.complianceRate || '—'}%</span>
            <span className="aud-lbl">SLA Compliance</span>
          </div>
        </div>
        <div className="auditor-stat">
          <AlertTriangle size={18} className="aud-icon breach" />
          <div>
            <span className="aud-val">{slaReport?.breachedCount || 0}</span>
            <span className="aud-lbl">SLA Breaches</span>
          </div>
        </div>
        <div className="auditor-stat">
          <Clock size={18} className="aud-icon pending" />
          <div>
            <span className="aud-val">{tickets.filter(t => !['Closed', 'Resolved'].includes(t.status)).length}</span>
            <span className="aud-lbl">Open Tickets</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="auditor-toolbar">
        <div className="auditor-search">
          <Search size={16} />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="auditor-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['New', 'Open', 'In Progress', 'Awaiting User', 'Resolved', 'Closed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="auditor-read-only-banner">
        <Eye size={14} />
        <span>Read-only mode — Viewing {filtered.length} tickets for compliance audit</span>
      </div>

      {/* Ticket List */}
      <div className="auditor-ticket-list">
        {filtered.map((ticket) => (
          <div key={ticket.id} className="auditor-ticket-card">
            <div className="auditor-ticket-header" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <div className="atc-left">
                <span className="atc-id">{ticket.id}</span>
                <span className="atc-title">{ticket.title}</span>
              </div>
              <div className="atc-right">
                <ModuleBadge module={ticket.module} />
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                {expandedId === ticket.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
            {expandedId === ticket.id && (
              <div className="auditor-ticket-detail">
                <div className="atd-grid">
                  <div className="atd-item"><span className="atd-label">Raiser</span><span>{ticket.raiserName}</span></div>
                  <div className="atd-item"><span className="atd-label">Resolver</span><span>{ticket.resolverName || 'Unassigned'}</span></div>
                  <div className="atd-item"><span className="atd-label">Created</span><span>{new Date(ticket.createdAt).toLocaleString()}</span></div>
                  <div className="atd-item"><span className="atd-label">SLA Deadline</span><span>{ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleString() : '—'}</span></div>
                  <div className="atd-item"><span className="atd-label">SLA Status</span><span className={`sla-badge ${ticket.slaBreached ? 'breached' : 'ok'}`}>{ticket.slaBreached ? '⚠ BREACHED' : '✓ On Track'}</span></div>
                  <div className="atd-item"><span className="atd-label">Escalation Level</span><span>{ticket.escalationLevel || 'L1'}</span></div>
                  {ticket.rating && <div className="atd-item"><span className="atd-label">Rating</span><span>⭐ {ticket.rating}/5</span></div>}
                  {ticket.feedback && <div className="atd-item"><span className="atd-label">Feedback</span><span>{ticket.feedback}</span></div>}
                </div>
                <div className="atd-desc">
                  <strong>Description:</strong>
                  <p>{ticket.description}</p>
                </div>
                {ticket.history?.length > 0 && (
                  <div className="atd-history">
                    <strong>Audit Trail ({ticket.history.length} entries)</strong>
                    <div className="atd-history-list">
                      {ticket.history.map((h, i) => (
                        <div key={i} className="atd-history-item">
                          <div className="atd-h-dot" />
                          <div className="atd-h-content">
                            <span className="atd-h-detail">{h.detail}</span>
                            <span className="atd-h-meta">{h.by} · {new Date(h.at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
