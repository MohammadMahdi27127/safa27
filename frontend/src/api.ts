import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AxiosResponse } from 'axios';

export const API_ORIGIN = 'https://safa27.darkube.ir';

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/`,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function clearStoredAuth(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
}

function redirectToLogin(): void {
  if (window.location.pathname === '/login') return;
  window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

// Add the current access token to every protected API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// A single shared refresh promise prevents concurrent 401 responses from
// triggering multiple refresh requests and rotating the same refresh token.
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url || '';

    // Never try to refresh a failed login or refresh request.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      requestUrl.includes('auth/login/') ||
      requestUrl.includes('auth/refresh/') ||
      requestUrl.includes('auth/logout/')
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearStoredAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      clearStoredAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_ORIGIN}/api/auth/refresh/`, { refresh: refreshToken })
          .then((response) => {
            const newAccessToken = response.data?.access;
            const newRefreshToken = response.data?.refresh;

            if (!newAccessToken) {
              throw new Error('Refresh response did not contain an access token.');
            }

            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }
            return newAccessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
