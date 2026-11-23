/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginPayload, LoginResponse, User } from "../types/auth";
import { serverUrl } from "../utils/constants";
import { ApiError, apiErrorFromPayload, toApiError } from "../lib/apiError";
import { t } from "../i18n";

// The session is an httpOnly cookie set by the server at login: the browser
// sends it by itself with every same-origin /api request, and no page code
// ever reads or stores it.
export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${serverUrl}${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
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

/** Signs in. The server answers with the user and sets the session cookie. */
export function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * localStorage flag set when a sign-out could not reach the server (offline).
 * It holds no credential: the session cookie is httpOnly, so only the server
 * can erase it. The device is signed out at once, and the server-side sign-out
 * is sent again at the next start-up or reconnection (and any new login also
 * revokes the session the browser still carries).
 */
export const PENDING_LOGOUT_KEY = "pendingLogout";

async function logoutOnServer(timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${serverUrl}/auth/logout`, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function hasPendingLogout(): boolean {
  try { return localStorage.getItem(PENDING_LOGOUT_KEY) === "1"; } catch { return false; }
}

function setPendingLogout(pending: boolean): void {
  try {
    if (pending) localStorage.setItem(PENDING_LOGOUT_KEY, "1");
    else localStorage.removeItem(PENDING_LOGOUT_KEY);
  } catch { /* storage unavailable */ }
}

/**
 * Ends this session on the server (revokes it and erases the cookie).
 * Returns false when the server could not be reached: the sign-out is then
 * finished automatically as soon as it can be.
 */
export async function logoutSession(): Promise<boolean> {
  const done = await logoutOnServer(8000);
  setPendingLogout(!done);
  return done;
}

/** Finishes a sign-out that could not reach the server earlier. */
export async function retryPendingLogout(): Promise<void> {
  if (!hasPendingLogout()) return;
  if (await logoutOnServer(8000)) setPendingLogout(false);
}

/** A new login replaces (and revokes) the old session: nothing is pending. */
export function clearPendingLogout(): void {
  setPendingLogout(false);
}

/** Who this session belongs to, according to the server. */
export function fetchSession() {
  return apiFetch<{ user: User; expiresAt: string }>("/auth/session", { method: "GET" });
}
