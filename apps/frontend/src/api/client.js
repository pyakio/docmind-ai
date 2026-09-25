import axios from "axios";

// Base API URL pointing to Python FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("docmind_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem("docmind_token");
      localStorage.removeItem("docmind_user");
    }
    return Promise.reject(error);
  }
);

export default api;
