// Auth context wired to the Django JWT (SimpleJWT-style) endpoints.
// - login/logout store tokens in localStorage via api-client helpers
// - refresh is handled inside apiRequest (see api-client.ts) so components
//   only need to react to `user === null` (unauthenticated)

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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    const stored = getStoredUser<AuthUser>();
    if (stored && getAccessToken()) setUser(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<LoginResponse>(
      "/api/auth/login/",
      { username, password },
      { auth: false },
    );
    setTokens(res.access, res.refresh);
    setStoredUser(res.user);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
