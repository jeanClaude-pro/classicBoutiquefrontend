import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPriceSnapshot, getItemTotal, getItemUnitPrice } from "../src/utils/salePricing.ts";

test("an exact 20,000 FC entry stays exact on history and receipt helpers", () => {
  const snapshot = createPriceSnapshot(20000);
  const item = { ...snapshot, quantity: 3, total: 60000 };
  assert.equal(snapshot.enteredPrice, 20000);
  assert.equal(snapshot.priceFC, 20000);
  assert.equal(getItemUnitPrice(item), 20000);
  assert.equal(getItemTotal(item), 60000);
});

test("the interface works in FC only and never asks for an exchange rate", () => {
  const files = [
    "../src/pages/history/SalesHistory.tsx", "../src/pages/NewSale.tsx", "../src/pages/analytics/Analytics.tsx",
    "../src/pages/Entry.tsx", "../src/pages/Sortie.tsx", "../src/pages/products/products.tsx",
    "../src/pages/Remboursements.tsx", "../src/lib/saleReceipt.ts", "../src/utils/salePricing.ts",
  ].map((path) => [path, readFileSync(new URL(path, import.meta.url), "utf8")] as const);
  for (const [path, source] of files) {
    assert.doesNotMatch(source, /exchange-rates|exchangeRate|formatUSD|currency: "USD"/, path);
  }
  // Receipts of both pages go through the shared receipt module.
  const history = files[0][1];
  const pos = files[1][1];
  for (const source of [history, pos]) assert.match(source, /buildSaleReceipt\(/);
  assert.doesNotMatch(files[7][1], /fetch\(/);
});

test("the financial queue is application-managed and still submits through server validation", () => {
  const vite = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  const pos = readFileSync(new URL("../src/pages/NewSale.tsx", import.meta.url), "utf8");
  const sync = readFileSync(new URL("../src/offline/syncManager.ts", import.meta.url), "utf8");
  const model = readFileSync(new URL("../../server/models/Sale.js", import.meta.url), "utf8");
  assert.doesNotMatch(vite, /BackgroundSyncPlugin|Queue\(/);
  // Checkout goes through the outbox, which persists before any network call.
  assert.match(pos, /submitNewSale\(localSale, signedIn && !sessionUnconfirmed\)/);
  assert.match(sync, /await addLocalSale\(sale\);\s*\n\s*if \(!signedIn/);
  assert.match(sync, /fetch\(`\$\{serverUrl\}\/sales`/);
  // The session is the httpOnly cookie, never a header built by page code.
  assert.match(sync, /credentials: "same-origin"/);
  assert.doesNotMatch(sync, /Authorization/);
  assert.match(model, /requestKey_unique_when_set/);
});

