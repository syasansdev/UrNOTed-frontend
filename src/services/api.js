import axios from "axios";

const envUrl = import.meta.env.VITE_API_URL;
const rawBaseUrl = (envUrl && !envUrl.includes("fly.dev"))
  ? envUrl
  : (import.meta.env.DEV ? "http://localhost:5000" : "https://urnoted-backend.onrender.com");
const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor to inject Authorization header from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = originalRequest.url || "";
    const isAuthEndpoint =
      requestUrl.includes("auth/login") ||
      requestUrl.includes("auth/refresh") ||
      requestUrl.includes("auth/me");

    // Avoid infinite loop if request failed on auth endpoints or already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        // Pass the stored refresh token in the body as fallback for browsers blocking cookies
        const res = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        if (res.data?.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);
        }
        if (res.data?.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        // Apply new token to retried request
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (
          !isAuthEndpoint &&
          window.location.pathname !== "/login"
        ) {
          const redirectTo = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?redirect=${redirectTo}`;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
