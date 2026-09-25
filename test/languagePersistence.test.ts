import test from "node:test";
import assert from "node:assert/strict";

// A browser-like storage shared by the i18n module and the session helpers.
class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.has(key) ? this.values.get(key)! : null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}
const storage = new MemoryStorage();
Object.assign(globalThis, {
  localStorage: storage,
  window: { localStorage: storage, addEventListener() {}, location: { origin: "" } },
});

const { APP_LANGUAGE_KEY, changeAppLanguage, currentLanguage, readStoredLanguage, t } = await import("../src/i18n/index.ts");
const { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAuthStorage } = await import("../src/lib/sessionManager.ts");
const { saleReceiptLabels } = await import("../src/lib/saleReceipt.ts");

test("the chosen language is saved and applied immediately", async () => {
  await changeAppLanguage("en");
  assert.equal(currentLanguage(), "en");
  assert.equal(storage.getItem(APP_LANGUAGE_KEY), "en");
  assert.equal(t("salesHistory.allSales"), "All sales");
  await changeAppLanguage("fr");
  assert.equal(currentLanguage(), "fr");
  assert.equal(t("salesHistory.allSales"), "Toutes les ventes");
});

test("a refresh starts in the saved language", async () => {
  await changeAppLanguage("en");
  // A page load reads the stored value before the first render.
  assert.equal(readStoredLanguage(storage), "en");
});

test("logging out keeps the language: only the session is cleared", async () => {
  await changeAppLanguage("en");
  storage.setItem(AUTH_TOKEN_KEY, "token");
  storage.setItem(AUTH_USER_KEY, "{}");
  clearAuthStorage();
  assert.equal(storage.getItem(AUTH_TOKEN_KEY), null);
  assert.equal(storage.getItem(AUTH_USER_KEY), null);
  assert.equal(storage.getItem(APP_LANGUAGE_KEY), "en");
  assert.equal(readStoredLanguage(storage), "en");
});

test("missing, invalid or blocked storage falls back to French", () => {
  assert.equal(readStoredLanguage(null), "fr");
  assert.equal(readStoredLanguage({ getItem: () => "de" }), "fr");
  assert.equal(readStoredLanguage({ getItem: () => { throw new Error("blocked"); } }), "fr");
});

test("receipts printed after switching language use that language", async () => {
  await changeAppLanguage("en");
  assert.equal(saleReceiptLabels().unitPrice, "UP");
  await changeAppLanguage("fr");
  assert.equal(saleReceiptLabels().unitPrice, "PU");
});

test("both dictionaries define exactly the same keys", async () => {
  const { readFileSync } = await import("node:fs");
  const load = (language: string) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}.json`, import.meta.url), "utf8"));
  const flatten = (value: Record<string, unknown>, prefix = ""): string[] =>
    Object.entries(value).flatMap(([key, child]) =>
      child && typeof child === "object" ? flatten(child as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]);
  assert.deepEqual(flatten(load("en")).sort(), flatten(load("fr")).sort());
});
