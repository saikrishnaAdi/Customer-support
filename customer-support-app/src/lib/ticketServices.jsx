// Ticket API services — all ticket-related backend calls

const API = 'http://localhost:4000/api';

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Ticket CRUD
export function getTickets(userId, role) {
  return fetchJson(`${API}/tickets?userId=${userId}&role=${role}`);
}

export function getTicket(id) {
  return fetchJson(`${API}/tickets/${id}`);
}

export function createTicket(data) {
  return fetchJson(`${API}/tickets`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateTicket(id, data) {
  return fetchJson(`${API}/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function escalateTicket(id, data) {
  return fetchJson(`${API}/tickets/${id}/escalate`, { method: 'POST', body: JSON.stringify(data) });
}

// Ticket messages
export function getMessages(ticketId) {
  return fetchJson(`${API}/tickets/${ticketId}/messages`);
}

// Ticket emails
export function getTicketEmails(ticketId) {
  return fetchJson(`${API}/tickets/${ticketId}/emails`);
}

// Knowledge Base
export function getKBArticles(search, module) {
  return fetchJson(`${API}/kb?${search ? `search=${encodeURIComponent(search)}` : ''}${module ? `&module=${module}` : ''}`);
}

export function getKBArticle(id) {
  return fetchJson(`${API}/kb/${id}`);
}

export function createKBArticle(data) {
  return fetchJson(`${API}/kb`, { method: 'POST', body: JSON.stringify(data) });
}

export function kbFeedback(id, helpful) {
  return fetchJson(`${API}/kb/${id}/feedback`, { method: 'POST', body: JSON.stringify({ helpful }) });
}

export function suggestKBArticles(query) {
  return fetchJson(`${API}/kb/suggest?query=${encodeURIComponent(query)}`);
}

export function createKBFromTicket(ticketId, createdBy) {
  return fetchJson(`${API}/kb/from-ticket/${ticketId}`, { method: 'POST', body: JSON.stringify({ createdBy }) });
}

// Global search
export function search(q) {
  return fetchJson(`${API}/search?q=${encodeURIComponent(q)}`);
}
