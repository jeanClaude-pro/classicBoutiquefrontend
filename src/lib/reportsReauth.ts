/**
 * Password confirmation for the Reports module, checked by the server.
 *
 * POST /auth/reauth verifies the password of the signed-in account and returns
 * a short-lived proof bound to this session. The reports API refuses a
 * superadmin request that does not carry it, so the password screen cannot be
 * bypassed by editing the page. The proof lives in sessionStorage (this tab
 * only) and is erased with the session.
 */
import { serverUrl } from "../utils/constants";
import { ApiError, apiErrorFromPayload, toApiError } from "./apiError";
import { AUTH_TOKEN_KEY } from "./sessionManager";

export const REAUTH_STORAGE_KEY = "reportsReauth";
export const REAUTH_HEADER = "X-Reauth-Token";

interface StoredProof { token: string; expiresAt: string }

function readProof(): StoredProof | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(REAUTH_STORAGE_KEY) || "null") as StoredProof | null;
    if (!saved?.token || !saved.expiresAt) return null;
    // A few seconds of margin so a request never leaves with a dying proof.
    if (new Date(saved.expiresAt).getTime() - 5_000 <= Date.now()) return null;
    return saved;
  } catch {
    return null;
  }
}

export function hasReportsReauth(): boolean {
  return readProof() !== null;
}

/** Header to add to reports requests; empty when no valid proof is stored. */
export function reauthHeaders(): Record<string, string> {
  const proof = readProof();
  return proof ? { [REAUTH_HEADER]: proof.token } : {};
}

export function clearReportsReauth(): void {
  try { sessionStorage.removeItem(REAUTH_STORAGE_KEY); } catch { /* unavailable */ }
}

/** True when the server refused a reports request for lack of confirmation. */
export function isReauthRequired(error: unknown): boolean {
  const apiError = toApiError(error);
  return apiError.status === 403 && apiError.code === "REAUTH_REQUIRED";
}

export type ReauthResult = "confirmed" | "wrong-password" | "locked" | "unavailable";

/** Asks the server to confirm the password. Never opens a new session. */
export async function confirmPassword(password: string): Promise<ReauthResult> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || !password) return "wrong-password";
  let response: Response;
  try {
    response = await fetch(`${serverUrl}/auth/reauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
  } catch {
    return "unavailable";
  }
  const data = await response.json().catch(() => ({})) as { reauthToken?: string; expiresAt?: string; code?: string };
  if (response.ok && data.reauthToken && data.expiresAt) {
    sessionStorage.setItem(REAUTH_STORAGE_KEY, JSON.stringify({ token: data.reauthToken, expiresAt: data.expiresAt }));
    return "confirmed";
  }
  if (response.status === 429) return "locked";
  if (response.status === 403 && data.code === "REAUTH_INVALID") return "wrong-password";
  const error: ApiError = apiErrorFromPayload(response.status, data);
  return error.status === 401 ? "wrong-password" : "unavailable";
}
