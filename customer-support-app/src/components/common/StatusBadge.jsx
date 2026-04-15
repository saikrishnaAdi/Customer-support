import React from 'react';
import './StatusBadge.css';
import { STATUS_COLORS, PRIORITIES } from '../../data/constants';

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { color: '#64748b', bg: '#f8fafc' };
  return (
    <span className="status-badge" style={{ color: c.color, background: c.bg, borderColor: c.color + '30' }}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITIES.find((pr) => pr.key === priority) || { color: '#64748b', bg: '#f8fafc' };
  return (
    <span className="priority-badge" style={{ color: p.color, background: p.bg, borderColor: p.color + '30' }}>
      <span className="priority-dot" style={{ background: p.color }} />
      {priority}
    </span>
  );
}

export function ModuleBadge({ module }) {
  return <span className="module-badge">{module}</span>;
}
