/**
 * Thin wrapper functions around the Axios instance, one per backend
 * endpoint. Keeping these in one place means pages/components never
 * construct URLs or request shapes themselves.
 */
import api from "./axios";

// --- Auth ---
export const registerUser = (data) => api.post("/api/auth/register", data);
export const loginUser = (data) => api.post("/api/auth/login", data);
export const fetchCurrentUser = () => api.get("/api/auth/me");

// --- Speech analysis (transcribe + analyze, not yet saved) ---
export const transcribeAndAnalyze = (audioBlob, filename = "recording.webm") => {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  return api.post("/api/speech/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- Reports ---
export const saveReport = (data) => api.post("/api/reports", data);
export const listReports = (skip = 0, limit = 50) =>
  api.get(`/api/reports?skip=${skip}&limit=${limit}`);
export const getReport = (id) => api.get(`/api/reports/${id}`);
export const deleteReport = (id) => api.delete(`/api/reports/${id}`);
export const getDashboardStats = () => api.get("/api/reports/stats/dashboard");
