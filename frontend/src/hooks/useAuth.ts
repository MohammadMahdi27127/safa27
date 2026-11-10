import { useState, useEffect, useCallback } from 'react';
import API from '../api';

interface User {
  id: number;
  group_code: string;
  full_name: string;
  is_manager: boolean;
  is_resolution_officer: boolean;
  is_workgroup_leader: boolean;
  avatar?: string | null;
  ring?: { id: number; name: string } | null;
  workgroup?: { id: number; name: string } | null;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  validateSession: () => Promise<boolean>;
  clearError: () => void;
}

function clearStoredAuth(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stored profile data is only a UI cache. The backend profile endpoint is
  // always the source of truth for whether this session is authenticated.
  const validateSession = useCallback(async (): Promise<boolean> => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken && !refreshToken) {
      setUser(null);
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);
    try {
      const response = await API.get('/profile/');
      if (!response.data) {
        setUser(null);
        setIsLoading(false);
        return false;
      }

      const userData: User = {
        id: response.data.id,
        group_code: response.data.group_code || '',
        full_name: response.data.full_name || '',
        is_manager: Boolean(response.data.is_manager),
        is_resolution_officer: Boolean(response.data.is_resolution_officer),
        is_workgroup_leader: Boolean(response.data.is_workgroup_leader),
        avatar: response.data.avatar || null,
        ring: response.data.ring ?? null,
        workgroup: response.data.workgroup ?? null,
      };

      setUser(userData);
      localStorage.setItem('user_info', JSON.stringify(userData));
      setError(null);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setUser(null);
      setError(
        err.response?.status === 401
          ? 'جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید.'
          : 'خطا در تأیید جلسه کاری.'
      );
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      clearStoredAuth();
      setUser(null);
      setError(null);
      return;
    }

    // Keep credentials available until the authenticated logout request has
    // been sent; local cleanup happens whether the server call succeeds or not.
    void API.post('/auth/logout/', { refresh: refreshToken })
      .catch((err) => {
        console.error('[useAuth] Server-side logout failed:', err);
      })
      .finally(() => {
        clearStoredAuth();
        setUser(null);
        setError(null);
      });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void validateSession();
  }, [validateSession]);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    logout,
    validateSession,
    clearError,
  };
};
