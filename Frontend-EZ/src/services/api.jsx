import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BASE}/api`,
});

export default API;
