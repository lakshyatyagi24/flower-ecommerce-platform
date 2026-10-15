"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isPublicAdminRoute } from "./public-routes";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminUser, ApiError, getStoredToken, setStoredToken } from "./api";

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const lastExpiredToastAt = useRef(0);

  const verify = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await adminApi.me();
      if (me.role !== "ADMIN") {
        setStoredToken(null);
        setUser(null);
        setError("This account does not have admin access.");
      } else {
        setUser(me);
      }
    } catch (err) {
      // Only treat genuine auth failures as "logged out" and clear the token.
      // A transient network/5xx error (backend restarting, DNS hiccup) must NOT
      // destroy a valid session — keep the token so a retry/reload restores it.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setStoredToken(null);
        setUser(null);
      } else {
        setError("Cannot reach the API server. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  // Mid-session 401 from any data request (admin sessions last 12 hours) → the token has already been
  // cleared by the API client; drop the user, say why, and return to login. Several requests can fail at
  // once, so the toast is shown once; nothing about the old session is kept.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUnauthorized = () => {
      setUser(null);
      const now = Date.now();
      if (!isPublicAdminRoute(window.location.pathname) && now - lastExpiredToastAt.current > 5000) {
        lastExpiredToastAt.current = now;
        addToast({
          type: "warning",
          title: "Session expired",
          description: "For your security you were signed out. Please sign in again.",
        });
      }
      router.replace("/login");
    };
    window.addEventListener("admin-auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("admin-auth:unauthorized", onUnauthorized);
  }, [router, addToast]);

  // route guard — redirect to /login if not authenticated
  useEffect(() => {
    if (loading) return;
    const isPublic = isPublicAdminRoute(pathname);
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const res = await adminApi.login(email, password);
    if (res.user.role !== "ADMIN") {
      throw new Error("This account does not have admin access.");
    }
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthState>(() => ({ user, loading, error, login, logout }), [user, loading, error, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
