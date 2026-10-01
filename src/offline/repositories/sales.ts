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
    if (sale.syncStatus === "CONFLICT") return false;
    if (sale.syncStatus !== "SYNCED") return true;
    return Boolean(snapshotAt && sale.syncedAt && sale.syncedAt > snapshotAt);
  }).toArray();
  const result = new Map<string, number>();
  for (const sale of records) for (const item of sale.payload.items) {
    result.set(item.productId, (result.get(item.productId) || 0) + item.quantity);
  }
  return result;
}
