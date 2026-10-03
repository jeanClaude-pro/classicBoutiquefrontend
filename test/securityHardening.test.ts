import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { escapeHtml, escapeHtmlDeep, renderSaleReceiptHtml, buildSaleReceipt } from "../src/lib/saleReceipt.ts";
import { MAX_HOLD_MINUTES, idleTimeoutMs, setActivityHold, hasActivityHold, shouldSignOut } from "../src/lib/idleTimeout.ts";

const PAYLOAD = "<img src=x onerror=alert(1)>";
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("escapeHtmlDeep escapes every nested string and keeps other values", () => {
  const entry = {
    description: PAYLOAD,
    amount: 12.5,
    active: true,
    receivedFrom: { name: `"><script>x</script>`, phone: "0990" },
    tags: [PAYLOAD],
  };
  const safe = escapeHtmlDeep(entry);
  assert.equal(safe.description, "&lt;img src=x onerror=alert(1)&gt;");
  assert.equal(safe.receivedFrom.name, "&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
  assert.equal(safe.tags[0], escapeHtml(PAYLOAD));
  assert.equal(safe.amount, 12.5);
  assert.equal(safe.active, true);
  assert.equal(entry.description, PAYLOAD, "the original record is not modified");
  // Upper-casing an escaped value keeps it inert (&LT; is a valid entity).
  assert.doesNotMatch(safe.description.toUpperCase(), /<img/i);
});

test("voucher and receipt templates read user data only from escaped copies", () => {
  for (const [file, raw, safe] of [
    ["src/pages/EntryHistory.tsx", "entry", "safeEntry"],
    ["src/pages/Entry.tsx", "receiptData", "safeReceipt"],
    ["src/pages/SortieHistory.tsx", "expense", "safeExpense"],
  ] as const) {
    const source = read(file);
    const templates = source.split("printWindow.document.write(`").slice(1).map((part) => part.split("\n`);")[0]);
    assert.ok(templates.length > 0, file);
    for (const template of templates) {
      assert.doesNotMatch(template, new RegExp(`\\$\\{[^}]*\\b${raw}\\.`), `${file}: raw ${raw} interpolated`);
      assert.match(template, new RegExp(`\\b${safe}\\.`), `${file}: escaped copy used`);
      assert.doesNotMatch(template, /<script/i, `${file}: no inline script (CSP)`);
    }
    assert.match(source, /printAndClose\(printWindow\)/, `${file}: prints from the opener`);
  }
});

test("a sale receipt renders a hostile product or customer name as text, without inline script", () => {
  const html = renderSaleReceiptHtml(buildSaleReceipt({
    receiptNumber: "S-1", date: "03/10/2026", paymentMethod: "cash", exchangeRate: 2800,
    salesPerson: PAYLOAD, customerName: PAYLOAD, customerPhone: PAYLOAD,
    items: [{ name: PAYLOAD, quantity: 1, price: 10, total: 10, priceFC: 28000 }],
    shopName: PAYLOAD, shopAddress: PAYLOAD, shopNumber: "", shopRegistration: "", receiptFooter: PAYLOAD,
  }, "fr"), "receipt", "");
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script/i);
});

test("idle timeout: default 20 minutes, bounded configuration", () => {
  assert.equal(idleTimeoutMs(undefined), 20 * 60_000);
  assert.equal(idleTimeoutMs("15"), 15 * 60_000);
  assert.equal(idleTimeoutMs("0"), 20 * 60_000);
  assert.equal(idleTimeoutMs("abc"), 20 * 60_000);
  assert.equal(idleTimeoutMs("100000"), 480 * 60_000);
});

test("idle timeout: a sale in progress defers sign-out, but not forever", () => {
  const timeoutMs = 20 * 60_000;
  const now = 10_000_000_000;
  const at = (minutesAgo: number) => now - minutesAgo * 60_000;
  assert.equal(shouldSignOut({ now, lastActivity: at(5), timeoutMs, holding: false }), false);
  assert.equal(shouldSignOut({ now, lastActivity: at(21), timeoutMs, holding: false }), true);
  assert.equal(shouldSignOut({ now, lastActivity: at(21), timeoutMs, holding: true }), false, "cart open: deferred");
  assert.equal(shouldSignOut({ now, lastActivity: at(MAX_HOLD_MINUTES + 1), timeoutMs, holding: true }), true, "hold is capped");
  setActivityHold("cart", true);
  assert.equal(hasActivityHold(), true);
  setActivityHold("cart", false);
  assert.equal(hasActivityHold(), false);
});

test("security headers are configured for the Netlify front end", () => {
  const netlify = read("netlify.toml");
  assert.match(netlify, /Content-Security-Policy = "[^"]*script-src 'self';/);
  assert.match(netlify, /frame-ancestors 'none'/);
  assert.match(netlify, /X-Content-Type-Options = "nosniff"/);
  assert.match(netlify, /Referrer-Policy = /);
  assert.match(read("vite.config.ts"), /sourcemap: false/);
});
