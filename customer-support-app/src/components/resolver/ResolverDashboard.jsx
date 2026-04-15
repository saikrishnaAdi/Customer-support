import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { RESOLVER_STEPS, MODULES } from '../../data/constants';
import StepGuide from '../common/StepGuide';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  Inbox, CheckCircle2, Clock, TrendingUp, AlertTriangle, Users,
  ArrowRight, BarChart3, Zap, Star
} from 'lucide-react';
import './ResolverDashboard.css';

export default function ResolverDashboard() {
  const { user } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      api.getTickets(user.id, 'resolver'),
      api.getResolverStats(user.id),
    ]).then(([t, s]) => {
      setTickets(t);
      setStats(s);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => loadData();
    socket.on('ticket:created', handler);
    socket.on('ticket:updated', handler);
    return () => {
      socket.off('ticket:created', handler);
      socket.off('ticket:updated', handler);
    };
  }, [socket]);

  const unassigned = tickets.filter((t) => !t.resolverId);
  const myActive = tickets.filter((t) => t.resolverId === user?.id && !['Resolved', 'Closed'].includes(t.status));
  const critical = tickets.filter((t) => t.priority === 'Critical' && !['Resolved', 'Closed'].includes(t.status));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="resolver-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Resolver Dashboard 🛠️</h2>
          <p className="page-subtitle">Manage and resolve support tickets efficiently</p>
        </div>
        <div className="online-badge-large">
          <Users size={16} />
          <span>{onlineUsers.length} Online</span>
        </div>
      </div>

      <StepGuide steps={RESOLVER_STEPS.dashboard} currentStep={0} title="How to Use the Resolver Panel" />

      {/* Stats */}
      <div className="stats-grid four-col">
        <div className="stat-card accent-blue">
          <div className="stat-icon blue"><Inbox size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.total || 0}</span>
            <span className="stat-label">Total Assigned</span>
          </div>
        </div>
        <div className="stat-card accent-orange">
          <div className="stat-icon orange"><Clock size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.open || 0}</span>
            <span className="stat-label">Open</span>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.resolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
        <div className="stat-card accent-purple">
          <div className="stat-icon purple"><Star size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.csat || 'N/A'}</span>
            <span className="stat-label">CSAT Score</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Unassigned Queue */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><Zap size={16} className="section-icon red" /> Unassigned Queue ({unassigned.length})</h3>
            <button className="text-btn" onClick={() => navigate('/resolver/queue')}>View All <ArrowRight size={14} /></button>
          </div>
          {unassigned.length === 0 ? (
            <div className="mini-empty">All tickets assigned! 🎉</div>
          ) : (
            <div className="ticket-list-compact">
              {unassigned.slice(0, 5).map((t) => (
                <div key={t.id} className="compact-ticket" onClick={() => navigate(`/resolver/ticket/${t.id}`)}>
                  <div className="compact-left">
                    <span className="compact-id">{t.id}</span>
                    <span className="compact-title">{t.title}</span>
                  </div>
                  <div className="compact-right">
                    <ModuleBadge module={t.module} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Active Tickets */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><TrendingUp size={16} className="section-icon blue" /> My Active ({myActive.length})</h3>
          </div>
          {myActive.length === 0 ? (
            <div className="mini-empty">No active tickets. Pick from queue!</div>
          ) : (
            <div className="ticket-list-compact">
              {myActive.slice(0, 5).map((t) => (
                <div key={t.id} className="compact-ticket" onClick={() => navigate(`/resolver/ticket/${t.id}`)}>
                  <div className="compact-left">
                    <span className="compact-id">{t.id}</span>
                    <span className="compact-title">{t.title}</span>
                  </div>
                  <div className="compact-right">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        {critical.length > 0 && (
          <div className="dashboard-section critical-section">
            <div className="section-header">
              <h3><AlertTriangle size={16} className="section-icon red" /> Critical Tickets ({critical.length})</h3>
            </div>
            <div className="ticket-list-compact">
              {critical.map((t) => (
                <div key={t.id} className="compact-ticket critical" onClick={() => navigate(`/resolver/ticket/${t.id}`)}>
                  <div className="compact-left">
                    <span className="compact-id">{t.id}</span>
                    <span className="compact-title">{t.title}</span>
                  </div>
                  <div className="compact-right">
                    <ModuleBadge module={t.module} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module Distribution */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><BarChart3 size={16} className="section-icon purple" /> Tickets by Module</h3>
          </div>
          <div className="module-stats">
            {MODULES.map((m) => {
              const count = tickets.filter((t) => t.module === m.key).length;
              return (
                <div key={m.key} className="module-stat-row">
                  <span className="module-stat-icon">{m.icon}</span>
                  <span className="module-stat-name">{m.key}</span>
                  <div className="module-stat-bar">
                    <div className="module-stat-fill" style={{ width: `${tickets.length ? (count / tickets.length) * 100 : 0}%`, background: m.color }} />
                  </div>
                  <span className="module-stat-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
