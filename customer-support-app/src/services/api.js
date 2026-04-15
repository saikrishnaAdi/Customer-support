const API = 'http://localhost:4000/api';

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Tickets
  getTickets: (userId, role) => fetchJson(`${API}/tickets?userId=${userId}&role=${role}`),
  getTicket: (id) => fetchJson(`${API}/tickets/${id}`),
  createTicket: (data) => fetchJson(`${API}/tickets`, { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => fetchJson(`${API}/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getMessages: (ticketId) => fetchJson(`${API}/tickets/${ticketId}/messages`),
  escalateTicket: (id, data) => fetchJson(`${API}/tickets/${id}/escalate`, { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getResolverStats: (id) => fetchJson(`${API}/stats/resolver/${id}`),
  getRaiserStats: (id) => fetchJson(`${API}/stats/raiser/${id}`),

  // Emails
  getTicketEmails: (ticketId) => fetchJson(`${API}/tickets/${ticketId}/emails`),
  getUserEmails: (userEmail) => fetchJson(`${API}/emails?userEmail=${encodeURIComponent(userEmail)}`),
  sendEmail: (data) => fetchJson(`${API}/emails`, { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (userId) => fetchJson(`${API}/notifications/${userId}`),
  markNotificationRead: (id) => fetchJson(`${API}/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: (userId) => fetchJson(`${API}/notifications/mark-all-read`, { method: 'POST', body: JSON.stringify({ userId }) }),

  // Knowledge Base
  getKBArticles: (search, module) => fetchJson(`${API}/kb?${search ? `search=${encodeURIComponent(search)}` : ''}${module ? `&module=${module}` : ''}`),
  getKBArticle: (id) => fetchJson(`${API}/kb/${id}`),
  createKBArticle: (data) => fetchJson(`${API}/kb`, { method: 'POST', body: JSON.stringify(data) }),
  kbFeedback: (id, helpful) => fetchJson(`${API}/kb/${id}/feedback`, { method: 'POST', body: JSON.stringify({ helpful }) }),
  suggestKBArticles: (query) => fetchJson(`${API}/kb/suggest?query=${encodeURIComponent(query)}`),
  createKBFromTicket: (ticketId, createdBy) => fetchJson(`${API}/kb/from-ticket/${ticketId}`, { method: 'POST', body: JSON.stringify({ createdBy }) }),

  // Audit Log
  getAuditLog: (params = {}) => {
    const qs = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return fetchJson(`${API}/audit?${qs}`);
  },

  // Automation Rules
  getRules: () => fetchJson(`${API}/rules`),
  updateRule: (id, data) => fetchJson(`${API}/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Global Search
  search: (q) => fetchJson(`${API}/search?q=${encodeURIComponent(q)}`),

  // Reports
  getSLAReport: () => fetchJson(`${API}/reports/sla-compliance`),
  getResolverPerformance: () => fetchJson(`${API}/reports/resolver-performance`),
  getTicketAging: () => fetchJson(`${API}/reports/ticket-aging`),
  getCSATReport: () => fetchJson(`${API}/reports/csat`),
  getModuleDistribution: () => fetchJson(`${API}/reports/module-distribution`),
};
