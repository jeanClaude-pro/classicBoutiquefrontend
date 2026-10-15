import { ApiError, apiErrorFromPayload, toApiError } from "../lib/apiError";
import { isTokenExpired } from "../lib/sessionManager";
import { serverUrl } from "../utils/constants";
import { checkApiReachability } from "./connectivity";
import { addLocalSale, deleteLocalSale, getLocalSale, getPendingSales, updateSaleStatus } from "./repositories/sales";
import type { LocalSale } from "./types";

export type SubmitOutcome =
  | { kind: "synced"; sale: LocalSale }
  | { kind: "queued"; sale: LocalSale; error?: ApiError }
  | { kind: "rejected"; sale: LocalSale; error: ApiError };

// Every server submission of the queue runs through this single chain, so a
// background sync, a manual retry and a new checkout can never post the same
// sale concurrently from this tab. Other tabs are covered by the server's
// unique idempotency key.
let chain: Promise<unknown> = Promise.resolve();

/** Longest wait for one sale submission before it is treated as a network failure. */
export const SUBMIT_TIMEOUT_MS = 20_000;
/** Mutable so tests can shorten the wait; the application never changes it. */
export const syncSettings = { submitTimeoutMs: SUBMIT_TIMEOUT_MS };
let activeSync: Promise<void> | null = null;

function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
}

// Network failures, an expired/invalid session (401), an account the server
// currently refuses (403), timeouts, throttling and 5xx are transient: the
// sale stays queued. Any other 4xx is a business refusal that a blind retry
// cannot fix, so it is parked for a person to review instead of looping.
function isRetryable(error: ApiError): boolean {
  if (error.isNetwork) return true;
  const status = error.status ?? 500;
  return status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;
}

async function submit(sale: LocalSale, token: string): Promise<SubmitOutcome> {
  await updateSaleStatus(sale.clientSaleId, "SYNCING", {
    lastAttemptAt: new Date().toISOString(), retryCount: sale.retryCount + 1, lastError: undefined,
  });
  try {
    // Always the payload captured at checkout: same idempotency key, same
    // occurrence time and rate snapshot, never recomputed.
    // A shaky connection can leave a request hanging for minutes. After
    // SUBMIT_TIMEOUT_MS the attempt is abandoned as a network failure: the
    // sale stays safely queued and the next attempt reuses the same key, so
    // the server replays it if this one did arrive.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), syncSettings.submitTimeoutMs);
    let response: Response;
    let data: Record<string, unknown>;
    try {
      response = await fetch(`${serverUrl}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sale.payload),
        signal: controller.signal,
      });
      data = await response.json().catch(() => ({})) as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw apiErrorFromPayload(response.status, data);
    const syncedAt = new Date().toISOString();
    await updateSaleStatus(sale.clientSaleId, "SYNCED", {
      serverSaleId: String(data._id || data.saleId || ""), serverSale: data, lastError: undefined, syncedAt,
    });
    return { kind: "synced", sale: { ...sale, syncStatus: "SYNCED", serverSale: data, syncedAt } };
  } catch (cause) {
    const error = toApiError(cause);
    const retryable = isRetryable(error);
    await updateSaleStatus(sale.clientSaleId, retryable ? "PENDING" : "CONFLICT", { lastError: error.message });
    return retryable
      ? { kind: "queued", sale: { ...sale, syncStatus: "PENDING" }, error }
      : { kind: "rejected", sale: { ...sale, syncStatus: "CONFLICT" }, error };
  }
}

function canReachServer(token: string | null): token is string {
  return Boolean(token) && !isTokenExpired(token);
}

/**
 * Drains this user's queue, oldest first. Concurrent callers share one run.
 * Stops at the first transient failure (the server or session is unusable,
 * so the following sales would fail the same way).
 */
export function synchronizeSales(userId: string, token: string | null, force = false): Promise<void> {
  if (activeSync) return activeSync;
  activeSync = exclusive(async () => {
    if (!canReachServer(token) || !(await checkApiReachability())) return;
    const queued = await getPendingSales(userId);
    for (const sale of queued) {
      const backoffMs = Math.min(5 * 60_000, 5_000 * 2 ** Math.min(sale.retryCount, 6));
      if (!force && sale.lastAttemptAt && Date.now() - new Date(sale.lastAttemptAt).getTime() < backoffMs) continue;
      const outcome = await submit(sale, token);
      if (outcome.kind === "queued") break;
    }
  }).finally(() => {
    activeSync = null;
    window.dispatchEvent(new Event("offline-sales:changed"));
  });
  return activeSync;
}

/**
 * Checkout path. The sale is durably stored before any network attempt, then
 * submitted once if the API is reachable with a valid session.
 * - synced: the server recorded it (or replayed an earlier identical submit).
 * - queued: it stays in the outbox; the receipt can be printed.
 * - rejected: the server refused it while the cashier is still at the till
 *   (stock, rate change, discount floor...). Nothing was recorded, so the
 *   local copy is removed and the cart stays editable, exactly as before
 *   offline support existed.
 */
export function submitNewSale(sale: LocalSale, token: string | null): Promise<SubmitOutcome> {
  return exclusive(async () => {
    await addLocalSale(sale);
    if (!canReachServer(token) || !(await checkApiReachability())) return { kind: "queued", sale } as const;
    const outcome = await submit(sale, token);
    if (outcome.kind === "rejected") await deleteLocalSale(sale.clientSaleId);
    return outcome;
  }).finally(() => window.dispatchEvent(new Event("offline-sales:changed")));
}

/**
 * Best effort before a sign-out (button or idle): send this cashier's queued
 * sales now, waiting at most `maxWaitMs`. Whatever is not sent stays safely
 * queued on the device for the cashier's next online sign-in.
 */
export async function flushBeforeSignOut(userId: string | undefined, token: string | null, maxWaitMs = 10_000): Promise<void> {
  if (!userId || !token) return;
  try {
    if (!(await getPendingSales(userId)).length) return;
    await Promise.race([
      synchronizeSales(userId, token, true),
      new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
    ]);
  } catch {
    // Sign-out must never be blocked: the queue survives on the device.
  }
}

/**
 * A manager confirms a refused sale was checked (and recorded again if it
 * was a real sale). It leaves the warning list but stays on the device.
 */
export async function resolveRefusedSale(clientSaleId: string, resolvedBy: string): Promise<void> {
  const sale = await getLocalSale(clientSaleId);
  if (!sale || sale.syncStatus !== "CONFLICT") return;
  await updateSaleStatus(clientSaleId, "RESOLVED", { resolvedAt: new Date().toISOString(), resolvedBy });
  window.dispatchEvent(new Event("offline-sales:changed"));
}

/** Puts a parked sale back in the queue for one more attempt (same identity). */
export async function requeueSale(clientSaleId: string): Promise<void> {
  const sale = await getLocalSale(clientSaleId);
  if (!sale || sale.syncStatus === "SYNCED" || sale.syncStatus === "SYNCING") return;
  await updateSaleStatus(clientSaleId, "PENDING", { lastAttemptAt: undefined });
}
