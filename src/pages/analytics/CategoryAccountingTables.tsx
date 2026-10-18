// CLOTHES / SHOES accounting as responsive tables on the Reports page.
// Every amount is a field of the server's category DTO
// (financialAccountingService.buildCategoryReport). The only arithmetic here
// is presentation: the Total column adds the two categories in integer cents
// (exactly like the server's own totals) and margins divide two shown values.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

import { formatFC, formatUSD } from "../../utils/salePricing";
import { currentLocale } from "../../i18n";
import { categoryPresentation, type AccountingCategory, type CategoryAccountingDTO } from "./accountingPresentation";
import "./financialReports.css";

export interface InventoryValuationDTO {
  products: number;
  unitsInStock: number;
  acquisitionValue: number;
  retailValue: number;
}

export interface CategoryReportDTO extends CategoryAccountingDTO {
  capitalUsedForPurchases?: number;
  lossCoveredByCapital?: number;
  generatedPurchaseFunds?: number;
  goodsPurchasesFC?: number;
  profitUsedForPurchasesFC?: number;
  activity?: { saleLines: number; unitsSold: number; companyExpenseTransactions: number; goodsPurchaseTransactions: number; reversals: number };
  integrity?: { grossProfitSnapshotMismatches: number };
}

function CategoryDecisionTable({ category, row, view }: {
  category: AccountingCategory;
  row: CategoryReportDTO;
  view: ReturnType<typeof categoryPresentation>;
}) {
  const { t } = useTranslation();
  const metric = (id: string) => view.period.find((item) => item.id === id);
  const current = row.balance;
  const lines = [
    { id: "revenue", label: t("financialReports.overview.revenue"), value: metric("revenue")?.value, tone: "" },
    { id: "grossProfit", label: t("financialReports.overview.grossProfit"), value: metric("grossProfit")?.value, tone: "is-positive" },
    { id: "companyExpenses", label: t("financialReports.overview.expenses"), value: metric("companyExpenses")?.value, tone: "" },
    { id: "netProfit", label: t("financialReports.overview.netProfit"), value: metric("netProfit")?.value, tone: Number(metric("netProfit")?.value || 0) < 0 ? "is-negative" : "is-positive" },
    { id: "purchaseFunds", label: t("financialReports.overview.purchaseFunds"), value: current?.availablePurchaseFunds, tone: "is-funds" },
  ];
  const shareholderLines = category === "CLOTHES"
    ? [{ id: "owner", label: t("financialReports.overview.clothesOwner"), value: current?.shareholder1 }]
    : [
        { id: "shoeOwner1", label: t("financialReports.overview.shoeOwner1"), value: current?.shareholder1 },
        { id: "shoeOwner2", label: t("financialReports.overview.shoeOwner2"), value: current?.shareholder2 },
      ];

  return (
    <article className={`fin-decision-card is-${category.toLowerCase()}`}>
      <header className="fin-decision-header">
        <div>
          <p className="fin-decision-eyebrow">{t("financialReports.overview.businessUnit")}</p>
          <h3 id={`decision-${category}`}>{view.title}</h3>
        </div>
        <span>{category === "CLOTHES" ? "100%" : "50 / 50"}</span>
      </header>
      <p className="fin-decision-rule">{view.fundsExplanation}</p>
      <div className="fin-decision-scroll" role="region" aria-labelledby={`decision-${category}`} tabIndex={0}>
        <table className="fin-decision-table">
          <caption className="sr-only">{view.title}</caption>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className={line.id === "purchaseFunds" ? "is-key-decision" : undefined}>
                <th scope="row">{line.label}</th>
                <td className={line.tone}>{formatUSD(line.value)}</td>
              </tr>
            ))}
            <tr className="fin-decision-section"><th colSpan={2}>{t("financialReports.overview.shareholderPayout")}</th></tr>
            {shareholderLines.map((line) => (
              <tr key={line.id} className="is-shareholder">
                <th scope="row">{line.label}</th>
                <td>{formatUSD(line.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fin-decision-caption">
        {category === "CLOTHES" ? t("financialReports.overview.clothesRule") : t("financialReports.overview.shoesRule")}
      </p>
    </article>
  );
}

type Currency = "USD" | "FC";
type Kind = "money" | "percent" | "count";
type Tone = "plain" | "signed" | "strong" | "funds" | "danger";

interface RowDef<T> {
  id: string;
  label: string;
  /** USD (or the count / percent). null = not applicable for that column. */
  value: (row: T, category: AccountingCategory | "TOTAL") => number | null | undefined;
  /** Informational FC figure when one exists. */
  fc?: (row: T) => number | undefined;
  kind?: Kind;
  tone?: Tone;
  /** How the Total column is filled: summed, a ratio of totals, or none. */
  total?: "sum" | ((totals: Record<string, number>) => number | null) | false;
  note?: (category: AccountingCategory) => string | undefined;
  section?: string;
}

const CATEGORY_ORDER: AccountingCategory[] = ["CLOTHES", "SHOES"];
const cents = (value: number | null | undefined) => Math.round(Number(value || 0) * 100);
const ratio = (part: number | null | undefined, whole: number | null | undefined) =>
  whole && whole > 0 ? (Number(part || 0) / whole) * 100 : null;

function formatValue(value: number | null | undefined, kind: Kind, currency: Currency | "USD-only"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (kind === "percent") return `${new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)} %`;
  if (kind === "count") return new Intl.NumberFormat(currentLocale()).format(value);
  return currency === "FC" ? formatFC(value) : formatUSD(value);
}

function toneClass(tone: Tone | undefined, value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (tone === "danger") return value > 0 ? "is-negative" : "";
  if (tone === "signed") return value < 0 ? "is-negative" : value > 0 ? "is-positive" : "";
  if (tone === "funds") return "is-funds";
  if (tone === "strong") return value < 0 ? "is-negative is-strong" : "is-strong";
  return value < 0 ? "is-negative" : "";
}

function FinancialTable<T>({ caption, hint, columns, rows, data, currency, totalsEnabled, labelledBy }: {
  caption: string;
  hint?: string;
  columns: AccountingCategory[];
  rows: RowDef<T>[];
  data: Partial<Record<AccountingCategory, T>>;
  currency: Currency | "USD-only";
  totalsEnabled: boolean;
  labelledBy?: string;
}) {
  const { t } = useTranslation();
  const titles = columns.map((category) => t(`accounting.categoryTitles.${category}`));
  const showTotal = totalsEnabled && columns.length > 1;
  const columnCount = columns.length + (showTotal ? 1 : 0);

  const cellFor = (row: RowDef<T>, category: AccountingCategory) => {
    const source = data[category];
    if (!source) return { text: "—", value: null as number | null, fcUsed: false };
    const kind = row.kind ?? "money";
    const fcValue = currency === "FC" && kind === "money" ? row.fc?.(source) : undefined;
    const value = row.value(source, category);
    if (fcValue !== undefined && value !== null) return { text: formatValue(fcValue, kind, "FC"), value: fcValue, fcUsed: true };
    return { text: formatValue(value, kind, "USD-only"), value: value ?? null, fcUsed: false };
  };

  const totalFor = (row: RowDef<T>) => {
    if (!showTotal || row.total === false || row.total === undefined) return { text: "—", value: null as number | null };
    const kind = row.kind ?? "money";
    const useFC = currency === "FC" && kind === "money" && row.fc !== undefined;
    if (row.total === "sum") {
      let sum = 0;
      for (const category of columns) {
        const source = data[category];
        if (!source) continue;
        const raw = useFC ? row.fc!(source) : row.value(source, category);
        if (raw === null || raw === undefined) return { text: "—", value: null };
        sum += kind === "money" ? cents(raw) : Number(raw);
      }
      const value = kind === "money" ? sum / 100 : sum;
      return { text: formatValue(value, kind, useFC ? "FC" : "USD-only"), value };
    }
    const totals: Record<string, number> = {};
    for (const definition of rows) {
      if (definition.total !== "sum") continue;
      let sum = 0;
      for (const category of columns) {
        const source = data[category];
        if (source) sum += cents(definition.value(source, category));
      }
      totals[definition.id] = sum / 100;
    }
    const value = row.total(totals);
    return { text: formatValue(value, kind, "USD-only"), value };
  };

  let currentSection: string | undefined;
  return (
    <div className="fin-table-block">
      <div className="fin-table-heading">
        <h3 id={labelledBy}>{caption}</h3>
        {hint && <p>{hint}</p>}
      </div>
      <div className="fin-table-scroll" role="region" aria-labelledby={labelledBy} tabIndex={0}>
        <table className="fin-table" style={{ ["--fin-columns" as string]: columns.length }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{t("financialReports.tables.indicator")}</th>
              {titles.map((title) => <th key={title} scope="col" className="text-right">{title}</th>)}
              {showTotal && <th scope="col" className="text-right">{t("financialReports.tables.total")}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row) => {
              const out = [];
              if (row.section && row.section !== currentSection) {
                currentSection = row.section;
                out.push(
                  <tr key={`section-${row.section}`} className="fin-section-row">
                    <th scope="rowgroup" colSpan={columnCount + 1}>{row.section}</th>
                  </tr>,
                );
              }
              const total = totalFor(row);
              out.push(
                <tr key={row.id} className={row.tone === "strong" || row.tone === "funds" ? "is-emphasis" : undefined}>
                  <th scope="row">{row.label}</th>
                  {columns.map((category, index) => {
                    const cell = cellFor(row, category);
                    const note = row.note?.(category);
                    return (
                      <td key={category} data-label={titles[index]} className={`text-right ${toneClass(row.tone, cell.value)}`}>
                        <span className="fin-value">{cell.text}</span>
                        {note && <span className="fin-note">{note}</span>}
                      </td>
                    );
                  })}
                  {showTotal && (
                    <td data-label={t("financialReports.tables.total")} className={`text-right fin-total ${toneClass(row.tone, total.value)}`}>
                      <span className="fin-value">{total.text}</span>
                    </td>
                  )}
                </tr>,
              );
              return out;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CategoryAccountingTables({ breakdown, inventory, periodLabel }: {
  breakdown?: Partial<Record<AccountingCategory, CategoryReportDTO>>;
  inventory?: Partial<Record<AccountingCategory, InventoryValuationDTO>>;
  periodLabel: string;
}) {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [showDetails, setShowDetails] = useState(false);
  const columns = CATEGORY_ORDER.filter((category) => breakdown?.[category]);
  if (!breakdown || columns.length === 0) return null;

  const r = (key: string) => t(`financialReports.rows.${key}`);
  // The same mapping as the PDF report: shared figures are read from it, so
  // the screen and the document always show the same numbers.
  const views = Object.fromEntries(columns.map((category) => [category, categoryPresentation(category, breakdown[category]!)]));
  const metricOf = (category: AccountingCategory | "TOTAL", id: string) =>
    category === "TOTAL" ? undefined : views[category]?.period.find((metric) => metric.id === id);
  const shared = (id: string, fallback: (c: CategoryReportDTO) => number | null | undefined) => ({
    value: (c: CategoryReportDTO, category: AccountingCategory | "TOTAL") => metricOf(category, id)?.value ?? fallback(c),
  });
  const m = (key: string) => t(`accounting.metrics.${key}`);
  const sections = {
    results: t("financialReports.sections.results"),
    purchases: t("financialReports.sections.purchases"),
    distribution: t("financialReports.sections.distribution"),
    activity: t("financialReports.sections.activity"),
  };
  const shareNote = (category: AccountingCategory, second = false) =>
    category === "CLOTHES" ? (second ? undefined : t("financialReports.notes.clothesOwner")) : t("financialReports.notes.shoesHalf");

  const periodRows: RowDef<CategoryReportDTO>[] = [
    { id: "revenue", section: sections.results, label: m("revenue"), ...shared("revenue", (c) => c.revenue), fc: (c) => c.revenueFC, total: "sum" },
    { id: "costOfGoodsSold", label: m("costOfGoodsSold"), ...shared("costOfGoodsSold", (c) => c.costOfGoodsSold), fc: (c) => c.costOfGoodsSoldFC, total: "sum" },
    { id: "grossProfit", label: m("grossProfit"), ...shared("grossProfit", (c) => c.grossProfit), fc: (c) => c.grossProfitFC, tone: "strong", total: "sum" },
    { id: "grossMargin", label: r("grossMargin"), kind: "percent", value: (c) => ratio(c.grossProfit, c.revenue), total: (x) => ratio(x.grossProfit, x.revenue) },
    { id: "companyExpenses", label: m("companyExpenses"), ...shared("companyExpenses", (c) => c.companyExpenses), fc: (c) => c.companyExpensesFC, total: "sum" },
    { id: "netProfit", label: m("netProfit"), ...shared("netProfit", (c) => c.netProfit), fc: (c) => c.netProfitFC, tone: "strong", total: "sum" },
    { id: "netMargin", label: r("netMargin"), kind: "percent", value: (c) => ratio(c.netProfit, c.revenue), total: (x) => ratio(x.netProfit, x.revenue) },
    { id: "goodsPurchases", section: sections.purchases, label: m("goodsPurchases"), ...shared("goodsPurchases", (c) => c.goodsPurchases), fc: (c) => c.goodsPurchasesFC, total: "sum" },
    { id: "capitalUsedForPurchases", label: r("capitalUsedForPurchases"), value: (c) => c.capitalUsedForPurchases ?? null, total: "sum" },
    { id: "profitUsedForPurchases", label: r("profitUsedForPurchases"), value: (c, category) => (category === "SHOES" ? null : metricOf(category, "profitUsedForPurchases")?.value ?? c.profitUsedForPurchases), fc: (c) => c.profitUsedForPurchasesFC, total: false, note: (category) => (category === "SHOES" ? t("financialReports.notes.shoesNoProfitPurchases") : undefined) },
    { id: "distributableProfit", section: sections.distribution, label: m("distributableProfit"), ...shared("distributableProfit", (c) => c.distributableProfit), fc: (c) => c.distributableProfitFC, tone: "strong", total: "sum" },
    { id: "shareholder1", label: m("shareholder1"), value: (c, category) => (category === "CLOTHES" ? metricOf(category, "distributableProfit")?.value ?? c.shareholder1 : metricOf(category, "shareholder1")?.value ?? c.shareholder1), fc: (c) => c.shareholder1FC, total: false, note: (category) => shareNote(category) },
    { id: "shareholder2", label: m("shareholder2"), value: (c, category) => (category === "CLOTHES" ? null : metricOf(category, "shareholder2")?.value ?? c.shareholder2), fc: (c) => c.shareholder2FC, total: false, note: (category) => shareNote(category, true) },
    { id: "unitsSold", section: sections.activity, label: r("unitsSold"), kind: "count", value: (c) => c.activity?.unitsSold ?? null, total: "sum" },
    { id: "saleLines", label: r("saleLines"), kind: "count", value: (c) => c.activity?.saleLines ?? null, total: "sum" },
    { id: "expenseTransactions", label: r("expenseTransactions"), kind: "count", value: (c) => c.activity ? c.activity.companyExpenseTransactions + c.activity.goodsPurchaseTransactions : null, total: "sum" },
    { id: "reversals", label: r("reversals"), kind: "count", value: (c) => c.activity?.reversals ?? null, total: "sum" },
  ];

  const balances = Object.fromEntries(columns.map((category) => [category, breakdown[category]?.balance])) as Partial<Record<AccountingCategory, NonNullable<CategoryReportDTO["balance"]>>>;
  const hasBalance = columns.some((category) => balances[category]);
  const asOf = columns.map((category) => balances[category]?.asOf).find(Boolean);
  const positionRows: RowDef<NonNullable<CategoryReportDTO["balance"]>>[] = [
    { id: "recoveredCapital", label: r("recoveredCapital"), value: (b) => b.recoveredCapital, total: "sum" },
    { id: "lossCoveredByCapital", label: r("lossCoveredByCapital"), value: (b) => b.lossCoveredByCapital, tone: "danger", total: "sum" },
    { id: "netProfitCumulative", label: r("netResultCumulative"), value: (b) => b.netProfit, tone: "signed", total: "sum" },
    { id: "generatedPurchaseFunds", label: r("generatedPurchaseFunds"), value: (b) => b.generatedPurchaseFunds, total: "sum" },
    { id: "goodsPurchasesCumulative", label: r("goodsPurchasesCumulative"), value: (b) => b.goodsPurchases, total: "sum" },
    { id: "availablePurchaseFunds", label: r("availablePurchaseFunds"), value: (b) => b.availablePurchaseFunds, tone: "funds", total: "sum" },
    { id: "remainingRecoveredCapital", label: r("remainingRecoveredCapital"), value: (b) => b.remainingRecoveredCapital, total: "sum" },
    { id: "availableDistributableProfit", label: r("availableDistributableProfit"), value: (b) => b.distributableProfit, total: "sum" },
    { id: "fundingShortfall", label: r("fundingShortfall"), value: (b) => b.fundingShortfall, tone: "danger", total: "sum" },
  ];

  const hasInventory = columns.some((category) => inventory?.[category]);
  const stockRows: RowDef<InventoryValuationDTO>[] = [
    { id: "products", label: r("activeProducts"), kind: "count", value: (s) => s.products, total: "sum" },
    { id: "unitsInStock", label: r("unitsInStock"), kind: "count", value: (s) => s.unitsInStock, total: "sum" },
    { id: "acquisitionValue", label: r("acquisitionValue"), value: (s) => s.acquisitionValue, total: "sum" },
    { id: "retailValue", label: r("retailValue"), value: (s) => s.retailValue, total: "sum" },
    { id: "potentialMargin", label: r("potentialMargin"), value: (s) => (cents(s.retailValue) - cents(s.acquisitionValue)) / 100, tone: "strong", total: "sum" },
  ];

  const mismatches = columns.reduce((sum, category) => sum + (breakdown[category]?.integrity?.grossProfitSnapshotMismatches || 0), 0);
  const asOfLabel = asOf ? new Date(asOf).toLocaleString(currentLocale(), { timeZone: "Africa/Lubumbashi", dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <section className="fin-tables analytics-card bg-white rounded-lg border border-gray-200" aria-labelledby="fin-tables-title">
      <header className="fin-tables-header">
        <div>
          <h2 id="fin-tables-title" className="text-lg font-semibold text-gray-900">{t("financialReports.tables.title")}</h2>
          <p>{t("financialReports.tables.subtitle", { period: periodLabel })}</p>
        </div>
        <button
          type="button"
          className="fin-details-button"
          aria-expanded={showDetails}
          aria-controls="fin-accounting-details"
          onClick={() => setShowDetails((visible) => !visible)}
        >
          {showDetails ? t("financialReports.overview.hideDetails") : t("financialReports.overview.showDetails")}
          {showDetails ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
      </header>

      {mismatches > 0 && (
        <p className="fin-warning" role="status">
          <AlertTriangle aria-hidden="true" />
          {t("financialReports.tables.integrityWarning", { count: mismatches })}
        </p>
      )}

      <p className="fin-overview-intro">{t("financialReports.overview.hint")}</p>
      <div className={`fin-decision-grid ${columns.length === 1 ? "is-single" : ""}`}>
        {columns.map((category) => (
          <CategoryDecisionTable key={category} category={category} row={breakdown[category]!} view={views[category]!} />
        ))}
      </div>

      {showDetails && (
        <div id="fin-accounting-details" className="fin-accounting-details">
          <div className="fin-detail-toolbar">
            <div>
              <h3>{t("financialReports.overview.detailsTitle")}</h3>
              <p>{t("financialReports.overview.detailsHint")}</p>
            </div>
            <div className="fin-segmented" role="group" aria-label={t("financialReports.tables.currency")}>
              {(["USD", "FC"] as const).map((option) => (
                <button key={option} type="button" aria-pressed={currency === option} className={currency === option ? "is-active" : undefined} onClick={() => setCurrency(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <FinancialTable
            caption={t("financialReports.tables.periodTitle")}
            hint={currency === "FC" ? t("financialReports.tables.periodHintFC") : t("financialReports.tables.periodHint")}
            labelledBy="fin-period-title"
            columns={columns}
            rows={periodRows}
            data={breakdown}
            currency={currency}
            totalsEnabled
          />

          {hasBalance && (
            <FinancialTable
              caption={t("financialReports.tables.positionTitle")}
              hint={t("financialReports.tables.positionHint", { date: asOfLabel })}
              labelledBy="fin-position-title"
              columns={columns}
              rows={positionRows}
              data={balances}
              currency="USD-only"
              totalsEnabled
            />
          )}

          {hasInventory && inventory && (
            <FinancialTable
              caption={t("financialReports.tables.stockTitle")}
              hint={t("financialReports.tables.stockHint")}
              labelledBy="fin-stock-title"
              columns={columns}
              rows={stockRows}
              data={inventory}
              currency="USD-only"
              totalsEnabled
            />
          )}

          <ul className="fin-footnotes">
            {columns.map((category) => <li key={category}>{t(`accounting.fundsRule.${category}`)}</li>)}
            <li>{t("financialReports.notes.recognition")}</li>
          </ul>
        </div>
      )}
    </section>
  );
}
