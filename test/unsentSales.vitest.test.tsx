// Nothing rung up on a till may disappear silently: a hung request becomes a
// retryable network failure, and every unsent or refused sale on the device
// (whoever rang it up) is counted and shown.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { offlineDb } from "../src/offline/db";
import { addLocalSale, deviceQueueSummary, getLocalSale, pendingQuantityByProduct } from "../src/offline/repositories/sales";
import { resolveRefusedSale, submitNewSale, syncSettings, SUBMIT_TIMEOUT_MS } from "../src/offline/syncManager";
import { fetchWithTimeout, toApiError } from "../src/lib/apiError";
import type { LocalSale, SyncStatus } from "../src/offline/types";

function sale(id: string, ownerUserId: string, ownerName: string, syncStatus: SyncStatus, quantity = 1): LocalSale {
  const at = new Date().toISOString();
  return {
    clientSaleId: id, idempotencyKey: id, receiptNumber: `POS-${id}`, ownerUserId, ownerName, scopeKey: `${ownerUserId}:ALL`,
    occurredAt: at, queuedAt: at, updatedAt: at, syncStatus, retryCount: 0,
    payload: { isWalkIn: true, items: [{ productId: "p1", quantity }], subtotal: 10, total: 10, paymentMethod: "cash", salesPerson: ownerName,
      exchangeRate: 2800, requestKey: id, clientSaleId: id, receiptNumber: `POS-${id}`, occurredAt: at, offline: true },
  };
}

const jwt = (exp: number) => `header.${btoa(JSON.stringify({ exp })).replace(/=/g, "")}.signature`;

beforeEach(async () => { await offlineDb.sales.clear(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

test("the device summary counts refused sales and every cashier's waiting sales", async () => {
  await addLocalSale(sale("a", "me", "jean", "PENDING"));
  await addLocalSale(sale("b", "me", "jean", "CONFLICT"));
  await addLocalSale(sale("c", "other", "marie", "PENDING"));
  await addLocalSale(sale("d", "other", "marie", "FAILED"));
  await addLocalSale(sale("e", "other", "marie", "SYNCED"));
  expect(await deviceQueueSummary("me")).toEqual({ refused: 1, mineWaiting: 1, othersWaiting: 2, otherCashiers: ["marie"] });
});

test("a handled refused sale leaves the warning and never counts as sold stock", async () => {
  await addLocalSale(sale("x", "me", "jean", "CONFLICT", 3));
  await resolveRefusedSale("x", "manager");
  const stored = await getLocalSale("x");
  expect(stored?.syncStatus).toBe("RESOLVED");
  expect(stored?.resolvedBy).toBe("manager");
  expect((await deviceQueueSummary("me")).refused).toBe(0);
  expect((await pendingQuantityByProduct()).get("p1")).toBeUndefined();
});

test("a request that hangs is abandoned as a network failure", async () => {
  vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  })));
  const failure = await fetchWithTimeout("https://api.test.invalid/api/entries", { method: "POST" }, 30).catch(toApiError);
  expect(failure.isNetwork).toBe(true);
});

test("a checkout whose request hangs stays safely queued with its key", async () => {
  syncSettings.submitTimeoutMs = 50;
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith("/health")) return Promise.resolve(new Response("{}", { status: 200 }));
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    });
  }));
  const outcome = await submitNewSale(sale("hang", "me", "jean", "PENDING"), jwt(Math.floor(Date.now() / 1000) + 3600))
    .finally(() => { syncSettings.submitTimeoutMs = SUBMIT_TIMEOUT_MS; });
  expect(outcome.kind).toBe("queued");
  const stored = await getLocalSale("hang");
  expect(stored?.syncStatus).toBe("PENDING");
  expect(stored?.payload.requestKey).toBe("hang");
});
