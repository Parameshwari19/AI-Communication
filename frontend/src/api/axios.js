/**
 * Centralized Axios instance.
 *
 * - Prefixes every request with the backend base URL (from env).
 * - Automatically attaches the stored JWT to outgoing requests.
 * - On a 401 response (expired/invalid token), clears the session and
 *   redirects to /login so the user can re-authenticate.
 */
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // transcription can take a few seconds; be generous
});

// --- Request interceptor: attach bearer token if present ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("acc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: handle expired/invalid sessions globally ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        window.location.pathname === "/login" ||
        window.location.pathname === "/register";
      localStorage.removeItem("acc_token");
      localStorage.removeItem("acc_user");
      if (!isAuthRoute) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
