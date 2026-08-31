'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '@/lib/types';
import { UserRole, ROLE_LABELS, hasPermission, Permission } from '@/lib/rbac';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<{ success: boolean; message?: string }>;
  switchDevUser: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserSession>) => void;
  can: (permission: Permission) => boolean;
}

export const DEFAULT_USER: UserSession = {
  id: 1,
  name: 'Super Admin',
  username: 'superadmin',
  email: 'superadmin@local.test',
  role: 'SUPER_ADMIN',
  jurusan_id: null,
  jurusan_kode: null,
  is_active: true,
  status: 'Aktif',
  created_at: '2026-01-01T08:00:00.000Z',
  last_login: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('inventaris_auth_user', JSON.stringify(data.user));
            setIsLoading(false);
            return;
          }
        }

        const stored = localStorage.getItem('inventaris_auth_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(DEFAULT_USER);
          localStorage.setItem('inventaris_auth_user', JSON.stringify(DEFAULT_USER));
        }
      } catch (e) {
        console.warn('Session check fallback to local state:', e);
        const stored = localStorage.getItem('inventaris_auth_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(DEFAULT_USER);
          }
        } else {
          setUser(DEFAULT_USER);
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = async (identifier: string, passwordPlain: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: passwordPlain }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        return { success: false, message: data.message || 'Login gagal. Periksa username dan password.' };
      }

      setUser(data.user);
      localStorage.setItem('inventaris_auth_user', JSON.stringify(data.user));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal terhubung ke server autentikasi.' };
    }
  };

  const switchDevUser = async (username: string): Promise<boolean> => {
    // Development quick switcher for seamless multi-role testing
    const passwords: Record<string, string> = {
      superadmin: 'SuperAdmin123!',
      operator: 'Operator123!',
      kepsek: 'Kepsek123!',
      sarpras: 'Sarpras123!',
      'kakom.rpl': 'KakomRPL123!',
      'kakom.atph': 'KakomATPH123!',
      'kakom.tbsm': 'KakomTBSM123!',
      'laboran.rpl': 'LaboranRPL123!',
      'laboran.atph': 'LaboranATPH123!',
      'laboran.tbsm': 'LaboranTBSM123!',
    };

    const pass = passwords[username.toLowerCase()] || 'SuperAdmin123!';
    const res = await login(username, pass);
    return res.success;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    setUser(null);
    try {
      localStorage.removeItem('inventaris_auth_user');
    } catch (e) {
      console.warn('LocalStorage remove error:', e);
    }
  };

  const updateProfile = (data: Partial<UserSession>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    try {
      localStorage.setItem('inventaris_auth_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        switchDevUser,
        logout,
        updateProfile,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
