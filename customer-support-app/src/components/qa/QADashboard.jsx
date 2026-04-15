import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  ClipboardCheck, AlertTriangle, Clock, Shield, Users,
  ChevronDown, ChevronUp, ArrowUpRight, CheckCircle, XCircle
} from 'lucide-react';
import './QADashboard.css';

export default function QADashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('escalated');

  useEffect(() => {
    api.getTickets(user.id, 'qa-reviewer')
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user.id]);

  const escalated = tickets.filter(t => 
    t.escalationLevel === 'QA_HEAD' || t.escalationLevel === 'L2' || t.slaBreached
  );
  const critical = tickets.filter(t => t.priority === 'Critical');
  const breached = tickets.filter(t => t.slaBreached);

  const displayed = filter === 'escalated' ? escalated :
                    filter === 'critical' ? critical :
                    filter === 'breached' ? breached : tickets;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="qa-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">✅ QA Review Dashboard</h2>
          <p className="page-subtitle">Review escalated tickets and ensure quality standards</p>
        </div>
      </div>

      {/* Stats */}
      <div className="qa-stats">
        <div className="qa-stat">
          <ArrowUpRight size={18} className="qa-stat-icon esc" />
          <div>
            <span className="qa-stat-val">{escalated.length}</span>
            <span className="qa-stat-lbl">Escalated</span>
          </div>
        </div>
        <div className="qa-stat">
          <AlertTriangle size={18} className="qa-stat-icon crit" />
          <div>
            <span className="qa-stat-val">{critical.length}</span>
            <span className="qa-stat-lbl">Critical</span>
          </div>
        </div>
        <div className="qa-stat">
          <XCircle size={18} className="qa-stat-icon breach" />
          <div>
            <span className="qa-stat-val">{breached.length}</span>
            <span className="qa-stat-lbl">SLA Breached</span>
          </div>
        </div>
        <div className="qa-stat">
          <Shield size={18} className="qa-stat-icon total" />
          <div>
            <span className="qa-stat-val">{tickets.length}</span>
            <span className="qa-stat-lbl">Total Tickets</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="qa-filters">
        {[
          { key: 'escalated', label: 'Escalated', count: escalated.length },
          { key: 'critical', label: 'Critical', count: critical.length },
          { key: 'breached', label: 'SLA Breached', count: breached.length },
          { key: 'all', label: 'All Tickets', count: tickets.length },
        ].map((f) => (
          <button
            key={f.key}
            className={`qa-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="qa-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="qa-ticket-list">
        {displayed.length === 0 ? (
          <div className="qa-empty">
            <CheckCircle size={32} />
            <p>No tickets in this category</p>
          </div>
        ) : (
          displayed.map((ticket) => (
            <div key={ticket.id} className={`qa-ticket-card ${ticket.slaBreached ? 'breached' : ''}`}>
              <div className="qa-ticket-header" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                <div className="qa-th-left">
                  {ticket.slaBreached && <AlertTriangle size={14} className="qa-breach-icon" />}
                  <span className="qa-th-id">{ticket.id}</span>
                  <span className="qa-th-title">{ticket.title}</span>
                </div>
                <div className="qa-th-right">
                  {ticket.escalationLevel && (
                    <span className={`escalation-badge esc-${ticket.escalationLevel?.toLowerCase()}`}>
                      {ticket.escalationLevel}
                    </span>
                  )}
                  <ModuleBadge module={ticket.module} />
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                  {expandedId === ticket.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              {expandedId === ticket.id && (
                <div className="qa-ticket-detail">
                  <div className="qa-td-grid">
                    <div><span className="qa-td-label">Raiser</span><span>{ticket.raiserName}</span></div>
                    <div><span className="qa-td-label">Resolver</span><span>{ticket.resolverName || 'Unassigned'}</span></div>
                    <div><span className="qa-td-label">Created</span><span>{new Date(ticket.createdAt).toLocaleString()}</span></div>
                    <div><span className="qa-td-label">SLA Deadline</span><span>{ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleString() : '—'}</span></div>
                    <div><span className="qa-td-label">Escalation</span><span>{ticket.escalationLevel || 'L1'}</span></div>
                    <div><span className="qa-td-label">SLA Status</span><span className={ticket.slaBreached ? 'qa-sla-bad' : 'qa-sla-good'}>{ticket.slaBreached ? '⚠ BREACHED' : '✓ On Track'}</span></div>
                  </div>
                  <div className="qa-td-desc">
                    <strong>Description:</strong>
                    <p>{ticket.description}</p>
                  </div>
                  {ticket.resolution && (
                    <div className="qa-td-resolution">
                      <strong>Resolution:</strong>
                      <p>{ticket.resolution}</p>
                    </div>
                  )}
                  {ticket.history?.length > 0 && (
                    <div className="qa-td-history">
                      <strong>History ({ticket.history.length})</strong>
                      {ticket.history.slice(-5).map((h, i) => (
                        <div key={i} className="qa-h-item">
                          <div className="qa-h-dot" />
                          <span className="qa-h-text">{h.detail}</span>
                          <span className="qa-h-meta">{h.by} · {new Date(h.at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
