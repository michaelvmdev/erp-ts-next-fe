'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type UserItem } from '@/lib/api';

interface AuthState {
  user: UserItem | null;
  /** true mientras se verifica el token inicial */
  loading: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    const c = new AbortController();
    api.auth
      .me(c.signal)
      .then((u) => setUser(u))
      .catch(() => {
        // 401 is handled in http.ts (redirect to /login), but catch here too
        localStorage.removeItem('accessToken');
      })
      .finally(() => setLoading(false));

    return () => c.abort();
  }, []);

  const login = useCallback(async (accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    const u = await api.auth.me();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
