import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

    // Avoid refresh loops: our backend refresh route requires a valid token, so
    // if we hit 401, clear session and surface the error without retrying.
    if (error.response?.status === 401) {
      if (!original?._retry && !original?.url?.includes('/auth/refresh')) {
        original._retry = true;
        // Clear local auth state
        setAuthToken(null);
        localStorage.removeItem('authUser');
      }
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
