import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadCount: number;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (loginInput: string, password: string) => Promise<void>;
  register: (payload: { email: string; username: string; displayName: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) => Promise<void>;
  equipBadge: (badgeId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
      await refreshUnreadCount();
    } catch (err) {
      console.warn('[Auth] Session validation failed:', err);
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (loginInput: string, password: string) => {
    const res = await api.login({ login: loginInput, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    closeAuthModal();
    await refreshUnreadCount();
  };

  const register = async (payload: { email: string; username: string; displayName: string; password: string }) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    closeAuthModal();
    await refreshUnreadCount();
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setUnreadCount(0);
  };

  const updateProfile = async (data: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.profile);
  };

  const equipBadge = async (badgeId: string) => {
    const res = await api.equipPrimaryBadge(badgeId);
    setUser(res.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        unreadCount,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        equipBadge,
        refreshUnreadCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
