// src/lib/auth.tsx

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api-client";
import {
  clearAuth,
  getAccessToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "./api-client";
import type { AuthUser, LoginResponse } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (stored && getAccessToken()) setUserState(stored);
    setLoading(false);
  }, []);

  // Persist user to localStorage when setUser is called
  const setUser = useCallback((user: AuthUser | null) => {
    setUserState(user);
    if (user) {
      setStoredUser(user);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<LoginResponse>(
      "/api/auth/login/",
      { username, password },
      { auth: false },
    );
    setTokens(res.access, res.refresh);
    setUser(res.user); // this will also store in localStorage
  }, [setUser]);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser }),
    [user, loading, login, logout, setUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}