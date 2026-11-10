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

/**
 * ✅ Custom hook for centralized authentication state
 * - Validates JWT token expiration
 * - Validates session against backend
 * - Handles logout with token cleanup
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Parse JWT expiration (without verification)
  const getTokenExpiration = useCallback((token: string | null): number | null => {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(atob(parts[1]));
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (err) {
      console.error('[useAuth] Failed to decode token:', err);
      return null;
    }
  }, []);

  // ✅ Check if token is expired
  const isTokenExpired = useCallback((token: string | null): boolean => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minute buffer

    return now > expiration - bufferTime;
  }, [getTokenExpiration]);

  // ✅ Validate session with backend
  const validateSession = useCallback(async (): Promise<boolean> => {
    const accessToken = localStorage.getItem('access_token');

    // No token = not authenticated
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return false;
    }

    // Token expired = clear and return false
    if (isTokenExpired(accessToken)) {
      console.warn('[useAuth] Access token expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      setUser(null);
      setIsLoading(false);
      return false;
    }

    // Token valid - check stored user info
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        setUser(userInfo);
        setError(null);
        setIsLoading(false);
        return true;
      } catch (err) {
        console.error('[useAuth] Failed to parse user_info:', err);
      }
    }

    // Try to fetch profile from backend to validate token freshness
    try {
      setIsLoading(true);
      const response = await API.get('/profile/');

      if (response.data) {
        const userData: User = {
          id: response.data.id || 0,
          group_code: response.data.group_code || '',
          full_name: response.data.full_name || '',
          is_manager: response.data.is_manager || false,
          is_resolution_officer: response.data.is_resolution_officer || false,
          is_workgroup_leader: response.data.is_workgroup_leader || false,
          avatar: response.data.avatar || null,
          ring: response.data.ring,
          workgroup: response.data.workgroup,
        };

        setUser(userData);
        localStorage.setItem('user_info', JSON.stringify(userData));
        setError(null);
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error('[useAuth] Session validation failed:', err.message);

      // 401 will trigger interceptor, so just set error here
      if (err.response?.status === 401) {
        setUser(null);
        setError('جلسه کاری شما منقضی شده است. لطفا دوباره وارد شوید.');
      } else {
        setError('خطا در تایید جلسه کاری.');
      }
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return false;
  }, [isTokenExpired]);

  // ✅ Logout: clear tokens and user
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setError(null);
  }, []);

  // ✅ Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Initialize auth on mount
  useEffect(() => {
    validateSession();
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
