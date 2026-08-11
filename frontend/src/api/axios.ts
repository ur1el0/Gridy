import axios from 'axios';

// Get the base URL from Vite environment variables, default to local Django server
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // IMPORTANT: Allows sending HttpOnly cookies for JWT
});

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to append the access token
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and refresh the token
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token. We use a fresh axios instance to avoid looping
        // but ensure `withCredentials` is true to send the HttpOnly refresh token cookie.
        const response = await axios.post(`${BASE_URL}/token/refresh/`, {}, {
          withCredentials: true
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        // Refresh token failed (likely expired). Clear auth state and redirect.
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
