import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { offlineDb, scopeForUser } from "../src/offline/db";
import { cacheProducts, getCachedProducts } from "../src/offline/repositories/products";
import { cacheExchangeRate, getCachedExchangeRate } from "../src/offline/repositories/exchangeRates";
import { addLocalSale, getLocalSale, getPendingSales, pendingQuantityByProduct, updateSaleStatus } from "../src/offline/repositories/sales";
import { disableOfflineAccessForEmail, enableOfflineAccess, renewOfflineAuthorization, verifyOfflinePin } from "../src/offline/offlineAuth";
import { requeueSale, submitNewSale, synchronizeSales } from "../src/offline/syncManager";
import type { LocalSale } from "../src/offline/types";
import type { Product } from "../src/types";
import type { User } from "../src/types/auth";

const user: User = { id: "user-1", username: "Cashier", email: "cashier@example.com", role: "staff", isActive: true };
const product: Product = {
  _id: "product-1", name: "Chemise", description: "", price: 10, category: "Chemises", brand: "",
  stock: 8, minStock: 1, unit: "pcs", weight: 0, status: "active", createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

function sale(id = "sale-1", quantity = 2, ownerUserId = user.id): LocalSale {
  const occurredAt = new Date().toISOString();
  return {
    clientSaleId: id, idempotencyKey: id, receiptNumber: `POS-${id}`,
    ownerUserId, ownerName: user.username, scopeKey: scopeForUser(user), occurredAt,
    queuedAt: occurredAt, updatedAt: occurredAt, syncStatus: "PENDING", retryCount: 0,
    payload: { isWalkIn: true, items: [{ productId: product._id, quantity, price: 10 }], subtotal: 10 * quantity, total: 10 * quantity,
      paymentMethod: "cash", salesPerson: user.username, exchangeRate: 2900, requestKey: id,
      clientSaleId: id, receiptNumber: `POS-${id}`, occurredAt, offline: true },
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const jwt = (exp: number) => `header.${btoa(JSON.stringify({ exp })).replace(/=/g, "")}.signature`;
const validToken = () => jwt(Math.floor(Date.now() / 1000) + 3600);

/** Fake API: /health answers per `healthy`; POST /sales records by requestKey like the server's unique index. */
function fakeServer(options: { healthy?: boolean; respond?: (attempt: number, key: string) => Response } = {}) {
  const recorded = new Map<string, number>();
  let attempts = 0;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith("/health")) {
      if (options.healthy === false) throw new TypeError("Failed to fetch");
      return json({ ok: true });
    }
    attempts += 1;
    const key = (JSON.parse(String(init?.body)) as { requestKey: string }).requestKey;
    if (options.respond) return options.respond(attempts, key);
    if (!recorded.has(key)) recorded.set(key, recorded.size + 1);
    return json({ _id: `mongo-${recorded.get(key)}`, clientSaleId: key }, 201);
  }));
  return { recorded, attempts: () => attempts };
}

