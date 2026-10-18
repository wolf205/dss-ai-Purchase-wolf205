import React, { useState, useEffect, useCallback } from 'react';
import type { User, LoginRequestDto } from '../types/auth';
import { authService } from '../services/api/auth.service';
import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  subscribeToTokenChanges,
} from '../services/api/token-store';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Đồng bộ state khi token-store thay đổi từ axios interceptor
  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges((newToken) => {
      setTokenState(newToken);
      if (!newToken) {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Tự động khôi phục session khi F5 qua HttpOnly Cookie refreshToken
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const refreshData = await authService.refresh();
        if (refreshData?.accessToken && isMounted) {
          setAccessToken(refreshData.accessToken);
          const currentUser = await authService.getMe();
          if (isMounted) {
            setUser(currentUser);
          }
        }
      } catch {
        if (isMounted) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      setAccessToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Lỗi khi đăng xuất backend:', error);
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
