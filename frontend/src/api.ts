import axios, { AxiosError, AxiosResponse } from 'axios';

export const API_ORIGIN = 'https://safa27.darkube.ir';

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/`,
});

// ✅ Request Interceptor: Add Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Response Interceptor: Handle 401 + Token Refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // اگر status 401 و هنوز refresh نکردیم
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // اگر refresh در حال انجام است، منتظر بمان
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // درخواست token جدید
        const refreshResponse = await axios.post(
          `${API_ORIGIN}/api/auth/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = refreshResponse.data?.access;

        if (newAccessToken) {
          // ذخیره token جدید
          localStorage.setItem('access_token', newAccessToken);

          // بروزرسانی header
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // اطلاع به subscribers
          onRefreshed(newAccessToken);

          isRefreshing = false;

          // دوباره درخواست اصلی
          return api(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError: any) {
        // Token refresh ناموفق - Logout
        console.error('[API] Token refresh failed:', refreshError.message);

        // پاک‌کردن tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        isRefreshing = false;
        refreshSubscribers = [];

        // هدایت به login
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;

        return Promise.reject(refreshError);
      }
    }

    // اگر 401 است و هنوز retry نشده، یا خطای دیگری است
    if (error.response?.status === 401) {
      // پاک‌کردن tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');

      isRefreshing = false;
      refreshSubscribers = [];

      // هدایت به login
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;