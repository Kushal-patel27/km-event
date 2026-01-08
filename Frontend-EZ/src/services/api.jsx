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
    
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refreshRes = await API.post("/auth/refresh", {});
        const refreshed = refreshRes.data;
        if (refreshed?.token) {
          setAuthToken(refreshed.token);
          localStorage.setItem("authUser", JSON.stringify(refreshed));
          return API(original);
        }
      } catch (refreshErr) {
        // fall through to reject
      }
      setAuthToken(null);
      localStorage.removeItem("authUser");
    }
    return Promise.reject(error);
  }
);

export default API;
