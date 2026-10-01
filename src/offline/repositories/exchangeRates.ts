import { offlineDb } from "../db";
import type { ExchangeRateSnapshot } from "../types";

const CURRENT = "current";

export async function cacheExchangeRate(scopeKey: string, rate: ExchangeRateSnapshot): Promise<void> {
  await offlineDb.exchangeRates.put({ ...rate, scopeKey, rateKey: CURRENT, cachedAt: new Date().toISOString() });
}

export async function getCachedExchangeRate(scopeKey: string): Promise<ExchangeRateSnapshot | undefined> {
  return offlineDb.exchangeRates.get([scopeKey, CURRENT]);
}
