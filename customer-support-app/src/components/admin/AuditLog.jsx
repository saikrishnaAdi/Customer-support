import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Search, Filter, Download, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import './AuditLog.css';

const PAGE_SIZE = 25;

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getAuditLog({ action: filterAction, entity: filterEntity })
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filterAction, filterEntity]);

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.action?.toLowerCase().includes(q) ||
      e.entityId?.toLowerCase().includes(q) ||
      e.userName?.toLowerCase().includes(q) ||
      e.details?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actions = [...new Set(entries.map((e) => e.action))].filter(Boolean).sort();
  const entities = [...new Set(entries.map((e) => e.entityType))].filter(Boolean).sort();

  const exportCSV = () => {
    const header = 'Timestamp,Action,Entity Type,Entity ID,User,Details\n';
    const rows = filtered.map((e) =>
      `"${new Date(e.timestamp).toISOString()}","${e.action}","${e.entityType}","${e.entityId}","${e.userName}","${(e.details || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionColor = (action) => {
    if (action?.includes('CREATE') || action?.includes('create')) return '#16a34a';
    if (action?.includes('UPDATE') || action?.includes('update') || action?.includes('STATUS')) return '#3b82f6';
    if (action?.includes('ESCALAT') || action?.includes('escalat')) return '#f97316';
    if (action?.includes('BREACH') || action?.includes('breach')) return '#ef4444';
    return '#64748b';
  };

  return (
    <div className="audit-log">
      <div className="page-title-row">
        <div>
          <h2 className="page-title">📋 Audit Log</h2>
          <p className="page-subtitle">Complete compliance trail of all system actions</p>
        </div>
        <button className="secondary-btn" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Search size={16} />
          <input type="text" placeholder="Search audit entries..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="audit-filter" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="audit-filter" value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}>
          <option value="">All Entities</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="audit-count">{filtered.length} entries</div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((entry, i) => (
                  <tr key={i}>
                    <td className="audit-time">
                      <Clock size={12} />
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="audit-action-badge" style={{ color: actionColor(entry.action) }}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="audit-entity">{entry.entityType}</td>
                    <td className="audit-entity-id">{entry.entityId}</td>
                    <td className="audit-user">
                      <User size={12} /> {entry.userName}
                    </td>
                    <td className="audit-details">{entry.details}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan="6" className="audit-empty-row">No audit entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="audit-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
