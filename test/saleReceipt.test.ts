import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildSaleReceipt,
  escPosReceiptData,
  formatReceiptFC,
  receiptLines,
  renderSaleReceiptHtml,
  saleReceiptLabels,
  type SaleReceiptInput,
} from "../src/lib/saleReceipt.ts";

const clientRoot = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, clientRoot), "utf8");

const shop = {
  shopName: "ETS DOUBLE M CLASSIC BOUTIQUE",
  shopAddress: "780 AV. Du 30 Juin",
  shopNumber: "+243 975 085 799",
  shopRegistration: "LSH/RCCM/22-A-01266",
};

// Stored sale items exactly as the API returns them.
const fcEntered = { name: "SAMBASO", quantity: 1, price: 10.7142857, enteredPrice: 30000, enteredCurrency: "FC" as const, priceUSD: 10.7142857, priceFC: 30000, exchangeRate: 2800, total: 10.7142857 };
const usdEntered = { name: "CHEMISE", quantity: 2, price: 12.99, enteredPrice: 12.99, enteredCurrency: "USD" as const, priceUSD: 12.99, priceFC: 36372, exchangeRate: 2800, total: 25.98 };

const sale = (items: SaleReceiptInput["items"], exchangeRate?: number): SaleReceiptInput => ({
  ...shop,
  receiptNumber: "V-0001",
  stubNumber: "V-0001",
  date: "26/09/2026 10:00",
  customerName: "Awa",
  customerPhone: "0990000000",
  items,
  exchangeRate,
  paymentMethod: "cash",
  salesPerson: "caissier",
});

test("receipt amounts are whole francs with a fixed separator", () => {
  assert.equal(formatReceiptFC(30000), "30,000 FC");
  assert.equal(formatReceiptFC(1250000), "1,250,000 FC");
  assert.equal(formatReceiptFC(999), "999 FC");
  assert.equal(formatReceiptFC(36371.6), "36,372 FC");
  assert.equal(formatReceiptFC(undefined), "—");
});

test("an FC-entered price prints its exact FC amount", () => {
  const [line] = receiptLines([fcEntered], 2800);
  assert.deepEqual(line, { name: "SAMBASO", quantity: 1, unitFC: 30000, totalFC: 30000 });
});

test("a USD-entered price prints its FC snapshot, not the USD number", () => {
  const [line] = receiptLines([usdEntered], 2800);
  assert.equal(line.unitFC, 36372);
  assert.equal(line.totalFC, 72744);
  assert.notEqual(line.unitFC, 12.99);
});

test("an old sale reprints with its own francs, never today's rate", () => {
  // Sold when $1 = 2,500 FC; the line has no FC snapshot (legacy record).
  const legacy = { name: "CHAUSSURE", quantity: 3, price: 20, total: 60 };
  const doc = buildSaleReceipt(sale([legacy], 2500), "fr");
  assert.deepEqual(doc.lines[0], { name: "CHAUSSURE", quantity: 3, unitFC: 50000, totalFC: 150000 });
  assert.equal(doc.totalFC, 150000);
  // The line's own rate wins over the sale-level rate.
  const ownRate = { ...legacy, exchangeRate: 2400 };
  assert.equal(receiptLines([ownRate], 2800)[0].unitFC, 48000);
  // A stored FC snapshot wins over any rate.
  assert.equal(receiptLines([{ ...legacy, priceFC: 55000 }], 2800)[0].unitFC, 55000);
});

test("a custom (discounted) unit price prints as that FC price times the quantity", () => {
  const discounted = { ...fcEntered, quantity: 5, enteredPrice: 27000, priceFC: 27000, priceUSD: 27000 / 2800, price: 27000 / 2800, total: (27000 / 2800) * 5, discountApplied: true };
  const doc = buildSaleReceipt(sale([discounted], 2800), "fr");
  assert.deepEqual(doc.lines[0], { name: "SAMBASO", quantity: 5, unitFC: 27000, totalFC: 135000 });
  assert.equal(doc.subtotalFC, 135000);
  assert.equal(doc.totalFC, 135000);
});

test("subtotal and total are the sum of the FC lines", () => {
  const doc = buildSaleReceipt(sale([fcEntered, usdEntered], 2800), "fr");
  assert.equal(doc.subtotalFC, 30000 + 72744);
  assert.equal(doc.totalFC, 30000 + 72744);
});

test("a sale without any rate or FC snapshot shows — instead of a guessed amount", () => {
  const doc = buildSaleReceipt(sale([{ name: "X", quantity: 1, price: 10, total: 10 }]), "fr");
  assert.equal(doc.lines[0].unitFC, undefined);
  assert.equal(doc.totalFC, undefined);
  const html = renderSaleReceiptHtml(doc, "receipt", "");
  assert.doesNotMatch(html, /10\.00|\$/);
});

