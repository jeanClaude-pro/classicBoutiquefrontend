/**
 * Password confirmation for the Reports module, checked by the server.
 *
 * POST /auth/reauth verifies the password of the signed-in account and sets a
 * short-lived proof in an httpOnly cookie bound to this session; the reports
 * API refuses a superadmin request without it. Page scripts never see the
 * proof: this module only remembers, in memory, until when it is valid, so a
 * reload asks for the password again.
 */
import { serverUrl } from "../utils/constants";
import { toApiError } from "./apiError";

let confirmedUntil = 0;

export function hasReportsReauth(): boolean {
  // A few seconds of margin so a request never leaves with a dying proof.
  return confirmedUntil - 5_000 > Date.now();
}

export function clearReportsReauth(): void {
  confirmedUntil = 0;
}

/** True when the server refused a reports request for lack of confirmation. */
export function isReauthRequired(error: unknown): boolean {
  const apiError = toApiError(error);
  return apiError.status === 403 && apiError.code === "REAUTH_REQUIRED";
}

export type ReauthResult = "confirmed" | "wrong-password" | "locked" | "unavailable";

/** Asks the server to confirm the password. Never opens a new session. */
export async function confirmPassword(password: string): Promise<ReauthResult> {
  if (!password) return "wrong-password";
  let response: Response;
  try {
    response = await fetch(`${serverUrl}/auth/reauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
  } catch {
    return "unavailable";
  }
  const data = await response.json().catch(() => ({})) as { expiresAt?: string; error?: string };
  if (response.ok && data.expiresAt) {
    confirmedUntil = new Date(data.expiresAt).getTime();
    return "confirmed";
  }
  if (response.status === 429) return "locked";
  if (response.status === 403 && data.error === "REAUTH_INVALID") return "wrong-password";
  return "unavailable";
}
