import axios from "axios";
import { normalizeApiError } from "../utils/errorHandler.js";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/**
 * Pre-configured Axios instance for ULPF backend.
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000
});

// Response interceptor to normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  }
);

export default apiClient;
