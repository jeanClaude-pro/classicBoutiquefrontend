"use client";
import * as React from "react";
import type { AuthState, User } from "../types/auth";
import { AuthContext } from "./auth-context";
import {
  AUTH_USER_KEY,
  clearAuthStorage,
  invalidateSession,
  OFFLINE_SESSION_KEY,
  onSessionEnd,
  SESSION_EXPIRES_KEY,
} from "../lib/sessionManager";
import { purgeOfflineCredentials } from "../offline/offlineAuth";
import { startIdleTimer } from "../lib/idleTimeout";
import { clearPendingLogout, hasPendingLogout, logoutSession, retryPendingLogout } from "../services/authService";
import { flushBeforeSignOut } from "../offline/syncManager";
import { serverUrl } from "../utils/constants";

// setTimeout's delay is a 32-bit signed int; clamp defensively so a
// misconfigured/longer-lived session can never overflow into an immediate fire.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const VERIFY_TIMEOUT_MS = 8000;

type Verification = "verified" | "refused" | "unreachable";

/**
 * Asks the server who this browser's session belongs to. The session is an
 * httpOnly cookie the browser sends by itself; the user profile kept in
 * localStorage is only a display copy and is replaced by the server's answer.
 */
async function verifyWithServer(): Promise<{ result: Verification; user?: User; expiresAt?: string }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(`${serverUrl}/auth/session`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    // Only 401 means "no valid session". A 403/404 here can only be an
    // infrastructure refusal, which must not sign a cashier out.
    if (response.status === 401) return { result: "refused" };
    if (!response.ok) return { result: "unreachable" };
    const data = await response.json().catch(() => null) as { user?: User; expiresAt?: string } | null;
    return data?.user?.id && data.expiresAt
      ? { result: "verified", user: data.user, expiresAt: data.expiresAt }
      : { result: "unreachable" };
  } catch {
    return { result: "unreachable" };
  } finally {
    window.clearTimeout(timer);
  }
}

function storedSession(): { user: User; expiresAt: string } | null {
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null") as User | null;
    const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);
    if (!user?.id || !expiresAt || new Date(expiresAt).getTime() <= Date.now()) return null;
    return { user, expiresAt };
  } catch {
    return null;
  }
}

function storeSession(user: User, expiresAt: string): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_EXPIRES_KEY, expiresAt);
}

const SIGNED_OUT: AuthState = { signedIn: false, expiresAt: null, user: null, offline: false, loading: false };

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // `offline` means: this device had a session, but the server has not been
  // able to confirm it yet (no connection). It only opens the till and the
  // queue of unsent sales (see RequireAuth); every sale is still checked by
  // the server when it is synchronized.
  const [state, setState] = React.useState<AuthState>({ ...SIGNED_OUT, loading: true });

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
    (expiresAt: string) => {
      clearExpiryTimer();
      const expiresIn = new Date(expiresAt).getTime() - Date.now();
      if (!Number.isFinite(expiresIn)) return;
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

  /** Confirms the session with the server and applies the answer. */
  const verifySession = React.useCallback(async (): Promise<Verification> => {
    const known = storedSession();
    const { result, user, expiresAt } = await verifyWithServer();
    if (result === "verified" && user && expiresAt) {
      storeSession(user, expiresAt);
      scheduleExpiryTimer(expiresAt);
      setState({ signedIn: true, expiresAt, user, offline: false, loading: false });
    } else if (result === "refused") {
      // A session this device knew about was ended by the server (expired,
      // revoked, account disabled): say so on the login page. Otherwise the
      // visitor simply is not signed in.
      if (known || stateRef.current.signedIn) invalidateSession("expired");
      else { clearAuthStorage(); setState(SIGNED_OUT); }
    } else if (known) {
      scheduleExpiryTimer(known.expiresAt);
      setState({ signedIn: true, expiresAt: known.expiresAt, user: stateRef.current.user ?? known.user, offline: true, loading: false });
    } else {
      setState(SIGNED_OUT);
    }
    return result;
  }, [scheduleExpiryTimer]);

  // Boot: the server alone says whether this browser is signed in.
  React.useEffect(() => {
    // Ending a session on this device asks the server to erase the cookie.
    onSessionEnd(() => {
      void fetch(`${serverUrl}/auth/logout`, { method: "POST", credentials: "same-origin", keepalive: true }).catch(() => undefined);
    });
    // The retired offline PIN sign-in left credentials on some devices; older
    // versions also kept the session token in localStorage.
    void purgeOfflineCredentials();
    try { sessionStorage.removeItem(OFFLINE_SESSION_KEY); } catch { /* unavailable */ }

    if (hasPendingLogout()) {
      // Signed out while offline: stay signed out and finish it on the server.
      clearAuthStorage();
      setState(SIGNED_OUT);
      void retryPendingLogout();
      return () => onSessionEnd(null);
    }
    // Nothing is shown until the server has answered (or is known to be
    // unreachable), so a role edited in the browser never renders a screen.
    void verifySession();
    return () => onSessionEnd(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync: if another tab signs out / is invalidated, this tab's
  // auth state must drop too instead of continuing to look authenticated.
  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_EXPIRES_KEY && event.key !== null) return;
      if (event.newValue && event.key !== null) return; // a session was set, not removed
      clearExpiryTimer();
      setState(SIGNED_OUT);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearExpiryTimer]);

  React.useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  // Shared POS terminals: an unattended session ends after the configured
  // idle time. A sale in progress defers it (see lib/idleTimeout.ts).
  React.useEffect(() => {
    if (!state.signedIn) return undefined;
    return startIdleTimer(() => {
      // Send this cashier's queued sales before the idle sign-out.
      void flushBeforeSignOut(stateRef.current.user?.id, stateRef.current.signedIn && !stateRef.current.offline)
        .then(() => logoutSession())
        .finally(() => invalidateSession("idle"));
    });
  }, [state.signedIn]);

  // Only called with the answer of a successful POST /auth/login (the server
  // has just set the session cookie).
  const setAuth = React.useCallback(
    ({ user, expiresAt }: { user: User; expiresAt: string }) => {
      clearPendingLogout();
      storeSession(user, expiresAt);
      scheduleExpiryTimer(expiresAt);
      setState({ signedIn: true, expiresAt, user, offline: false, loading: false });
    },
    [scheduleExpiryTimer]
  );

  const clearAuth = React.useCallback(() => {
    clearExpiryTimer();
    clearAuthStorage();
    setState(SIGNED_OUT);
  }, [clearExpiryTimer]);

  const value = { ...state, setAuth, clearAuth, verifySession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
