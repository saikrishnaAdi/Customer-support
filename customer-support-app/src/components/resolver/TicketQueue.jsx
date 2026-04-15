import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { MODULES, STATUSES } from '../../data/constants';
import { StatusBadge, PriorityBadge, ModuleBadge } from '../common/StatusBadge';
import {
  Search, SlidersHorizontal, UserPlus, Clock, ArrowRight, Inbox, Filter
} from 'lucide-react';
import './TicketQueue.css';

export default function TicketQueue() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all'); // all | unassigned | mine
  const [showFilters, setShowFilters] = useState(false);

  const loadTickets = () => {
    if (!user) return;
    api.getTickets(user.id, 'resolver').then(setTickets).finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    const h = () => loadTickets();
    socket.on('ticket:created', h);
    socket.on('ticket:updated', h);
    return () => { socket.off('ticket:created', h); socket.off('ticket:updated', h); };
  }, [socket]);

  const assignToMe = async (e, ticketId) => {
    e.stopPropagation();
    await api.updateTicket(ticketId, { resolverId: user.id, status: 'Open', updatedBy: user.name });
    loadTickets();
  };

  const filtered = tickets.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule && t.module !== filterModule) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignment === 'unassigned' && t.resolverId) return false;
    if (filterAssignment === 'mine' && t.resolverId !== user.id) return false;
    return true;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="ticket-queue">
      <h2 className="page-title">Ticket Queue</h2>
      <p className="page-subtitle">All incoming and assigned support tickets</p>

      {/* Quick Filters */}
      <div className="quick-filters">
        <button
          className={`quick-filter-btn ${filterAssignment === 'all' ? 'active' : ''}`}
          onClick={() => setFilterAssignment('all')}
        >
          <Inbox size={14} /> All ({tickets.length})
        </button>
        <button
          className={`quick-filter-btn ${filterAssignment === 'unassigned' ? 'active' : ''}`}
          onClick={() => setFilterAssignment('unassigned')}
        >
          <Clock size={14} /> Unassigned ({tickets.filter((t) => !t.resolverId).length})
        </button>
        <button
          className={`quick-filter-btn ${filterAssignment === 'mine' ? 'active' : ''}`}
          onClick={() => setFilterAssignment('mine')}
        >
          <UserPlus size={14} /> My Tickets ({tickets.filter((t) => t.resolverId === user.id).length})
        </button>
      </div>

      <div className="requests-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <select className="filter-select" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m.key} value={m.key}>{m.key} - {m.label}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="clear-filters-btn" onClick={() => { setFilterModule(''); setFilterStatus(''); }}>
            Clear
          </button>
        </div>
      )}

      <div className="queue-count">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Inbox size={40} />
          <h3>Queue is empty</h3>
          <p>No tickets match your filters</p>
        </div>
      ) : (
        <div className="queue-list">
          {filtered.map((t) => (
            <div key={t.id} className={`queue-ticket ${t.priority === 'Critical' ? 'critical' : ''}`} onClick={() => navigate(`/resolver/ticket/${t.id}`)}>
              <div className="queue-ticket-main">
                <div className="queue-ticket-top">
                  <span className="queue-ticket-id">{t.id}</span>
                  <span className="queue-ticket-time">
                    <Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="queue-ticket-title">{t.title}</h4>
                <p className="queue-ticket-desc">{t.description?.substring(0, 100)}{t.description?.length > 100 ? '...' : ''}</p>
                <div className="queue-ticket-meta">
                  <span className="queue-raiser">From: {t.raiserName} ({t.raiserDept})</span>
                  {t.resolverName && <span className="queue-assigned">→ {t.resolverName}</span>}
                </div>
              </div>
              <div className="queue-ticket-side">
                <div className="queue-badges">
                  <ModuleBadge module={t.module} />
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
                {!t.resolverId && (
                  <button className="assign-btn" onClick={(e) => assignToMe(e, t.id)}>
                    <UserPlus size={14} /> Assign to Me
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
