'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserWithPreferences } from '@/lib/types';

interface AuthContextType {
  user: UserWithPreferences | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  register: (name: string, email: string, password: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserWithPreferences>) => Promise<UserWithPreferences>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithPreferences | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flow_token') : null;
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch('/api/auth/me', { credentials: 'include', headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data.user);
          if (storedToken) setToken(storedToken);
        } else if (isMounted) {
          setUser(null);
          setToken(null);
          if (typeof window !== 'undefined') localStorage.removeItem('flow_token');
        }
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flow_token', data.token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    return login('lucas.mendes@example.com', 'flow123');
  };

  const register = async (name: string, email: string, password: string, lastName?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, lastName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flow_token', data.token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flow_token');
    }
  };

  const updateProfile = async (updates: Partial<UserWithPreferences>): Promise<UserWithPreferences> => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flow_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao atualizar perfil');
    }

    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginAsDemo,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
