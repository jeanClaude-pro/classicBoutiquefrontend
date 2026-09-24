// Shared by the Analytics screen and the PDF report so both show the same
// authoritative backend numbers under the same labels. This module only
// selects and labels fields; it never recalculates accounting values.
import i18n, { t } from "../../i18n/index.ts";

export type AccountingCategory = "CLOTHES" | "SHOES";

export interface CategoryBalanceDTO {
  recoveredCapital: number;
  lossCoveredByCapital: number;
  netProfit: number;
  goodsPurchases: number;
  capitalUsedForPurchases: number;
  profitUsedForPurchases: number;
  remainingRecoveredCapital: number;
  availablePurchaseFunds: number;
  fundingShortfall: number;
  generatedPurchaseFunds: number;
  distributableProfit: number;
  shareholder1: number;
  shareholder2: number;
  asOf?: string;
}

export interface CategoryAccountingDTO {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  companyExpenses: number;
  netProfit: number;
  goodsPurchases: number;
  recoveredCapital: number;
  profitUsedForPurchases: number;
  distributableProfit: number;
  shareholder1: number;
  shareholder2: number;
  revenueFC?: number;
  costOfGoodsSoldFC?: number;
  grossProfitFC?: number;
  companyExpensesFC?: number;
  netProfitFC?: number;
  distributableProfitFC?: number;
  shareholder1FC?: number;
  shareholder2FC?: number;
  availablePurchaseFunds?: number | null;
  fundingShortfall?: number | null;
  balance?: CategoryBalanceDTO;
}

export type MetricTone = "neutral" | "positive" | "negative" | "funds" | "shareholder";

export interface AccountingMetric {
  id: string;
  label: string;
  value: number;
  valueFC?: number;
  tone: MetricTone;
  hint?: string;
}

export interface CategoryPresentation {
  title: string;
  period: AccountingMetric[];
  balance: AccountingMetric[];
  fundsExplanation: string;
}

const localized = <K extends string>(keys: readonly K[], prefix: string): Record<K, string> =>
  Object.defineProperties({} as Record<K, string>, Object.fromEntries(keys.map((key) => [key, { enumerable: true, get: () => t(`${prefix}.${key}`) }])));

const CATEGORIES = ["CLOTHES", "SHOES"] as const;
export const CATEGORY_TITLES: Record<AccountingCategory, string> = localized(CATEGORIES, "accounting.categoryTitles");

// Live bindings, refreshed when the interface language changes.
export let FUNDS_LABEL = t("accounting.fundsLabel");
export let FUNDS_DEFINITION = t("accounting.fundsDefinition");
i18n.on("languageChanged", () => {
  FUNDS_LABEL = t("accounting.fundsLabel");
  FUNDS_DEFINITION = t("accounting.fundsDefinition");
});
export const FUNDS_RULE: Record<AccountingCategory, string> = localized(CATEGORIES, "accounting.fundsRule");

export function categoryPresentation(category: AccountingCategory, row: CategoryAccountingDTO): CategoryPresentation {
  const isLoss = row.netProfit < 0;
  const period: AccountingMetric[] = [
    { id: "revenue", label: t("accounting.metrics.revenue"), value: row.revenue, valueFC: row.revenueFC, tone: "neutral" },
    { id: "costOfGoodsSold", label: t("accounting.metrics.costOfGoodsSold"), value: row.costOfGoodsSold, valueFC: row.costOfGoodsSoldFC, tone: "neutral" },
    { id: "grossProfit", label: t("accounting.metrics.grossProfit"), value: row.grossProfit, valueFC: row.grossProfitFC, tone: row.grossProfit < 0 ? "negative" : "positive" },
    { id: "companyExpenses", label: t("accounting.metrics.companyExpenses"), value: row.companyExpenses, valueFC: row.companyExpensesFC, tone: "negative" },
    { id: "netProfit", label: isLoss ? t("accounting.metrics.netLoss") : t("accounting.metrics.netProfit"), value: row.netProfit, valueFC: row.netProfitFC, tone: isLoss ? "negative" : "positive" },
    { id: "goodsPurchases", label: t("accounting.metrics.goodsPurchases"), value: row.goodsPurchases, tone: "neutral" },
  ];
  if (category === "CLOTHES" && row.profitUsedForPurchases > 0) {
    period.push({ id: "profitUsedForPurchases", label: t("accounting.metrics.profitUsedForPurchases"), value: row.profitUsedForPurchases, tone: "neutral" });
  }
  if (category === "CLOTHES") {
    period.push({ id: "distributableProfit", label: t("accounting.metrics.distributableProfit"), value: row.distributableProfit, valueFC: row.distributableProfitFC, tone: "shareholder", hint: isLoss ? t("accounting.hints.noDistribution") : undefined });
  } else {
    period.push(
      { id: "distributableProfit", label: t("accounting.metrics.totalDistributableProfit"), value: row.distributableProfit, valueFC: row.distributableProfitFC, tone: "shareholder", hint: isLoss ? t("accounting.hints.noDistribution") : undefined },
      { id: "shareholder1", label: t("accounting.metrics.shareholder1"), value: row.shareholder1, valueFC: row.shareholder1FC, tone: "shareholder" },
      { id: "shareholder2", label: t("accounting.metrics.shareholder2"), value: row.shareholder2, valueFC: row.shareholder2FC, tone: "shareholder" },
    );
  }

  const current = row.balance;
  const balance: AccountingMetric[] = current ? [
    { id: "balance.recoveredCapital", label: t("accounting.metrics.recoveredCapital"), value: current.recoveredCapital, tone: "neutral", hint: t("accounting.hints.recoveredCapital") },
    { id: "balance.availablePurchaseFunds", label: FUNDS_LABEL, value: current.availablePurchaseFunds, tone: "funds", hint: FUNDS_DEFINITION },
  ] : [];
  if (current && current.fundingShortfall > 0) {
    balance.push({ id: "balance.fundingShortfall", label: t("accounting.metrics.fundingShortfall"), value: current.fundingShortfall, tone: "negative", hint: t("accounting.hints.fundingShortfall") });
  }
  return { title: CATEGORY_TITLES[category], period, balance, fundsExplanation: FUNDS_RULE[category] };
}
