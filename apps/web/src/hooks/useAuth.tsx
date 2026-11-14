/**
 * apps/web/src/hooks/useAuth.tsx
 * Authentication & RBAC Context Hook for NEURO-SPEECH (M6).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; full_name: string; role?: string }) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isResearcher: boolean;
  isCaregiver: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(api.auth.getCurrentUser());
  const [token, setToken] = useState<string | null>(api.auth.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(api.auth.getToken()));

  useEffect(() => {
    async function loadUser() {
      const storedToken = api.auth.getToken();
      if (storedToken) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch {
          api.auth.logout();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(username, password);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        username: res.username,
        role: res.role as any,
        full_name: res.full_name,
        email: `${res.username}@neuro-speech.local`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { username: string; email: string; password: string; full_name: string; role?: string }) => {
    await api.auth.register(data);
  };

  const logout = () => {
    api.auth.logout();
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isResearcher = user?.role === 'researcher' || isAdmin;
  const isCaregiver = user?.role === 'caregiver' || isResearcher;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin,
        isResearcher,
        isCaregiver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
