import { offlineDb } from "./db";

/**
 * Offline PIN sign-in has been retired: every sign-in is now checked by the
 * server. Devices that enabled it still hold a PIN verifier and a copy of the
 * user profile in IndexedDB; this erases them. Queued sales are untouched.
 */
export async function purgeOfflineCredentials(): Promise<void> {
  try {
    await offlineDb.authProfiles.clear();
  } catch {
    // IndexedDB unavailable (private mode, policy): nothing was stored.
  }
}
