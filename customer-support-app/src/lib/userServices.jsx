// User API services — stats, notifications, emails

const API = 'http://localhost:4000/api';

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Stats
export function getResolverStats(id) {
  return fetchJson(`${API}/stats/resolver/${id}`);
}

export function getRaiserStats(id) {
  return fetchJson(`${API}/stats/raiser/${id}`);
}

// Emails
export function getUserEmails(userEmail) {
  return fetchJson(`${API}/emails?userEmail=${encodeURIComponent(userEmail)}`);
}

export function sendEmail(data) {
  return fetchJson(`${API}/emails`, { method: 'POST', body: JSON.stringify(data) });
}

// Notifications
export function getNotifications(userId) {
  return fetchJson(`${API}/notifications/${userId}`);
}

export function markNotificationRead(id) {
  return fetchJson(`${API}/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(userId) {
  return fetchJson(`${API}/notifications/mark-all-read`, { method: 'POST', body: JSON.stringify({ userId }) });
}