let clock = Date.now();
beforeEach(async () => {
  // Only Date is faked: each test starts past the reachability-check throttle.
  clock += 60_000;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(clock));
  offlineDb.close();
  await offlineDb.delete();
  await offlineDb.open();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("offline database", () => {
  test("initializes, caches scoped products/rates and transitions the durable sale queue", async () => {
    const scope = scopeForUser(user);
    await cacheProducts(scope, [product]);
    await cacheExchangeRate(scope, { rate: 2900, effectiveFrom: "2026-01-01", lastUpdated: "2026-01-01" });
    expect(await getCachedProducts(scope)).toHaveLength(1);
    expect(await getCachedProducts(scopeForUser({ id: "user-2" }))).toHaveLength(0);
    expect((await getCachedExchangeRate(scope))?.rate).toBe(2900);
    await addLocalSale(sale());
    expect(await getPendingSales(user.id)).toHaveLength(1);
    expect(await getPendingSales("user-2")).toHaveLength(0);
    await updateSaleStatus("sale-1", "SYNCED", { serverSaleId: "mongo-1" });
    expect(await getPendingSales(user.id)).toHaveLength(0);
  });
});

describe("offline PIN", () => {
  test("stores a derived verifier, accepts the correct PIN and rejects a wrong PIN", async () => {
    const profile = await enableOfflineAccess(user, "123456");
    expect(JSON.stringify(profile)).not.toContain("123456");
    await expect(verifyOfflinePin(user.id, "123456")).resolves.toMatchObject({ userId: user.id });
    await expect(verifyOfflinePin(user.id, "654321")).rejects.toThrow("PIN_INVALID");
  });

  test("persists lockout and enforces offline authorization expiry", async () => {
    await enableOfflineAccess(user, "123456");
    for (let attempt = 0; attempt < 4; attempt += 1) await expect(verifyOfflinePin(user.id, "000000")).rejects.toThrow("PIN_INVALID");
    await expect(verifyOfflinePin(user.id, "000000")).rejects.toThrow("PIN_LOCKED");
    await expect(verifyOfflinePin(user.id, "123456")).rejects.toThrow("PIN_LOCKED");
    await offlineDb.authProfiles.update(user.id, { lockoutUntil: undefined, offlineAccessExpiresAt: "2020-01-01T00:00:00.000Z" });
    await expect(verifyOfflinePin(user.id, "123456")).rejects.toThrow("OFFLINE_EXPIRED");
  });

  test("no profile and disabled profiles refuse offline login; online login renews the window", async () => {
    await expect(verifyOfflinePin("nobody", "123456")).rejects.toThrow("OFFLINE_DISABLED");
    await enableOfflineAccess(user, "123456");
    await offlineDb.authProfiles.update(user.id, { offlineAccessExpiresAt: "2020-01-01T00:00:00.000Z", failedAttempts: 3 });
    await renewOfflineAuthorization({ ...user, role: "cashier_supervisor" });
    const renewed = await offlineDb.authProfiles.get(user.id);
    expect(new Date(renewed!.offlineAccessExpiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(renewed).toMatchObject({ failedAttempts: 0, user: { role: "cashier_supervisor" } });
    // Server reports the account disabled: offline access is withdrawn.
    await disableOfflineAccessForEmail("CASHIER@example.com");
    await expect(verifyOfflinePin(user.id, "123456")).rejects.toThrow("OFFLINE_DISABLED");
  });

  test("rejects PINs shorter than six digits", async () => {
    await expect(enableOfflineAccess(user, "1234")).rejects.toThrow("PIN_LENGTH");
  });
});

describe("synchronization", () => {
  test("serializes simultaneous triggers and resolves a lost response by retrying the same identity", async () => {
    await addLocalSale(sale());
    const server = fakeServer({
      respond: (attempt) => {
        if (attempt === 1) throw new TypeError("response lost");
        return json({ _id: "mongo-1", clientSaleId: "sale-1" });
      },
    });
    const first = synchronizeSales(user.id, validToken(), true);
    expect(synchronizeSales(user.id, validToken(), true)).toBe(first);
    await first;
    expect((await getLocalSale("sale-1"))?.syncStatus).toBe("PENDING");
    await synchronizeSales(user.id, validToken(), true);
    expect(server.attempts()).toBe(2);
    expect(await getLocalSale("sale-1")).toMatchObject({ syncStatus: "SYNCED", serverSaleId: "mongo-1" });
  });

  test("three offline sales synchronize once each and a second run sends nothing", async () => {
    for (const id of ["a", "b", "c"]) await addLocalSale(sale(id, 1));
    const server = fakeServer();
    await synchronizeSales(user.id, validToken(), true);
    await synchronizeSales(user.id, validToken(), true);
    expect(server.recorded.size).toBe(3);
    expect(server.attempts()).toBe(3);
    expect(await getPendingSales(user.id)).toHaveLength(0);
  });

  test("a sale left SYNCING by a reload is resubmitted with the same key", async () => {
    await addLocalSale({ ...sale(), syncStatus: "SYNCING", retryCount: 1 });
    const server = fakeServer();
    await synchronizeSales(user.id, validToken(), true);
    expect([...server.recorded.keys()]).toEqual(["sale-1"]);
    expect((await getLocalSale("sale-1"))?.syncStatus).toBe("SYNCED");
  });

  test("an expired session or unreachable API leaves the queue untouched", async () => {
    await addLocalSale(sale());
    const server = fakeServer({ healthy: false });
    await synchronizeSales(user.id, validToken(), true);
    await synchronizeSales(user.id, jwt(1), true);
    await synchronizeSales(user.id, null, true);
    expect(server.attempts()).toBe(0);
    expect((await getLocalSale("sale-1"))?.syncStatus).toBe("PENDING");
  });

  test("a 401 during sync keeps the sale pending for the next legitimate session", async () => {
    await addLocalSale(sale());
    fakeServer({ respond: () => json({ message: "expired" }, 401) });
    await synchronizeSales(user.id, validToken(), true);
    expect(await getLocalSale("sale-1")).toMatchObject({ syncStatus: "PENDING", retryCount: 1 });
  });

  test("transient 5xx stays pending; a business refusal is parked as CONFLICT and not retried blindly", async () => {
    await addLocalSale(sale("transient"));
    fakeServer({ respond: () => json({ message: "down" }, 503) });
    await synchronizeSales(user.id, validToken(), true);
    expect(await getLocalSale("transient")).toMatchObject({ syncStatus: "PENDING", retryCount: 1 });

    const server = fakeServer({ respond: () => json({ error: "IDEMPOTENCY_CONFLICT", message: "conflict" }, 409) });
    await synchronizeSales(user.id, validToken(), true);
    expect(await getLocalSale("transient")).toMatchObject({ syncStatus: "CONFLICT" });
    await synchronizeSales(user.id, validToken(), true);
    expect(server.attempts()).toBe(1);
    await requeueSale("transient");
    expect((await getLocalSale("transient"))?.syncStatus).toBe("PENDING");
  });
});

describe("checkout", () => {
  test("online: recorded immediately and marked SYNCED", async () => {
    fakeServer();
    const outcome = await submitNewSale(sale(), validToken());
    expect(outcome.kind).toBe("synced");
    expect(await getLocalSale("sale-1")).toMatchObject({ syncStatus: "SYNCED", serverSaleId: "mongo-1" });
  });

  test("browser online but API down: stored locally as pending without a sale request", async () => {
    const server = fakeServer({ healthy: false });
    const outcome = await submitNewSale(sale(), validToken());
    expect(outcome.kind).toBe("queued");
    expect(server.attempts()).toBe(0);
    expect(await getPendingSales(user.id)).toHaveLength(1);
  });

  test("offline session (no token): stored locally and survives a database reopen", async () => {
    fakeServer();
    expect((await submitNewSale(sale(), null)).kind).toBe("queued");
    offlineDb.close();
    await offlineDb.open();
    expect(await getLocalSale("sale-1")).toMatchObject({ syncStatus: "PENDING", payload: { exchangeRate: 2900 } });
  });

  test("a refusal at the till keeps nothing locally and returns the server error", async () => {
    fakeServer({ respond: () => json({ error: "EXCHANGE_RATE_CHANGED", message: "rate changed", exchangeRate: 2950 }, 409) });
    const outcome = await submitNewSale(sale(), validToken());
    expect(outcome.kind).toBe("rejected");
    if (outcome.kind === "rejected") expect(outcome.error.status).toBe(409);
    expect(await getLocalSale("sale-1")).toBeUndefined();
  });

  test("a double submission of the same checkout posts once", async () => {
    const server = fakeServer();
    const results = await Promise.allSettled([submitNewSale(sale(), validToken()), submitNewSale(sale(), validToken())]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(server.attempts()).toBe(1);
  });

  test("the rate snapshot taken at checkout is sent unchanged when synchronizing later", async () => {
    await submitNewSale(sale(), null);
    fakeServer();
    await synchronizeSales(user.id, validToken(), true);
    const bodies = vi.mocked(fetch).mock.calls
      .filter(([input]) => String(input).endsWith("/sales"))
      .map(([, init]) => (JSON.parse(String(init?.body)) as { exchangeRate: number; occurredAt: string }));
    expect(bodies).toHaveLength(1);
    expect(bodies[0].exchangeRate).toBe(2900);
    expect(bodies[0].occurredAt).toBe((await getLocalSale("sale-1"))?.occurredAt);
  });
});

describe("offline stock", () => {
  test("subtracts every unsynced sale on the device and sales synced after the snapshot, never parked conflicts", async () => {
    const snapshotAt = new Date(Date.now() - 60_000).toISOString();
    await addLocalSale(sale("mine", 2));
    await addLocalSale(sale("colleague", 1, "user-2"));
    await addLocalSale({ ...sale("synced-after", 3), syncStatus: "SYNCED", syncedAt: new Date().toISOString() });
    await addLocalSale({ ...sale("synced-before", 4), syncStatus: "SYNCED", syncedAt: "2020-01-01T00:00:00.000Z" });
    await addLocalSale({ ...sale("parked", 5), syncStatus: "CONFLICT" });
    expect((await pendingQuantityByProduct(snapshotAt)).get(product._id)).toBe(6);
    expect((await pendingQuantityByProduct()).get(product._id)).toBe(3);
  });
});