test("receipt and stub HTML show ARTICLE / PU / QTE / TOTAL in FC only (no $ anywhere)", () => {
  const doc = buildSaleReceipt(sale([fcEntered, usdEntered], 2800), "fr");
  for (const variant of ["receipt", "stub"] as const) {
    const html = renderSaleReceiptHtml(doc, variant, "");
    const header = html.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? "";
    assert.deepEqual([...header.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((match) => match[1]), ["ARTICLE", "PU", "QTE", "TOTAL"]);
    const rows = [...html.matchAll(/<tr>\s*<td class="col-article">([^<]*)<\/td>\s*<td class="col-pu">([^<]*)<\/td>\s*<td class="col-qte">([^<]*)<\/td>\s*<td class="col-total">([^<]*)<\/td>/g)]
      .map((match) => match.slice(1));
    assert.deepEqual(rows, [
      ["SAMBASO", "30,000 FC", "1", "30,000 FC"],
      ["CHEMISE", "36,372 FC", "2", "72,744 FC"],
    ]);
    assert.ok(!html.includes("$"), `${variant} contains a $ amount`);
    assert.doesNotMatch(html, /12\.99|25\.98|USD/);
    assert.match(html, /102,744 FC/);
  }
  const receipt = renderSaleReceiptHtml(doc, "receipt", "");
  assert.match(receipt, /SOUS-TOTAL:[\s\S]*?102,744 FC/);
  assert.match(receipt, /PAIEMENT:[\s\S]*?ESPECES/);
  assert.match(receipt, /CLIENT: <strong>AWA<\/strong>/);
  assert.match(receipt, /TÉLÉPHONE: <strong>0990000000<\/strong>/);
  assert.match(receipt, /AGENT: <strong>CAISSIER<\/strong>/);
});

test("the receipt follows the chosen language; names, numbers and FC do not", () => {
  const doc = buildSaleReceipt(sale([fcEntered], 2800), "en");
  const html = renderSaleReceiptHtml(doc, "receipt", "");
  const header = html.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? "";
  assert.deepEqual([...header.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((match) => match[1]), ["ITEM", "UP", "QTY", "TOTAL"]);
  for (const label of ["SUBTOTAL:", "PAYMENT:", "CUSTOMER:", "PHONE:", "AGENT:"]) assert.ok(html.includes(label), label);
  assert.match(html, /SAMBASO[\s\S]*30,000 FC/);
  assert.match(html, /V-0001/);
  assert.match(html, /<html lang="en">/);
  assert.equal(doc.paymentLabel, "CASH");
  assert.deepEqual(
    [saleReceiptLabels("fr"), saleReceiptLabels("en")].map((labels) => [labels.item, labels.unitPrice, labels.qty, labels.total, labels.subtotal, labels.payment, labels.customer, labels.phone, labels.agent]),
    [
      ["ARTICLE", "PU", "QTE", "TOTAL", "SOUS-TOTAL", "PAIEMENT", "CLIENT", "TÉLÉPHONE", "AGENT"],
      ["ITEM", "UP", "QTY", "TOTAL", "SUBTOTAL", "PAYMENT", "CUSTOMER", "PHONE", "AGENT"],
    ]
  );
});

test("product and customer names are printed as stored, escaped for HTML", () => {
  const doc = buildSaleReceipt({ ...sale([{ ...fcEntered, name: "T-shirt <XL> & co" }], 2800), customerName: "Jean <b>" }, "en");
  const html = renderSaleReceiptHtml(doc, "receipt", "");
  assert.match(html, /T-shirt &lt;XL&gt; &amp; co/);
  assert.match(html, /JEAN &lt;B&gt;/);
});

test("the thermal printer payload carries the stored snapshots and the labels of the receipt", () => {
  const doc = buildSaleReceipt(sale([fcEntered, usdEntered], 2800), "en");
  const payload = escPosReceiptData(doc);
  assert.equal(payload.items, doc.items);
  assert.equal(payload.exchangeRate, 2800);
  assert.equal(payload.paymentLabel, "CASH");
  assert.equal(payload.labels.item, "ITEM");
  assert.equal(payload.labels.unitPrice, "UP");
  assert.equal(payload.labels.stubNumber, "STUB NO. {{number}} OF THE DAY");
  assert.ok(!JSON.stringify(payload.labels).includes("$"));
});

test("every sale printing path uses the shared FC receipt and no dual-currency helper remains", () => {
  const newSale = read("src/pages/NewSale.tsx");
  const history = read("src/pages/history/SalesHistory.tsx");
  assert.match(newSale, /renderSaleReceiptHtml\(doc, "receipt"\)/);
  assert.match(newSale, /renderSaleReceiptHtml\(doc, "stub"\)/);
  assert.match(newSale, /escPosReceiptData\(doc\)/);
  assert.match(history, /renderSaleReceiptHtml\(saleReceiptDocument\(sale\), "receipt"\)/);
  assert.match(history, /formatReceiptFC\(line\.unitFC\)/);
  for (const source of [newSale, history]) {
    assert.doesNotMatch(source, /compactDual|toFixed\(2\)\}\$/);
  }
});
