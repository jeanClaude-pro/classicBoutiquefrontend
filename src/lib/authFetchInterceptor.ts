/**
 * Centralizes 401 handling for API requests without requiring every page to
 * go through a shared request wrapper.
 *
 * The session is an httpOnly cookie the browser sends by itself, so any 401
 * from our own API while this device believes it is signed in means the
 * server ended the session (expired, revoked, account disabled): the device
 * is signed out and sent to the login page. /auth/login, /auth/logout,
 * /auth/reauth and /auth/session are excluded: their 401/403 answers are
 * handled where they are called (wrong password, start-up check...).
 *
 * Import this module once (see main.tsx) before the app renders.
 */
import { serverUrl } from "../utils/constants";
import { hasSessionHint, invalidateSession } from "./sessionManager";

const EXCLUDED_PATHS = ["/auth/login", "/auth/logout", "/auth/reauth", "/auth/session"];

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isOwnApi(url: string): boolean {
  if (url.startsWith(serverUrl)) return true;
  // serverUrl is relative ("/api") in production: compare same-origin URLs too.
  try {
    const resolved = new URL(url, window.location.origin);
    const base = new URL(serverUrl, window.location.origin);
    return resolved.origin === base.origin && resolved.pathname.startsWith(base.pathname);
  } catch {
    return false;
  }
}

let installed = false;

export function installAuthFetchInterceptor(): void {
  if (installed) return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init);

    if (response.status === 401) {
      const url = resolveUrl(input);
      const isExcluded = EXCLUDED_PATHS.some((path) => url.includes(path));
      if (!isExcluded && isOwnApi(url) && hasSessionHint()) {
        invalidateSession("unauthorized");
      }
    }

    return response;
  };
}

installAuthFetchInterceptor();
