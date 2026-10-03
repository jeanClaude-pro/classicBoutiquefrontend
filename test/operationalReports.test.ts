import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import i18n from "../src/i18n/index.ts";
import {
  businessDay,
  formatMoney,
  formatSignedChange,
  isValidRange,
  moneyCell,
  pdfText,
  productStockSheetPdfModel,
  reportRange,
  salesSheetPdfModel,
  stockSheetPdfModel,
  type ProductStockSheetPayload,
  type SalesSheetPayload,
  type StockSheetPayload,
} from "../src/pages/reports/operationalReportModel.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
const flat = (value: string) => value.replace(/[\s\u202f\u00a0]/g, "");

test.beforeEach(async () => { await i18n.changeLanguage("fr"); });

test("report periods are business days (UTC+2) and weeks start on Monday", () => {
  // 2026-10-03 23:30 UTC is already Sunday 4 October in Lubumbashi.
  const lateSaturdayUtc = new Date("2026-10-03T23:30:00Z");
  assert.equal(businessDay(lateSaturdayUtc), "2026-10-04");
  assert.deepEqual(reportRange("today", "", "", lateSaturdayUtc), { from: "2026-10-04", to: "2026-10-04" });
  assert.deepEqual(reportRange("week", "", "", lateSaturdayUtc), { from: "2026-09-28", to: "2026-10-04" });
  assert.deepEqual(reportRange("week", "", "", new Date("2026-09-28T08:00:00Z")), { from: "2026-09-28", to: "2026-09-28" });
  assert.deepEqual(reportRange("month", "", "", lateSaturdayUtc), { from: "2026-10-01", to: "2026-10-04" });
  assert.deepEqual(reportRange("custom", "2026-09-01", "2026-09-15"), { from: "2026-09-01", to: "2026-09-15" });
  assert.equal(isValidRange({ from: "2026-09-15", to: "2026-09-01" }), false);
  assert.equal(isValidRange({ from: "", to: "2026-09-01" }), false);
});

test("net sales out can be negative when voids exceed sales and is shown with the right sign", () => {
  assert.equal(formatSignedChange(0, "+"), "0");
  assert.equal(formatSignedChange(4, "+"), "+4");
  assert.equal(formatSignedChange(3, "-"), "-3");
  assert.equal(formatSignedChange(-2, "-"), "+2");
});

const usd20 = { currency: "USD" as const, usd: 20, fc: 57000 };
const stock: StockSheetPayload = {
  category: "CLOTHES",
  period: { start: "2026-09-09T22:00:00.000Z", end: "2026-09-11T21:59:59.999Z" },
  complete: false,
  rows: [
    { productId: "p1", product: "Robe soirée", category: "CLOTHES", unit: "pcs", openingStock: 15, additions: 4, reductions: 2, salesOut: 2, closingStock: 15, trackingComplete: true, sellingPrice: usd20, inventoryValue: { usd: 300, fc: 855000 } },
    { productId: "p2", product: "Veste", category: "CLOTHES", unit: "pcs", status: "deleted", openingStock: 0, additions: 8, reductions: 8, salesOut: 0, closingStock: 0, trackingComplete: true, sellingPrice: null, inventoryValue: null },
    { productId: "p3", product: "Ancien", category: "CLOTHES", unit: "pcs", openingStock: null, additions: 0, reductions: 0, salesOut: 0, closingStock: null, trackingComplete: false, sellingPrice: usd20, inventoryValue: null },
  ],
  totals: { openingStock: 15, additions: 12, reductions: 10, salesOut: 2, closingStock: 15, inventoryValue: { usd: 300, fc: 855000 } },
};
const input = {
  shop: { shopName: "ETS DOUBLE M CLASSIC BOUTIQUE", shopAddress: "780 AV. Du 30 Juin" },
  periodLabel: "10/09/2026 – 11/09/2026",
  generatedAt: "03/10/2026 10:15",
  range: { from: "2026-09-10", to: "2026-09-11" },
};

