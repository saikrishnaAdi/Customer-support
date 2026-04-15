import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3, Shield, Users, Clock, Star, PieChart, Download,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import './ReportsDashboard.css';

export default function ReportsDashboard() {
  const [slaReport, setSlaReport] = useState(null);
  const [resolverPerf, setResolverPerf] = useState(null);
  const [ticketAging, setTicketAging] = useState(null);
  const [csatReport, setCsatReport] = useState(null);
  const [moduleDist, setModuleDist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sla');

  useEffect(() => {
    Promise.all([
      api.getSLAReport().catch(() => null),
      api.getResolverPerformance().catch(() => null),
      api.getTicketAging().catch(() => null),
      api.getCSATReport().catch(() => null),
      api.getModuleDistribution().catch(() => null),
    ]).then(([sla, perf, aging, csat, mod]) => {
      setSlaReport(sla);
      setResolverPerf(perf);
      setTicketAging(aging);
      setCsatReport(csat);
      setModuleDist(mod);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const tabs = [
    { key: 'sla', label: 'SLA Compliance', icon: Shield },
    { key: 'performance', label: 'Resolver Performance', icon: Users },
    { key: 'aging', label: 'Ticket Aging', icon: Clock },
    { key: 'csat', label: 'CSAT Analytics', icon: Star },
    { key: 'modules', label: 'Module Distribution', icon: PieChart },
  ];

  return (
    <div className="reports-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">📊 Reports & Analytics</h2>
          <p className="page-subtitle">Comprehensive support performance metrics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary-cards">
        <div className="report-summary-card">
          <Shield size={18} className="rsc-icon sla" />
          <div className="rsc-value">{slaReport?.complianceRate || 0}%</div>
          <div className="rsc-label">SLA Compliance</div>
        </div>
        <div className="report-summary-card">
          <Star size={18} className="rsc-icon csat" />
          <div className="rsc-value">{csatReport?.averageRating?.toFixed(1) || '—'}</div>
          <div className="rsc-label">Avg CSAT</div>
        </div>
        <div className="report-summary-card">
          <AlertTriangle size={18} className="rsc-icon breach" />
          <div className="rsc-value">{slaReport?.breachedCount || 0}</div>
          <div className="rsc-label">Breached</div>
        </div>
        <div className="report-summary-card">
          <CheckCircle size={18} className="rsc-icon ok" />
          <div className="rsc-value">{slaReport?.totalTickets || 0}</div>
          <div className="rsc-label">Total Tickets</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`report-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="report-content">
        {activeTab === 'sla' && slaReport && (
          <div className="report-panel">
            <h3>SLA Compliance Report</h3>
            <div className="sla-report-bar">
              <div className="sla-report-fill" style={{ width: `${slaReport.complianceRate}%` }} />
            </div>
            <div className="sla-report-legend">
              <div className="sla-legend-item">
                <CheckCircle size={14} className="legend-ok" />
                <span>Within SLA: <strong>{slaReport.withinSLA}</strong></span>
              </div>
              <div className="sla-legend-item">
                <AlertTriangle size={14} className="legend-warn" />
                <span>Warning: <strong>{slaReport.warningCount || 0}</strong></span>
              </div>
              <div className="sla-legend-item">
                <XCircle size={14} className="legend-breach" />
                <span>Breached: <strong>{slaReport.breachedCount}</strong></span>
              </div>
            </div>
            {slaReport.byPriority && (
              <div className="sla-by-priority">
                <h4>By Priority</h4>
                {Object.entries(slaReport.byPriority).map(([priority, data]) => (
                  <div key={priority} className="sla-priority-row">
                    <span className={`priority-label p-${priority.toLowerCase()}`}>{priority}</span>
                    <div className="sla-priority-bar">
                      <div className="sla-priority-fill" style={{ width: `${data.compliance || 0}%` }} />
                    </div>
                    <span className="sla-priority-pct">{data.compliance || 0}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && resolverPerf && (
          <div className="report-panel">
            <h3>Resolver Performance</h3>
            <div className="perf-table">
              <div className="perf-table-header">
                <span>Resolver</span>
                <span>Active</span>
                <span>Resolved</span>
                <span>Avg Rating</span>
                <span>Avg Resolution</span>
              </div>
              {resolverPerf.map((r) => (
                <div key={r.resolverId} className="perf-table-row">
                  <div className="perf-name">
                    <div className="perf-name-avatar">{r.resolverName?.[0]}</div>
                    <span>{r.resolverName}</span>
                  </div>
                  <span className="perf-cell">{r.activeTickets}</span>
                  <span className="perf-cell">{r.totalResolved}</span>
                  <span className="perf-cell">⭐ {r.avgRating?.toFixed(1) || '—'}</span>
                  <span className="perf-cell">{r.avgResolutionTime || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'aging' && ticketAging && (
          <div className="report-panel">
            <h3>Ticket Aging Analysis</h3>
            <div className="aging-grid">
              {ticketAging.map((bucket) => (
                <div key={bucket.range} className="aging-card">
                  <div className="aging-count">{bucket.count}</div>
                  <div className="aging-range">{bucket.range}</div>
                  <div className="aging-bar">
                    <div className="aging-fill" style={{ width: `${Math.min(100, (bucket.count / Math.max(...ticketAging.map(b => b.count || 1))) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'csat' && csatReport && (
          <div className="report-panel">
            <h3>CSAT Analytics</h3>
            <div className="csat-hero">
              <div className="csat-hero-score">
                <Star size={28} className="csat-star" />
                <span className="csat-score-value">{csatReport.averageRating?.toFixed(1) || '—'}</span>
                <span className="csat-score-max">/5</span>
              </div>
              <span className="csat-total">{csatReport.totalRatings || 0} ratings</span>
            </div>
            {csatReport.distribution && (
              <div className="csat-distribution">
                <h4>Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = csatReport.distribution[star] || 0;
                  const max = Math.max(...Object.values(csatReport.distribution), 1);
                  return (
                    <div key={star} className="csat-dist-row">
                      <span className="csat-dist-label">{star} ⭐</span>
                      <div className="csat-dist-bar">
                        <div className="csat-dist-fill" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="csat-dist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {csatReport.feedbackCategories && Object.keys(csatReport.feedbackCategories).length > 0 && (
              <div className="csat-categories">
                <h4>Feedback Categories</h4>
                <div className="csat-cat-chips">
                  {Object.entries(csatReport.feedbackCategories).map(([cat, count]) => (
                    <span key={cat} className="csat-cat-chip">{cat} <strong>{count}</strong></span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'modules' && moduleDist && (
          <div className="report-panel">
            <h3>Module Distribution</h3>
            <div className="mod-dist-chart">
              {moduleDist.map((m) => {
                const max = Math.max(...moduleDist.map(d => d.count), 1);
                return (
                  <div key={m.module} className="mod-dist-row">
                    <span className="mod-dist-label">{m.module}</span>
                    <div className="mod-dist-bar">
                      <div className="mod-dist-fill" style={{ width: `${(m.count / max) * 100}%` }} />
                    </div>
                    <span className="mod-dist-count">{m.count} tickets</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
