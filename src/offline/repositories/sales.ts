import { offlineDb } from "../db";
import type { LocalSale, SyncStatus } from "../types";

export const addLocalSale = (sale: LocalSale) => offlineDb.sales.add(sale);
export const getLocalSale = (id: string) => offlineDb.sales.get(id);
export const deleteLocalSale = (id: string) => offlineDb.sales.delete(id);
export async function getUserSales(userId: string): Promise<LocalSale[]> {
  const sales = await offlineDb.sales.where("ownerUserId").equals(userId).toArray();
  return sales.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}
// SYNCING is included so a sale interrupted by a reload/crash mid-request is
// resubmitted; the idempotency key makes that resubmission safe.
export const getPendingSales = (userId: string) => offlineDb.sales.where("[ownerUserId+syncStatus]").anyOf(
  [[userId, "PENDING"], [userId, "FAILED"], [userId, "SYNCING"]],
).sortBy("queuedAt");

/** Every sale stored on this device, all cashiers, newest first. */
export async function getDeviceSales(): Promise<LocalSale[]> {
  const sales = await offlineDb.sales.toArray();
  return sales.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}

export interface DeviceQueueSummary {
  /** Sales refused by the server and not yet handled (any cashier). */
  refused: number;
  /** Sales of the signed-in cashier still waiting to reach the server. */
  mineWaiting: number;
  /** Sales of other cashiers waiting on this device: only they can send them. */
  othersWaiting: number;
  otherCashiers: string[];
}

const WAITING: SyncStatus[] = ["PENDING", "SYNCING", "FAILED"];

/** What on this device has not safely reached the server yet. */
export async function deviceQueueSummary(currentUserId?: string): Promise<DeviceQueueSummary> {
  const summary: DeviceQueueSummary = { refused: 0, mineWaiting: 0, othersWaiting: 0, otherCashiers: [] };
  const names = new Set<string>();
  await offlineDb.sales.each((sale) => {
    if (sale.syncStatus === "CONFLICT") summary.refused += 1;
    else if (WAITING.includes(sale.syncStatus)) {
      if (sale.ownerUserId === currentUserId) summary.mineWaiting += 1;
      else { summary.othersWaiting += 1; names.add(sale.ownerName || sale.ownerUserId); }
    }
  });
  summary.otherCashiers = [...names].sort();
  return summary;
}

export async function updateSaleStatus(
  clientSaleId: string,
  syncStatus: SyncStatus,
  changes: Partial<LocalSale> = {},
): Promise<void> {
  await offlineDb.sales.update(clientSaleId, { ...changes, syncStatus, updatedAt: new Date().toISOString() });
}

/**
 * Quantities that the device has sold but the given stock snapshot does not
 * reflect yet: every unsynchronized sale on this device (any cashier — stock
 * is shared), plus sales synchronized after the snapshot was taken. Parked
 * CONFLICT sales never reached server stock, so they are not subtracted.
 */
export async function pendingQuantityByProduct(snapshotAt?: string): Promise<Map<string, number>> {
  const records = await offlineDb.sales.filter((sale) => {
    if (sale.syncStatus === "CONFLICT" || sale.syncStatus === "RESOLVED") return false;
    if (sale.syncStatus !== "SYNCED") return true;
    return Boolean(snapshotAt && sale.syncedAt && sale.syncedAt > snapshotAt);
  }).toArray();
  const result = new Map<string, number>();
  for (const sale of records) for (const item of sale.payload.items) {
    result.set(item.productId, (result.get(item.productId) || 0) + item.quantity);
  }
  return result;
}
