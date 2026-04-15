import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { RAISER_STEPS, MODULES } from '../../data/constants';
import StepGuide from '../common/StepGuide';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  PlusCircle, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  ArrowRight, MessageSquare, BarChart3
} from 'lucide-react';
import './RaiserDashboard.css';

export default function RaiserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getTickets(user.id, 'raiser'),
      api.getRaiserStats(user.id),
    ]).then(([t, s]) => {
      setTickets(t);
      setStats(s);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="raiser-dashboard">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
          <p className="page-subtitle">Here's an overview of your support requests</p>
        </div>
        <button className="primary-btn" onClick={() => navigate('/raiser/new')}>
          <PlusCircle size={16} /> New Request
        </button>
      </div>

      <StepGuide steps={RAISER_STEPS.dashboard} currentStep={0} title="How to use the Dashboard" />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><BarChart3 size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.total || 0}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.open || 0}</span>
            <span className="stat-label">Open / In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.resolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.critical || 0}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
      </div>

      {/* Quick Module Access */}
      <div className="section-header">
        <h3>Quick Request by Module</h3>
      </div>
      <div className="module-grid">
        {MODULES.map((m) => (
          <button
            key={m.key}
            className="module-card"
            onClick={() => navigate(`/raiser/new?module=${m.key}`)}
          >
            <span className="module-card-icon">{m.icon}</span>
            <span className="module-card-key">{m.key}</span>
            <span className="module-card-label">{m.label}</span>
            <ArrowRight size={14} className="module-card-arrow" />
          </button>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="section-header">
        <h3>Recent Requests</h3>
        <button className="text-btn" onClick={() => navigate('/raiser/requests')}>
          View All <ArrowRight size={14} />
        </button>
      </div>
      {tickets.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={40} />
          <h3>No requests yet</h3>
          <p>Raise your first support request to get started!</p>
          <button className="primary-btn" onClick={() => navigate('/raiser/new')}>
            <PlusCircle size={16} /> Raise a Request
          </button>
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="ticket-row"
              onClick={() => navigate(`/raiser/request/${t.id}`)}
            >
              <div className="ticket-row-left">
                <span className="ticket-id">{t.id}</span>
                <span className="ticket-title-text">{t.title}</span>
              </div>
              <div className="ticket-row-right">
                <ModuleBadge module={t.module} />
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
                <span className="ticket-time">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
