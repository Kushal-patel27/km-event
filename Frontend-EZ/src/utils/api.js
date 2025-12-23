const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export function getEvents() {
  return request('/api/events');
}

export function getEventById(id) {
  return request(`/api/events/${id}`);
}

export function createBooking(data, token) {
  return request('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
}

export function getMyBookings(token) {
  return request('/api/bookings/my', {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default {
  getEvents,
  getEventById,
  createBooking,
  getMyBookings,
};
