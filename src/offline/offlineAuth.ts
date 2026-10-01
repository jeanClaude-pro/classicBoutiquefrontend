import type { User } from "../types/auth";
import { offlineDb, scopeForUser } from "./db";
import type { OfflineAuthProfile } from "./types";

const ITERATIONS = 310_000;
const VALIDITY_MS = 5 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}
function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function enableOfflineAccess(user: User, pin: string): Promise<OfflineAuthProfile> {
  if (!/^\d{6,12}$/.test(pin)) throw new Error("PIN_LENGTH");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const now = new Date();
  const profile: OfflineAuthProfile = {
    userId: user.id, user: { ...user }, scopeKey: scopeForUser(user),
    pinSalt: bytesToBase64(salt), pinVerifier: await derive(pin, salt, ITERATIONS), pinIterations: ITERATIONS,
    enabled: true, lastOnlineAuthenticationAt: now.toISOString(),
    offlineAccessExpiresAt: new Date(now.getTime() + VALIDITY_MS).toISOString(),
    failedAttempts: 0, authorizationVersion: 1,
  };
  await offlineDb.authProfiles.put(profile);
  return profile;
}

export async function renewOfflineAuthorization(user: User): Promise<void> {
  const profile = await offlineDb.authProfiles.get(user.id);
  if (!profile?.enabled) return;
  const now = new Date();
  await offlineDb.authProfiles.update(user.id, {
    user: { ...user }, scopeKey: scopeForUser(user), failedAttempts: 0, lockoutUntil: undefined,
    lastOnlineAuthenticationAt: now.toISOString(), offlineAccessExpiresAt: new Date(now.getTime() + VALIDITY_MS).toISOString(),
  });
}

export const listOfflineProfiles = () => offlineDb.authProfiles.filter((profile) => profile.enabled).toArray();
export const disableOfflineAccess = (userId: string) => offlineDb.authProfiles.update(userId, { enabled: false });
export async function disableOfflineAccessForEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  await offlineDb.authProfiles.filter((profile) => profile.user.email?.toLowerCase() === normalized)
    .modify({ enabled: false });
}

export async function verifyOfflinePin(userId: string, pin: string): Promise<OfflineAuthProfile> {
  const profile = await offlineDb.authProfiles.get(userId);
  if (!profile?.enabled) throw new Error("OFFLINE_DISABLED");
  const now = Date.now();
  if (new Date(profile.offlineAccessExpiresAt).getTime() <= now) throw new Error("OFFLINE_EXPIRED");
  if (profile.lockoutUntil && new Date(profile.lockoutUntil).getTime() > now) throw new Error("PIN_LOCKED");
  const candidate = await derive(pin, base64ToBytes(profile.pinSalt), profile.pinIterations);
  if (!constantTimeEqual(candidate, profile.pinVerifier)) {
    const failedAttempts = profile.failedAttempts + 1;
    const lockSeconds = failedAttempts >= 5 ? Math.min(30 * 60, 30 * 2 ** (failedAttempts - 5)) : 0;
    await offlineDb.authProfiles.update(userId, {
      failedAttempts,
      lockoutUntil: lockSeconds ? new Date(now + lockSeconds * 1000).toISOString() : undefined,
    });
    throw new Error(lockSeconds ? "PIN_LOCKED" : "PIN_INVALID");
  }
  await offlineDb.authProfiles.update(userId, { failedAttempts: 0, lockoutUntil: undefined });
  return profile;
}
