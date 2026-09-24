import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { categoryPresentation, FUNDS_LABEL, type CategoryAccountingDTO } from "../src/pages/analytics/accountingPresentation.ts";

const dto = (overrides: Partial<CategoryAccountingDTO> = {}): CategoryAccountingDTO => ({
  revenue: 1000, costOfGoodsSold: 600, grossProfit: 400, companyExpenses: 100, netProfit: 300,
  goodsPurchases: 700, recoveredCapital: 600, profitUsedForPurchases: 100, distributableProfit: 200,
  shareholder1: 200, shareholder2: 0,
  balance: {
    recoveredCapital: 5600, lossCoveredByCapital: 0, netProfit: 1300, goodsPurchases: 6000,
    capitalUsedForPurchases: 5600, profitUsedForPurchases: 400, remainingRecoveredCapital: 0,
    availablePurchaseFunds: 900, fundingShortfall: 0, generatedPurchaseFunds: 6900,
    distributableProfit: 900, shareholder1: 900, shareholder2: 0,
  },
  ...overrides,
});

const valueOf = (row: CategoryAccountingDTO, id: string): number => {
  const [scope, field] = id.includes(".") ? id.split(".") : [null, id];
  const source = (scope ? row.balance : row) as unknown as Record<string, number>;
  return source[field];
};

test("every displayed number is the backend value, unchanged", () => {
  for (const category of ["CLOTHES", "SHOES"] as const) {
    const row = dto({ shareholder1: 100.01, shareholder2: 100, distributableProfit: 200.01 });
    const view = categoryPresentation(category, row);
    for (const metric of [...view.period, ...view.balance]) {
      assert.equal(metric.value, valueOf(row, metric.id), `${category} ${metric.id}`);
    }
  }
});

test("SHOES shows both shareholder shares and never a profit-funded purchase", () => {
  const view = categoryPresentation("SHOES", dto({ profitUsedForPurchases: 0, shareholder1: 150.01, shareholder2: 150 }));
  const ids = view.period.map((metric) => metric.id);
  assert.ok(!ids.includes("profitUsedForPurchases"));
  assert.deepEqual(ids.slice(-3), ["distributableProfit", "shareholder1", "shareholder2"]);
  assert.match(view.fundsExplanation, /seul le capital récupéré/);
});

test("CLOTHES shows profit used for replenishment only when it happened", () => {
  assert.ok(categoryPresentation("CLOTHES", dto()).period.some((metric) => metric.id === "profitUsedForPurchases"));
  assert.ok(!categoryPresentation("CLOTHES", dto({ profitUsedForPurchases: 0 })).period.some((metric) => metric.id === "profitUsedForPurchases"));
});

test("a loss is shown as a loss and a shortfall is never hidden", () => {
  const view = categoryPresentation("SHOES", dto({ netProfit: -200, distributableProfit: 0, shareholder1: 0, balance: { ...dto().balance!, fundingShortfall: 300 } }));
  const net = view.period.find((metric) => metric.id === "netProfit")!;
  assert.equal(net.value, -200);
  assert.equal(net.tone, "negative");
  assert.match(net.label, /perte/);
  assert.ok(view.balance.some((metric) => metric.id === "balance.fundingShortfall" && metric.value === 300));
  assert.ok(!categoryPresentation("SHOES", dto()).balance.some((metric) => metric.id === "balance.fundingShortfall"));
});

test("replenishment funds use accurate terminology", () => {
  const view = categoryPresentation("SHOES", dto());
  const funds = view.balance.find((metric) => metric.id === "balance.availablePurchaseFunds")!;
  assert.equal(funds.label, FUNDS_LABEL);
  assert.equal(FUNDS_LABEL, "Fonds disponibles pour réapprovisionnement");
  assert.ok([...view.period, ...view.balance].every((metric) => !/chiffre d'affaires disponible/i.test(metric.label)));
});

test("Analytics and the PDF share this mapping and do no arithmetic of their own", () => {
  const pdf = readFileSync(new URL("../src/pages/analytics/reportGenerator.ts", import.meta.url), "utf8");
  const screen = readFileSync(new URL("../src/pages/analytics/Analytics.tsx", import.meta.url), "utf8");
  for (const source of [pdf, screen]) assert.match(source, /categoryPresentation\(key, /);
  assert.doesNotMatch(pdf, /row\.\w+\s*[-+*/]\s*\w/);
  assert.doesNotMatch(screen, /cat\.\w+\s*[-+*/]\s*\w/);
});
