const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data?.details?.map((d) => d.message).join(', ') ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export function getTickets({ status, page, limit }) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return request(`/tickets?${params}`);
}

export function getStats() {
  return request('/tickets/stats');
}

export function createTicket(ticket) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}

export function updateTicket(id, changes) {
  return request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}