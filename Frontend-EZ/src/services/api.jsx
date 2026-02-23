import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

const API = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete API.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
}

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("token");
  if (stored && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${stored}`;
  }
  config.withCredentials = true;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Silently handle 403 errors during login attempts (multi-endpoint fallback)
    const isLoginEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/admin/login') || original?.url?.includes('/auth/staff/login');
    if (error.response?.status === 403 && isLoginEndpoint) {
      error.config._silent403 = true; // Mark for silent handling
    }

    // Do not globally clear auth state on 401s.
    // Let feature-specific callers decide (e.g., AuthContext verify/session).
    // This prevents unintended logout on transient network changes.
    if (error.response?.status === 401) {
      original._retry = original?._retry || false;
      // No global side effects here; simply reject so caller can handle.
    }

    return Promise.reject(error);
  }
);

export default API;

// Help Center helpers
export const fetchHelpArticles = (params = {}) => API.get('/help', { params })
export const fetchHelpArticlesAdmin = (params = {}) => API.get('/help/admin/all', { params })
export const createHelpArticle = (data) => API.post('/help', data)
export const updateHelpArticle = (id, data) => API.put(`/help/${id}`, data)
export const deleteHelpArticle = (id) => API.delete(`/help/${id}`)
export const seedHelpArticlesAdmin = () => API.post('/help/admin/seed')

// Password reset helpers
export const requestPasswordResetOtp = (email) => API.post('/auth/password/forgot', { email })
export const verifyPasswordResetOtp = (data) => API.post('/auth/password/verify-otp', data)
export const resetPasswordWithToken = (data) => API.post('/auth/password/reset', data)

// Waitlist helpers
export const joinWaitlist = (data) => API.post('/waitlist/join', data)
export const leaveWaitlist = (waitlistId) => API.delete(`/waitlist/${waitlistId}`)
export const getMyWaitlist = (params = {}) => API.get('/waitlist/my-waitlist', { params })
export const getEventWaitlist = (eventId, params = {}) => API.get(`/waitlist/event/${eventId}`, { params })
export const getWaitlistAnalytics = (eventId) => API.get(`/waitlist/event/${eventId}/analytics`)
export const triggerWaitlistNotification = (eventId, data) => API.post(`/waitlist/event/${eventId}/notify`, data)
