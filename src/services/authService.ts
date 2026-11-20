/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginPayload, RegisterPayload, RegisterResponse, LoginResponse, User } from "../types/auth";
import { serverUrl } from "../utils/constants";
import { ApiError, apiErrorFromPayload, toApiError } from "../lib/apiError";
import { t } from "../i18n";

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    res = await fetch(`${serverUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  } catch (error) {
    throw toApiError(error);
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    // On the login form a 401 means wrong credentials, not an expired session.
    if (path === "/auth/login" && res.status === 401) {
      throw new ApiError({ status: 401, title: t("apiErrors.titles.loginRefused"), message: t("apiErrors.server.invalidCredentials") });
    }
    throw apiErrorFromPayload(res.status, data);
  }
  return data as T;
}

export function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * localStorage key of a session whose server-side revocation could not be
 * confirmed (offline at sign-out). It is sent again on the next start-up or
 * reconnection, so every sign-out eventually goes through the server.
 */
export const PENDING_LOGOUT_KEY = "pendingLogout";

async function revokeOnServer(token: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${serverUrl}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
      signal: controller.signal,
    });
    // 401: the session was already expired or revoked - nothing left to end.
    return response.ok || response.status === 401;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Ends this session on the server. Returns false when the server could not
 * confirm it (offline): the token is then kept aside only to finish the
 * revocation later; the device itself is signed out either way.
 */
export async function logoutSession(): Promise<boolean> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return true;
  const revoked = await revokeOnServer(token, 8000);
  if (!revoked) {
    try { localStorage.setItem(PENDING_LOGOUT_KEY, token); } catch { /* storage unavailable */ }
  }
  return revoked;
}

/** Finishes a sign-out that could not reach the server earlier. */
export async function retryPendingLogout(): Promise<void> {
  let token: string | null = null;
  try { token = localStorage.getItem(PENDING_LOGOUT_KEY); } catch { return; }
  if (!token) return;
  if (await revokeOnServer(token, 8000)) {
    try { localStorage.removeItem(PENDING_LOGOUT_KEY); } catch { /* storage unavailable */ }
  }
}

export function register(payload: RegisterPayload) {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/** Who this session belongs to, according to the server (never local storage). */
export function fetchSession() {
  return apiFetch<{ user: User }>("/auth/session", { method: "GET" });
}
