/**
 * Single source of truth for JWT-expiry detection and session invalidation.
 * Framework-agnostic on purpose: it is called both from React (AuthProvider)
 * and from outside the React tree (the fetch 401 interceptor), so it must not
 * depend on router/context.
 */

/**
 * Legacy localStorage key of the session token. The token now lives only in
 * an httpOnly cookie set by the server (page scripts never see it); this key
 * is only erased, for devices that signed in with an older version.
 */
export const AUTH_TOKEN_KEY = "token";
const LEGACY_TOKEN_KEYS = [AUTH_TOKEN_KEY, "authToken"];
/** Display copy of the signed-in user (not a credential: the server decides). */
export const AUTH_USER_KEY = "user";
/** When the server said the session expires (not a credential either). */
export const SESSION_EXPIRES_KEY = "sessionExpiresAt";

/** True when this device believes someone is signed in (to be confirmed by the server). */
export function hasSessionHint(): boolean {
  try {
    const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);
    return Boolean(localStorage.getItem(AUTH_USER_KEY) && expiresAt && new Date(expiresAt).getTime() > Date.now());
  } catch {
    return false;
  }
}

// Called when a session ends on this device, to ask the server to erase the
// httpOnly cookie (set by AuthProvider; this module stays framework-free).
let sessionEndHook: (() => void) | null = null;
export function onSessionEnd(hook: (() => void) | null): void {
  sessionEndHook = hook;
}
/** Legacy sessionStorage key of the retired offline PIN session. Every
 *  session now comes from the server; the key is only erased. */
export const OFFLINE_SESSION_KEY = "offlineSession";
/** sessionStorage key of the reports password confirmation (lib/reportsReauth). */
const REPORTS_REAUTH_KEY = "reportsReauth";

export type SessionInvalidationReason = "expired" | "unauthorized" | "idle";

/**
 * Dispatched on `window` synchronously from invalidateSession(), before the
 * redirect is kicked off. Lets any mounted component (e.g. the receipt
 * long-running workflow) react immediately — stop in-flight work and clear queues
 * camera stream — instead of relying solely on the navigation eventually
 * unmounting it.
 */
export const SESSION_INVALIDATED_EVENT = "session:invalidated";

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const binary = base64UrlDecode(parts[1]);
    const percentEncoded = Array.from(binary)
      .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    const payload: unknown = JSON.parse(decodeURIComponent(percentEncoded));
    return payload && typeof payload === "object" ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
}

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const exp = getTokenExpiry(token);
  return !exp || exp * 1000 <= Date.now();
}

export function clearAuthStorage(): void {
  for (const key of LEGACY_TOKEN_KEYS) localStorage.removeItem(key);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(SESSION_EXPIRES_KEY);
  try {
    sessionStorage.removeItem(OFFLINE_SESSION_KEY);
    sessionStorage.removeItem(REPORTS_REAUTH_KEY);
  } catch {
    // sessionStorage unavailable: nothing to clear.
  }
}

// Reset on every hard navigation (module re-evaluates on page load), so this
// only needs to guard against several 401s/timers firing within one tick.
let invalidating = false;

/**
 * Clears auth storage and hard-redirects to /login with the reason + intended
 * return path. A full navigation is used deliberately: it guarantees any page
 * (e.g. an authenticated page with work in progress) is unmounted, and it works identically
 * whether this is called from inside or outside the React tree — no need to
 * sync React state first, the navigation makes it moot. Idempotent —
 * concurrent 401s/timers only redirect once. Other tabs pick up the cleared
 * token via the native `storage` event (see AuthProvider).
 */
export function invalidateSession(reason: SessionInvalidationReason): void {
  if (invalidating) return;
  invalidating = true;

  // Safety valve: on the happy path this page unloads before the timer ever
  // fires (navigation below). But if something throws, or the navigation is
  // blocked/ignored by the environment, this guarantees `invalidating` can't
  // stay latched forever and silently swallow every future real expiry.
  const releaseTimer = window.setTimeout(() => {
    invalidating = false;
  }, 3000);

  try {
    if (import.meta.env.DEV) console.debug(`[session] invalidated (${reason})`);

    try {
      window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, { detail: { reason } }));
    } catch {
      // A listener throwing (or an unusual environment) must never block the
      // actual invalidation below.
    }

    clearAuthStorage();
    try { sessionEndHook?.(); } catch { /* best effort */ }

    const { pathname, search } = window.location;
    const returnTo = pathname === "/login" ? "" : `${pathname}${search}`;

    const params = new URLSearchParams();
    params.set("reason", reason === "idle" ? "idle" : "session-expired");
    if (returnTo) params.set("returnTo", returnTo);

    window.location.href = `/login?${params.toString()}`;
  } catch {
    window.clearTimeout(releaseTimer);
    invalidating = false;
  }
}
