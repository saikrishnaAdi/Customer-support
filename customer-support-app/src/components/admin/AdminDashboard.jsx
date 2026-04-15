import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  BarChart3, Activity, FileText, AlertTriangle, Clock, Users,
  TrendingUp, Shield, CheckCircle, XCircle, ArrowUpRight
} from 'lucide-react';
import './AdminDashboard.css';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [slaReport, setSlaReport] = useState(null);
  const [resolverPerf, setResolverPerf] = useState(null);
  const [ticketAging, setTicketAging] = useState(null);
  const [csatReport, setCsatReport] = useState(null);
  const [moduleDist, setModuleDist] = useState(null);
  const [rules, setRules] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSLAReport().catch(() => null),
      api.getResolverPerformance().catch(() => null),
      api.getTicketAging().catch(() => null),
      api.getCSATReport().catch(() => null),
      api.getModuleDistribution().catch(() => null),
      api.getRules().catch(() => []),
      api.getAuditLog({ limit: 10 }).catch(() => []),
    ]).then(([sla, perf, aging, csat, mod, rules, audit]) => {
      setSlaReport(sla);
      setResolverPerf(perf);
      setTicketAging(aging);
      setCsatReport(csat);
      setModuleDist(mod);
      setRules(rules);
      setRecentAudit(Array.isArray(audit) ? audit : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <div className="admin-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">⚙️ Admin Dashboard</h2>
          <p className="page-subtitle">System overview, SLA compliance, and automation management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon sla"><Shield size={20} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{slaReport?.complianceRate || '—'}%</span>
            <span className="admin-stat-label">SLA Compliance</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon csat"><TrendingUp size={20} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{csatReport?.averageRating?.toFixed(1) || '—'}</span>
            <span className="admin-stat-label">Avg CSAT Rating</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon breach"><AlertTriangle size={20} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{slaReport?.breachedCount || 0}</span>
            <span className="admin-stat-label">SLA Breaches</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon rules"><Activity size={20} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{activeRules}/{rules.length}</span>
            <span className="admin-stat-label">Active Rules</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        {/* SLA Compliance Overview */}
        {slaReport && (
          <div className="admin-panel">
            <h3><Shield size={16} /> SLA Compliance</h3>
            <div className="sla-overview">
              <div className="sla-bar-wrapper">
                <div className="sla-bar">
                  <div className="sla-bar-fill" style={{ width: `${slaReport.complianceRate}%` }} />
                </div>
                <span className="sla-bar-label">{slaReport.complianceRate}% within SLA</span>
              </div>
              <div className="sla-stats-row">
                <div className="sla-mini">
                  <CheckCircle size={14} className="sla-ok" />
                  <span>{slaReport.withinSLA} On Track</span>
                </div>
                <div className="sla-mini">
                  <AlertTriangle size={14} className="sla-warn" />
                  <span>{slaReport.warningCount || 0} Warning</span>
                </div>
                <div className="sla-mini">
                  <XCircle size={14} className="sla-breach" />
                  <span>{slaReport.breachedCount} Breached</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolver Performance */}
        {resolverPerf && (
          <div className="admin-panel">
            <h3><Users size={16} /> Resolver Performance</h3>
            <div className="perf-list">
              {resolverPerf.map((r) => (
                <div key={r.resolverId} className="perf-row">
                  <div className="perf-avatar">{r.resolverName?.[0]}</div>
                  <div className="perf-info">
                    <strong>{r.resolverName}</strong>
                    <span>{r.totalResolved} resolved · {r.activeTickets} active</span>
                  </div>
                  <div className="perf-rating">
                    ⭐ {r.avgRating?.toFixed(1) || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module Distribution */}
        {moduleDist && (
          <div className="admin-panel">
            <h3><BarChart3 size={16} /> Module Distribution</h3>
            <div className="module-dist-list">
              {moduleDist.map((m) => (
                <div key={m.module} className="module-dist-row">
                  <span className="module-dist-name">{m.module}</span>
                  <div className="module-dist-bar">
                    <div className="module-dist-fill" style={{ width: `${Math.min(100, (m.count / Math.max(...moduleDist.map(d => d.count))) * 100)}%` }} />
                  </div>
                  <span className="module-dist-count">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Audit Log */}
        <div className="admin-panel">
          <h3><FileText size={16} /> Recent Audit Activity</h3>
          <div className="audit-preview-list">
            {recentAudit.length === 0 ? (
              <div className="audit-empty">No audit records yet</div>
            ) : (
              recentAudit.slice(0, 8).map((entry, i) => (
                <div key={i} className="audit-preview-item">
                  <div className="audit-preview-dot" />
                  <div className="audit-preview-content">
                    <span className="audit-preview-action">{entry.action}</span>
                    <span className="audit-preview-detail">{entry.entityType} {entry.entityId} by {entry.userName}</span>
                    <span className="audit-preview-time">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
