import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createPriceSnapshot,
  getItemFcTotal,
  getItemFcUnitPrice,
  getSaleFcTotal,
} from "../src/utils/salePricing.ts";

test("an exact 20,000 FC entry stays exact on history and receipt helpers", () => {
  const snapshot = createPriceSnapshot(20000, "FC", 2850);
  const item = { ...snapshot, quantity: 3, total: snapshot.priceUSD * 3 };
  assert.equal(snapshot.enteredPrice, 20000);
  assert.equal(snapshot.priceFC, 20000);
  assert.equal(getItemFcUnitPrice(item, 2900), 20000);
  assert.equal(getItemFcTotal(item, 2900), 60000);
  assert.equal(getSaleFcTotal(item.total, [item], 2900), 60000);
});

test("an exact 18,000 FC discounted unit price is never reconstructed from USD", () => {
  const snapshot = createPriceSnapshot(18000, "FC", 2850);
  const item = { ...snapshot, quantity: 5, total: snapshot.priceUSD * 5 };
  assert.equal(getItemFcUnitPrice(item, 2900), 18000);
  assert.equal(getItemFcTotal(item, 2900), 90000);
});

test("historical surfaces prefer saved sale snapshots and analytics never fetches today's rate", () => {
  const history = readFileSync(new URL("../src/pages/history/SalesHistory.tsx", import.meta.url), "utf8");
  const pos = readFileSync(new URL("../src/pages/NewSale.tsx", import.meta.url), "utf8");
  const analytics = readFileSync(new URL("../src/pages/analytics/Analytics.tsx", import.meta.url), "utf8");
  // Receipts of both pages go through the shared receipt module, which
  // prices every line from the sale's own FC snapshot.
  const receipt = readFileSync(new URL("../src/lib/saleReceipt.ts", import.meta.url), "utf8");
  assert.match(receipt, /getItemFcUnitPrice\(item, saleRate\)/);
  assert.doesNotMatch(receipt, /exchange-rates|fetch\(/);
  for (const source of [history, pos]) assert.match(source, /buildSaleReceipt\(/);
  assert.match(pos, /getItemFcUnitPrice/);
  assert.match(history, /getSaleFcTotal/);
  assert.match(history, /getItemFcTotal/);
  assert.doesNotMatch(history, /exchange-rates\/current/);
  assert.doesNotMatch(analytics, /exchange-rates\/current/);
});

test("the installable PWA has no offline sale queue that could bypass server validation", () => {
  const vite = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  const sourceFiles = [
    "../src/main.tsx",
    "../src/pages/NewSale.tsx",
    "../src/utils/saleCart.ts",
    "../src/lib/api.ts",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.doesNotMatch(vite, /BackgroundSyncPlugin|Queue\(/);
  assert.doesNotMatch(sourceFiles, /indexedDB|Dexie|BackgroundSyncPlugin|unsynchronized sales/i);
});

