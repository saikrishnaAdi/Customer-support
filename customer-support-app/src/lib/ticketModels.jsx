// Ticket-related constants, types, and model helpers

export const MODULES = [
  { key: 'TMS', label: 'Training Management System', icon: '🎓', color: '#6366f1' },
  { key: 'CMS', label: 'Content Management System', icon: '📄', color: '#0ea5e9' },
  { key: 'CCN', label: 'Change Control Notice', icon: '🔄', color: '#f59e0b' },
  { key: 'CAPA', label: 'Corrective & Preventive Action', icon: '🛡️', color: '#ef4444' },
  { key: 'DEVIATION', label: 'Deviation', icon: '⚠️', color: '#f97316' },
  { key: 'NTF', label: 'Note to File', icon: '📝', color: '#10b981' },
];

export const PRIORITIES = [
  { key: 'Critical', color: '#dc2626', bg: '#fef2f2' },
  { key: 'High', color: '#ea580c', bg: '#fff7ed' },
  { key: 'Medium', color: '#ca8a04', bg: '#fefce8' },
  { key: 'Low', color: '#16a34a', bg: '#f0fdf4' },
];

export const STATUSES = ['New', 'Open', 'In Progress', 'Awaiting User', 'Resolved', 'Closed', 'Reopened'];

export const STATUS_COLORS = {
  'New': { color: '#6366f1', bg: '#eef2ff' },
  'Open': { color: '#0ea5e9', bg: '#f0f9ff' },
  'In Progress': { color: '#f59e0b', bg: '#fffbeb' },
  'Awaiting User': { color: '#a855f7', bg: '#faf5ff' },
  'Resolved': { color: '#16a34a', bg: '#f0fdf4' },
  'Closed': { color: '#64748b', bg: '#f8fafc' },
  'Reopened': { color: '#ef4444', bg: '#fef2f2' },
};

export const CATEGORIES = ['Bug', 'How-To', 'Access Request', 'Data Issue', 'Configuration', 'General'];

export function getModuleByKey(key) {
  return MODULES.find((m) => m.key === key) || null;
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || { color: '#64748b', bg: '#f8fafc' };
}

export function getPriorityConfig(priority) {
  return PRIORITIES.find((p) => p.key === priority) || PRIORITIES[2];
}
