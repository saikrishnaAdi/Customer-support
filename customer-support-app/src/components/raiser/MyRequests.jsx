import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import { MODULES, STATUSES } from '../../data/constants';
import { Search, Filter, ArrowRight, Clock, SlidersHorizontal } from 'lucide-react';
import './MyRequests.css';

export default function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getTickets(user.id, 'raiser').then(setTickets).finally(() => setLoading(false));
  }, [user]);

  const filtered = tickets.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule && t.module !== filterModule) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="my-requests">
      <h2 className="page-title">My Requests</h2>
      <p className="page-subtitle">View and track all your support requests</p>

      <div className="requests-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input type="text" placeholder="Search by title or ticket ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <select className="filter-select" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m.key} value={m.key}>{m.icon} {m.key}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="clear-filters-btn" onClick={() => { setFilterModule(''); setFilterStatus(''); setFilterPriority(''); }}>
            Clear All
          </button>
        </div>
      )}

      <div className="requests-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={40} />
          <h3>No requests found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="requests-list">
          {filtered.map((t) => (
            <div key={t.id} className="request-card" onClick={() => navigate(`/raiser/request/${t.id}`)}>
              <div className="request-card-top">
                <span className="request-card-id">{t.id}</span>
                <div className="request-card-badges">
                  <ModuleBadge module={t.module} />
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <h4 className="request-card-title">{t.title}</h4>
              <p className="request-card-desc">{t.description?.substring(0, 120)}{t.description?.length > 120 ? '...' : ''}</p>
              <div className="request-card-footer">
                <div className="request-card-meta">
                  <Clock size={12} />
                  <span>{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {t.resolverName && <span className="request-card-resolver">Assigned to: {t.resolverName}</span>}
                <ArrowRight size={14} className="request-card-arrow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
