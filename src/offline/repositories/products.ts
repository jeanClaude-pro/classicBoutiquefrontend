import type { Product } from "../../types";
import { offlineDb } from "../db";

export async function cacheProducts(scopeKey: string, products: Product[]): Promise<void> {
  const cachedAt = new Date().toISOString();
  await offlineDb.transaction("rw", offlineDb.products, async () => {
    await offlineDb.products.where("scopeKey").equals(scopeKey).delete();
    await offlineDb.products.bulkPut(products.map((product) => ({ ...product, scopeKey, cachedAt })));
  });
}

export async function getCachedProducts(scopeKey: string): Promise<Product[]> {
  return offlineDb.products.where("scopeKey").equals(scopeKey).toArray();
}

export async function getProductCacheTime(scopeKey: string): Promise<string | undefined> {
  return (await offlineDb.products.where("scopeKey").equals(scopeKey).first())?.cachedAt;
}
