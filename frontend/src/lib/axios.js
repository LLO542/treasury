import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - retry logic and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Don't retry if no config or already retried
    if (!config || config._retry) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx errors (max 3 retries)
    const shouldRetry =
      (!error.response || error.response.status >= 500) &&
      config._retryCount < 3;

    if (shouldRetry) {
      config._retryCount = (config._retryCount || 0) + 1;
      config._retry = config._retryCount >= 3;

      // Exponential backoff
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    // Handle 401 - clear token
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
