// Support API services — audit, automation, reports

const API = 'http://localhost:4000/api';

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Audit Log
export function getAuditLog(params = {}) {
  const qs = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return fetchJson(`${API}/audit?${qs}`);
}

// Automation Rules
export function getRules() {
  return fetchJson(`${API}/rules`);
}

export function updateRule(id, data) {
  return fetchJson(`${API}/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// Reports
export function getSLAReport() {
  return fetchJson(`${API}/reports/sla-compliance`);
}

export function getResolverPerformance() {
  return fetchJson(`${API}/reports/resolver-performance`);
}

export function getTicketAging() {
  return fetchJson(`${API}/reports/ticket-aging`);
}

export function getCSATReport() {
  return fetchJson(`${API}/reports/csat`);
}

export function getModuleDistribution() {
  return fetchJson(`${API}/reports/module-distribution`);
}
