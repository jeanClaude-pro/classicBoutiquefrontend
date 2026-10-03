import type { Product } from "../types";
import type { User } from "../types/auth";

export type ConnectivityState = "online" | "offline" | "checking";
export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";

export interface ExchangeRateSnapshot {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

export interface CachedProduct extends Product {
  scopeKey: string;
  cachedAt: string;
}

export interface CachedExchangeRate extends ExchangeRateSnapshot {
  rateKey: string;
  scopeKey: string;
  cachedAt: string;
}

export interface OfflineSalePayload {
  customer?: { name: string; phone: string; email: string };
  isWalkIn: boolean;
  items: Array<Record<string, unknown> & { productId: string; quantity: number }>;
  subtotal: number;
  total: number;
  paymentMethod: "cash" | "card" | "transfer" | "other";
  salesPerson: string;
  exchangeRate: number;
  requestKey: string;
  clientSaleId: string;
  receiptNumber: string;
  occurredAt: string;
  offline: boolean;
  isFamilySale?: boolean;
  familyMemberId?: string;
}

export interface LocalSale {
  clientSaleId: string;
  idempotencyKey: string;
  receiptNumber: string;
  ownerUserId: string;
  ownerName: string;
  scopeKey: string;
  occurredAt: string;
  queuedAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  retryCount: number;
  lastAttemptAt?: string;
  lastError?: string;
  serverSaleId?: string;
  syncedAt?: string;
  serverSale?: Record<string, unknown>;
  payload: OfflineSalePayload;
}

export interface OfflineAuthProfile {
  userId: string;
  user: User;
  scopeKey: string;
  pinSalt: string;
  pinVerifier: string;
  pinIterations: number;
  enabled: boolean;
  lastOnlineAuthenticationAt: string;
  offlineAccessExpiresAt: string;
  failedAttempts: number;
  lockoutUntil?: string;
  authorizationVersion: number;
}

export interface OfflineSession {
  kind: "offline";
  user: User;
  startedAt: string;
  expiresAt: string;
}
