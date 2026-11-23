import Dexie, { type Table } from "dexie";
import type { CachedProduct, LocalSale, OfflineAuthProfile } from "./types";

export interface OfflineMetadata { key: string; value: string; updatedAt: string }

export class BoutiqueOfflineDatabase extends Dexie {
  products!: Table<CachedProduct, [string, string]>;
  authProfiles!: Table<OfflineAuthProfile, string>;
  sales!: Table<LocalSale, string>;
  metadata!: Table<OfflineMetadata, string>;

  constructor() {
    super("classic-boutique-offline");
    this.version(1).stores({
      products: "[scopeKey+_id], scopeKey, cachedAt, status",
      exchangeRates: "[scopeKey+rateKey], scopeKey, cachedAt",
      authProfiles: "userId, enabled, offlineAccessExpiresAt",
      sales: "clientSaleId, idempotencyKey, ownerUserId, scopeKey, syncStatus, queuedAt, [ownerUserId+syncStatus]",
      metadata: "key, updatedAt",
    });
    // FC-only cutover: the exchange-rate cache is no longer used. Dexie
    // deletes the table on upgrade; queued sales are kept untouched.
    this.version(2).stores({ exchangeRates: null });
  }
}

export const offlineDb = new BoutiqueOfflineDatabase();

export function scopeForUser(user: { id: string; assignedCategory?: string }): string {
  return `${user.id}:${user.assignedCategory || "ALL"}`;
}
