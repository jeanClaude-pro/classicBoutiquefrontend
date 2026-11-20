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
import { purgeOfflineCredentials } from "../offline/offlineAuth";
import { startIdleTimer } from "../lib/idleTimeout";
import { logoutSession, retryPendingLogout } from "../services/authService";
import { flushBeforeSignOut } from "../offline/syncManager";
import { serverUrl } from "../utils/constants";

// setTimeout's delay is a 32-bit signed int; clamp defensively so a
// misconfigured/longer-lived token can never overflow into an immediate fire.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const VERIFY_TIMEOUT_MS = 8000;

type Verification = "verified" | "refused" | "unreachable";

/**
 * Asks the server who this token belongs to. The user profile kept in
 * localStorage is never trusted on its own: a role or a permission edited in
 * the browser is replaced by the server's answer.
 * - verified: the server confirmed the session and returned the real user.
 * - refused: the session is expired, revoked or the account is disabled (401).
 * - unreachable: no answer (network down, server error, timeout).
 */
async function verifyWithServer(token: string): Promise<{ result: Verification; user?: User }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(`${serverUrl}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    // Only 401 means "this session is not valid". A 403 here can only be an
    // infrastructure refusal (CORS...), which must not sign a cashier out.
    if (response.status === 401) return { result: "refused" };
    if (!response.ok) return { result: "unreachable" };
    const data = await response.json().catch(() => null) as { user?: User } | null;
    return data?.user?.id ? { result: "verified", user: data.user } : { result: "unreachable" };
  } catch {
    return { result: "unreachable" };
  } finally {
    window.clearTimeout(timer);
  }
}

function storedUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null") as User | null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // `offline` means: a server-issued, unexpired session that the server has
  // not been able to confirm yet (no connection). It only gives access to the
  // till and the queue of unsent sales (see RequireAuth); every sale is still
  // checked by the server when it is synchronized.
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

  /** Confirms the current token with the server and applies the answer. */
  const verifySession = React.useCallback(async (): Promise<Verification> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || isTokenExpired(token)) {
      if (token) invalidateSession("expired");
      return "refused";
    }
    const { result, user } = await verifyWithServer(token);
    // Signed out or switched account meanwhile: this answer is stale.
    if (localStorage.getItem(AUTH_TOKEN_KEY) !== token) return result;
    if (result === "verified" && user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({ token, user, offline: false, loading: false });
    } else if (result === "refused") {
      invalidateSession("unauthorized");
    } else {
      setState((current) => ({ token, user: current.user ?? storedUser(), offline: true, loading: false }));
    }
    return result;
  }, []);

  // Boot: a stored token is only a candidate until the server confirms it.
  React.useEffect(() => {
    // The retired offline PIN sign-in left credentials on some devices.
    void purgeOfflineCredentials();
    try { sessionStorage.removeItem(OFFLINE_SESSION_KEY); } catch { /* unavailable */ }
    void retryPendingLogout();

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setState({ token: null, user: null, offline: false, loading: false });
      return;
    }

    if (isTokenExpired(token)) {
      // A previously-authenticated session is now stale: go through the
      // centralized invalidation flow (clears storage, redirects, shows the
      // session-expired message). Loading intentionally stays true — a full
      // navigation to /login is about to happen.
      invalidateSession("expired");
      return;
    }

    scheduleExpiryTimer(token);
    // Nothing is shown until the server has answered (or is known to be
    // unreachable), so a role edited in the browser never renders a screen.
    void verifySession();
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

  // Shared POS terminals: an unattended session ends after the configured
  // idle time. A sale in progress defers it (see lib/idleTimeout.ts).
  const signedIn = Boolean(state.token);
  React.useEffect(() => {
    if (!signedIn) return undefined;
    return startIdleTimer(() => {
      // Send this cashier's queued sales before the idle sign-out.
      void flushBeforeSignOut(stateRef.current.user?.id, stateRef.current.token)
        .then(() => logoutSession())
        .finally(() => invalidateSession("idle"));
    });
  }, [signedIn]);

  // Only called with the answer of a successful POST /auth/login.
  const setAuth = React.useCallback(
    ({ token, user }: { token: string | null; user: User | null }) => {
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
      else localStorage.removeItem(AUTH_TOKEN_KEY);

      if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_USER_KEY);

      setState((s) => ({ ...s, token, user, offline: false, loading: false }));

      if (token) scheduleExpiryTimer(token);
      else clearExpiryTimer();
    },
    [clearExpiryTimer, scheduleExpiryTimer]
  );

  const clearAuth = React.useCallback(() => {
    clearExpiryTimer();
    clearAuthStorage();
    setState({ token: null, user: null, offline: false, loading: false });
  }, [clearExpiryTimer]);

  const value = { ...state, setAuth, clearAuth, verifySession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
