// Shared by the Analytics screen and the PDF report so both show the same
// authoritative backend numbers under the same labels. This module only
// selects and labels fields; it never recalculates accounting values.

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

export const CATEGORY_TITLES: Record<AccountingCategory, string> = {
  CLOTHES: "Vêtements",
  SHOES: "Chaussures",
};

export const FUNDS_LABEL = "Fonds disponibles pour réapprovisionnement";
export const FUNDS_DEFINITION =
  "Montant récupéré sur le coût d'achat des articles vendus et encore disponible pour acheter de nouvelles marchandises.";
export const FUNDS_RULE: Record<AccountingCategory, string> = {
  CLOTHES: "Pour les vêtements, le réapprovisionnement peut utiliser le capital récupéré ainsi que le bénéfice disponible.",
  SHOES: "Pour les chaussures, seul le capital récupéré peut financer le réapprovisionnement. Le bénéfice des actionnaires reste séparé.",
};

export function categoryPresentation(category: AccountingCategory, row: CategoryAccountingDTO): CategoryPresentation {
  const isLoss = row.netProfit < 0;
  const period: AccountingMetric[] = [
    { id: "revenue", label: "Chiffre d'affaires", value: row.revenue, valueFC: row.revenueFC, tone: "neutral" },
    { id: "costOfGoodsSold", label: "Coût des articles vendus", value: row.costOfGoodsSold, valueFC: row.costOfGoodsSoldFC, tone: "neutral" },
    { id: "grossProfit", label: "Bénéfice brut", value: row.grossProfit, valueFC: row.grossProfitFC, tone: row.grossProfit < 0 ? "negative" : "positive" },
    { id: "companyExpenses", label: "Dépenses de l'entreprise", value: row.companyExpenses, valueFC: row.companyExpensesFC, tone: "negative" },
    { id: "netProfit", label: isLoss ? "Résultat net (perte)" : "Résultat net", value: row.netProfit, valueFC: row.netProfitFC, tone: isLoss ? "negative" : "positive" },
    { id: "goodsPurchases", label: "Achats de marchandises", value: row.goodsPurchases, tone: "neutral" },
  ];
  if (category === "CLOTHES" && row.profitUsedForPurchases > 0) {
    period.push({ id: "profitUsedForPurchases", label: "Bénéfice utilisé pour réapprovisionnement", value: row.profitUsedForPurchases, tone: "neutral" });
  }
  if (category === "CLOTHES") {
    period.push({ id: "distributableProfit", label: "Bénéfice distribuable", value: row.distributableProfit, valueFC: row.distributableProfitFC, tone: "shareholder", hint: isLoss ? "Aucune distribution : la période est en perte" : undefined });
  } else {
    period.push(
      { id: "distributableProfit", label: "Bénéfice total distribuable", value: row.distributableProfit, valueFC: row.distributableProfitFC, tone: "shareholder", hint: isLoss ? "Aucune distribution : la période est en perte" : undefined },
      { id: "shareholder1", label: "Part actionnaire 1", value: row.shareholder1, valueFC: row.shareholder1FC, tone: "shareholder" },
      { id: "shareholder2", label: "Part actionnaire 2", value: row.shareholder2, valueFC: row.shareholder2FC, tone: "shareholder" },
    );
  }

  const current = row.balance;
  const balance: AccountingMetric[] = current ? [
    { id: "balance.recoveredCapital", label: "Capital récupéré (cumul)", value: current.recoveredCapital, tone: "neutral", hint: "Coût d'achat des articles vendus depuis le début" },
    { id: "balance.availablePurchaseFunds", label: FUNDS_LABEL, value: current.availablePurchaseFunds, tone: "funds", hint: FUNDS_DEFINITION },
  ] : [];
  if (current && current.fundingShortfall > 0) {
    balance.push({ id: "balance.fundingShortfall", label: "Capital à reconstituer", value: current.fundingShortfall, tone: "negative", hint: "Achats déjà effectués au-delà du capital encore disponible (vente annulée ou perte)" });
  }
  return { title: CATEGORY_TITLES[category], period, balance, fundsExplanation: FUNDS_RULE[category] };
}
