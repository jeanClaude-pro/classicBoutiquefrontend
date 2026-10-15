"use client";
import * as React from "react";
import type { AuthState, User } from "../types/auth";
import { AuthContext } from "./auth-context";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearAuthStorage,
  getTokenExpiry,
  invalidateSession,
  isTokenExpired,
  OFFLINE_SESSION_KEY,
} from "../lib/sessionManager";
import { renewOfflineAuthorization } from "../offline/offlineAuth";
import { startIdleTimer } from "../lib/idleTimeout";
import { logoutSession } from "../services/authService";
import { flushBeforeSignOut } from "../offline/syncManager";

// setTimeout's delay is a 32-bit signed int; clamp defensively so a
// misconfigured/longer-lived token can never overflow into an immediate fire.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = React.useState<AuthState>({
    token: null,
    user: null,
    offline: false,
    loading: true,
  });

  const expiryTimerRef = React.useRef<number | null>(null);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const clearExpiryTimer = React.useCallback(() => {
    if (expiryTimerRef.current !== null) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleExpiryTimer = React.useCallback(
    (token: string) => {
      clearExpiryTimer();
      const exp = getTokenExpiry(token);
      if (!exp) return;

      const expiresIn = exp * 1000 - Date.now();
      if (expiresIn <= 0) {
        invalidateSession("expired");
        return;
      }

      expiryTimerRef.current = window.setTimeout(() => {
        invalidateSession("expired");
      }, Math.min(expiresIn, MAX_TIMEOUT_MS));
    },
    [clearExpiryTimer]
  );

  // Boot from localStorage
  React.useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = localStorage.getItem(AUTH_USER_KEY);

    if (!token) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(OFFLINE_SESSION_KEY) || "null") as { user?: User; expiresAt?: string } | null;
        // A reload never extends an offline session past its authorization.
        if (saved?.user && saved.expiresAt && new Date(saved.expiresAt).getTime() > Date.now()) {
          setState({ token: null, user: saved.user, offline: true, loading: false });
          return;
        }
        sessionStorage.removeItem(OFFLINE_SESSION_KEY);
      } catch { sessionStorage.removeItem(OFFLINE_SESSION_KEY); }
      setState({ token: null, user: null, offline: false, loading: false });
      return;
    }

    if (isTokenExpired(token)) {
      // A previously-authenticated session is now stale: go through the
      // centralized invalidation flow (clears storage, redirects, shows the
      // session-expired message) instead of silently treating this as a
      // fresh logged-out state. Loading intentionally stays true — a full
      // navigation to /login is about to happen.
      invalidateSession("expired");
      return;
    }

    let user: User | null = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      user = null;
    }

    setState({ token, user, offline: false, loading: false });
    scheduleExpiryTimer(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync: if another tab logs out / gets invalidated, this tab's
  // auth state must drop too instead of continuing to look authenticated.
  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_TOKEN_KEY) return;
      if (event.newValue) return; // token was set, not removed — ignore
      clearExpiryTimer();
      setState({ token: null, user: null, offline: false, loading: false });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearExpiryTimer]);

  React.useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  // Shared POS terminals: an unattended session (online or offline PIN) ends
  // after the configured idle time. A sale in progress defers it (see
  // lib/idleTimeout.ts).
  const signedIn = Boolean(state.token || (state.offline && state.user));
  React.useEffect(() => {
    if (!signedIn) return undefined;
    return startIdleTimer(() => {
      // Send this cashier's queued sales before the idle sign-out.
      void flushBeforeSignOut(stateRef.current.user?.id, stateRef.current.token)
        .then(() => logoutSession())
        .finally(() => invalidateSession("idle"));
    });
  }, [signedIn]);

  const setAuth = React.useCallback(
    ({ token, user }: { token: string | null; user: User | null }) => {
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
      else localStorage.removeItem(AUTH_TOKEN_KEY);

      if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_USER_KEY);

      sessionStorage.removeItem(OFFLINE_SESSION_KEY);
      setState((s) => ({ ...s, token, user, offline: false, loading: false }));

      if (token && user) void renewOfflineAuthorization(user);

      if (token) scheduleExpiryTimer(token);
      else clearExpiryTimer();
    },
    [clearExpiryTimer, scheduleExpiryTimer]
  );

  const setOfflineAuth = React.useCallback((user: User, expiresAt: string) => {
    clearExpiryTimer();
    clearAuthStorage();
    sessionStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({ user, startedAt: new Date().toISOString(), expiresAt }));
    setState({ token: null, user, offline: true, loading: false });
  }, [clearExpiryTimer]);

  const clearAuth = React.useCallback(() => {
    clearExpiryTimer();
    clearAuthStorage();
    sessionStorage.removeItem(OFFLINE_SESSION_KEY);
    setState({ token: null, user: null, offline: false, loading: false });
  }, [clearExpiryTimer]);

  const value = { ...state, setAuth, setOfflineAuth, clearAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