test("the global Fiche de stock PDF model carries the filters, reconciled rows and the valuation at selling price", () => {
  const model = stockSheetPdfModel(stock, input);
  assert.equal(model.title, "FICHE DE STOCK");
  assert.equal(model.shop.shopName, "ETS DOUBLE M CLASSIC BOUTIQUE");
  assert.deepEqual(model.meta.map((item) => item.value), ["10/09/2026 – 11/09/2026", "Vêtements", "03/10/2026 10:15"]);
  assert.deepEqual(model.meta.map((item) => item.label), ["Période", "Catégorie", "Généré le"]);
  assert.equal(model.fileName, "fiche-de-stock_clothes_2026-09-10_2026-09-11.pdf");
  assert.deepEqual(model.headers, ["Produit", "Catégorie", "Unité", "Stock initial", "Entrées", "Réductions", "Sorties par ventes", "Stock final", "Prix de vente", "Valeur du stock au prix de vente"]);
  // 15 + 4 - 2 - 2 = 15 pieces; 15 x $20 = $300 (855,000 FC).
  assert.deepEqual(model.body[0].slice(0, 8), ["Robe soirée", "Vêtements", "pcs", "15", "+4", "-2", "-2", "15"]);
  assert.deepEqual(model.body[0][8].split("\n").map(flat), ["20,00$US", "57000FC"]);
  assert.deepEqual(model.body[0][9].split("\n").map(flat), ["855000FC", "300,00$US"]);
  assert.match(model.body[1][0], /Veste \(supprimé\)/);
  assert.deepEqual(model.body[2].slice(3, 8), ["—", "0", "0", "0", "—"], "untracked balances are never invented");
  assert.equal(model.body[2][9], "—");
  assert.deepEqual(model.totals?.slice(0, 8), ["Total", "", "", "15", "+12", "-10", "-2", "15"]);
  assert.equal(model.body.length, stock.rows.length);
  assert.ok(model.notes.some((note) => /pas un chiffre d'affaires réalisé/.test(note)), "valuation is never presented as revenue");
  assert.ok(model.notes.some((note) => /registre de stock/.test(note)), "an incomplete ledger is stated on the PDF");
});

test("the individual Fiche de stock PDF model describes exactly one product and period", () => {
  const payload: ProductStockSheetPayload = {
    period: stock.period,
    product: { productId: "p1", name: "Chemise Classic", category: "CLOTHES", unit: "pcs", status: "active", currentStock: 13, sellingPrice: usd20 },
    row: { ...stock.rows[0], openingStock: 0, additions: 16, reductions: 1, salesOut: 2, closingStock: 13, inventoryValue: { usd: 260, fc: 741000 } },
  };
  const model = productStockSheetPdfModel(payload, input);
  assert.equal(model.title, "FICHE DE STOCK");
  assert.deepEqual(model.meta.map((item) => [item.label, item.value]), [
    ["Produit", "Chemise Classic"], ["Catégorie", "Vêtements"], ["Unité", "pcs"],
    ["Période", "10/09/2026 – 11/09/2026"], ["Généré le", "03/10/2026 10:15"],
  ]);
  assert.equal(model.fileName, "fiche-de-stock_chemise-classic_2026-09-10_2026-09-11.pdf");
  const lines = Object.fromEntries(model.body.map(([label, value]) => [label, value.split("\n").map(flat)]));
  assert.deepEqual(lines["Stock initial"], ["0"]);
  assert.deepEqual(lines["Entrées"], ["+16"]);
  assert.deepEqual(lines["Réductions"], ["-1"]);
  assert.deepEqual(lines["Sorties par ventes"], ["-2"]);
  assert.deepEqual(lines["Stock final"], ["13"]);
  assert.deepEqual(lines["Prix de vente"], ["20,00$US", "57000FC"]);
  assert.deepEqual(lines["Valeur du stock au prix de vente"], ["741000FC", "260,00$US"]);
  assert.equal(model.totals, undefined);

  const missing = productStockSheetPdfModel({ ...payload, row: null }, input);
  assert.deepEqual(missing.body, []);
  assert.equal(missing.empty, "Ce produit n'existait pas encore pendant cette période.");
});

const sales: SalesSheetPayload = {
  category: "ALL",
  period: stock.period,
  financialsVisible: true,
  rows: [{
    productId: "p1", product: "Chemise", category: "CLOTHES", unit: "pcs", quantitySold: 5,
    // 1 piece at the normal $20 and 4 pieces at the discounted $15.
    prices: [
      { currency: "USD", unitPrice: { usd: 20, fc: 57000 }, quantity: 1, revenue: { usd: 20, fc: 57000 } },
      { currency: "USD", unitPrice: { usd: 15, fc: 42750 }, quantity: 4, revenue: { usd: 60, fc: 171000 } },
    ],
    revenue: { usd: 80, fc: 228000 }, purchaseCost: { usd: 50, fc: 142500 }, profit: { usd: 30, fc: 85500 },
  }, {
    productId: "p2", product: "Robe", category: "CLOTHES", unit: "pcs", quantitySold: 2,
    prices: [{ currency: "FC", unitPrice: { fc: 20000, usd: 7.02 }, quantity: 2, revenue: { fc: 40000, usd: 14.04 } }],
    revenue: { usd: 14.04, fc: 40000 }, purchaseCost: { usd: 7.02, fc: 20000 }, profit: { usd: 7.02, fc: 20000 },
  }],
  summary: { skusSold: 2, unitsSold: 7, revenue: { usd: 94.04, fc: 268000 }, purchaseCost: { usd: 57.02, fc: 162500 }, profit: { usd: 37.02, fc: 105500 } },
};

test("the Fiche des ventes PDF lists, per product, the price it was sold at and the pieces that left", async () => {
  const model = salesSheetPdfModel(sales, input);
  assert.equal(model.title, "FICHE DES VENTES");
  assert.equal(model.meta[1].value, "Toutes les catégories");
  assert.equal(model.fileName, "fiche-des-ventes_all_2026-09-10_2026-09-11.pdf");
  assert.deepEqual(model.headers, ["Produit", "Catégorie", "Prix de vente pratiqué", "Pièces sorties", "Chiffre d'affaires", "Coût d'achat", "Bénéfice"]);
  // Each price sold at, with the pieces that left at that price.
  assert.deepEqual(model.body[0][2].split("\n").map(flat), ["20,00$US×1pcs", "15,00$US×4pcs"]);
  assert.equal(flat(model.body[0][3]), "5pcs");
  // Revenue = 1 x $20 + 4 x $15 = $80; cost $50; profit $80 - $50 = $30.
  assert.deepEqual(model.body[0].slice(4).map((cell) => cell.split("\n").map(flat)), [["228000FC", "80,00$US"], ["142500FC", "50,00$US"], ["85500FC", "30,00$US"]]);
  assert.deepEqual(model.body[1][2].split("\n").map(flat), ["20000FC×2pcs"], "an FC price stays in exact FC");
  assert.deepEqual(model.totals?.slice(0, 4), ["Total", "", "", "7"]);
  assert.deepEqual(model.summary.map((item) => item.label), ["Produits vendus", "Pièces sorties", "Chiffre d'affaires", "Coût d'achat", "Bénéfice"]);
  assert.ok(model.notes.some((note) => /prix auquel chaque pièce a été vendue × pièces sorties/.test(note)));

  await i18n.changeLanguage("en");
  const english = salesSheetPdfModel(sales, input);
  assert.deepEqual(english.headers.slice(2), ["Price sold at", "Pieces out", "Revenue", "Purchase Cost", "Profit"]);
  assert.equal(english.meta[1].value, "All categories");
});

test("without financial visibility the sales PDF keeps price sold at, pieces and revenue only", () => {
  const { purchaseCost: _c, profit: _p, ...summary } = sales.summary;
  void _c; void _p;
  const model = salesSheetPdfModel({
    ...sales, financialsVisible: false, summary,
    rows: sales.rows.map(({ purchaseCost: _rc, profit: _rp, ...row }) => { void _rc; void _rp; return row; }),
  }, input);
  assert.deepEqual(model.headers, ["Produit", "Catégorie", "Prix de vente pratiqué", "Pièces sorties", "Chiffre d'affaires"]);
  assert.doesNotMatch(JSON.stringify(model), /Bénéfice|Coût d'achat/);
});

test("money cells put FC first and the USD equivalent second", () => {
  assert.deepEqual(formatMoney(null), { primary: "—", secondary: null });
  assert.deepEqual(moneyCell({ usd: 14.04, fc: 40000 }).split("\n").map(flat), ["40000FC", "14,04$US"]);
});

test("PDF text is plain ASCII for jsPDF's standard font", () => {
  assert.equal(pdfText("Période – Catégorie : Vêtements 171 000 FC"), "Periode - Categorie : Vetements 171 000 FC");
  assert.match(pdfText("Généré le 03/10/2026 …"), /^[\x20-\x7e]+$/);
});

test("new and modified feature components use borders rather than shadows", () => {
  for (const file of [
    "src/pages/reports/ProductsSold.tsx",
    "src/pages/reports/reportControls.tsx",
    "src/pages/products/ProductStockSheet.tsx",
    "src/pages/products/StockReportDownload.tsx",
    "src/pages/analytics/Analytics.tsx",
    "src/pages/reports/operationalReportPdf.ts",
    "src/pages/NewSale.tsx",
    "src/pages/customers/Customers.tsx",
    "src/pages/products/products.tsx",
  ]) assert.doesNotMatch(read(file), /\b(?:drop-)?shadow(?:-[a-z]+)?\b/, file);
});
