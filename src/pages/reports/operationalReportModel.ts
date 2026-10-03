// Pure data side of the stock and sales reports: period ranges in business
// time, money formatting, and the exact content of every PDF (built only from
// the server payload the screen shows). No DOM, no jsPDF: the node test suite
// exercises it directly.
//
// Two different money concepts live here and must never be mixed:
// - inventory value at selling price (Fiche de stock): closing quantity x the
//   product's CURRENT selling price, a valuation of unsold stock;
// - realised sales (Fiche des ventes): revenue = purchase cost + profit =
//   actual selling amount, from each sale line's immutable snapshots.
import { currentLocale, t } from "../../i18n/index.ts";
import { formatFC, formatUSD } from "../../utils/salePricing.ts";

export type ReportPeriod = "today" | "week" | "month" | "custom";
export type ReportCategory = "ALL" | "CLOTHES" | "SHOES";

export interface ShopIdentity { shopName: string; shopAddress?: string; shopNumber?: string; shopRegistration?: string }
export interface Money { usd: number | null; fc: number | null }
export interface SellingPrice extends Money { currency: "USD" | "FC" }
export interface ReportPeriodRange { start: string; end: string }

export interface StockSheetRow {
  productId: string; product: string; category: string; unit: string; status?: string;
  openingStock: number | null; additions: number; reductions: number; salesOut: number;
  closingStock: number | null; trackingComplete: boolean;
  sellingPrice: SellingPrice | null; inventoryValue: Money | null;
}
export interface StockSheetTotals {
  openingStock: number; additions: number; reductions: number; salesOut: number; closingStock: number;
  inventoryValue: Money;
}
export interface StockSheetPayload { category: string; period: ReportPeriodRange; rows: StockSheetRow[]; totals: StockSheetTotals; complete: boolean }

export interface ProductStockSheetPayload {
  period: ReportPeriodRange;
  product: {
    productId: string; name: string; category: string; subcategory?: string; brand?: string;
    unit: string; status: string; currentStock: number; sellingPrice: SellingPrice | null;
  };
  row: StockSheetRow | null;
}

/** One price a product was actually sold at, and the pieces that left at it. */
export interface SoldPrice { currency: "USD" | "FC"; unitPrice: Money; quantity: number; revenue: Money }
export interface SalesSheetRow {
  productId: string; product: string; category: string; unit: string;
  prices: SoldPrice[];
  quantitySold: number; revenue: Money; purchaseCost?: Money; profit?: Money;
}
export interface SalesSheetSummary { skusSold: number; unitsSold: number; revenue: Money; purchaseCost?: Money; profit?: Money }
export interface SalesSheetPayload {
  category: string; period: ReportPeriodRange; rows: SalesSheetRow[]; summary: SalesSheetSummary; financialsVisible: boolean;
}

/* PDF text */
/** jsPDF's built-in Helvetica is not Unicode: write plain ASCII. */
export function pdfText(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e]/g, "");
}

export const COMPANY_NAME = "ETS DOUBLE M CLASSIC BOUTIQUE";
export const BUSINESS_TIME_ZONE = "Africa/Lubumbashi";

/** YYYY-MM-DD of an instant in business time (UTC+2). */
export function businessDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Inclusive business-day range of a period; weeks start on Monday. */
export function reportRange(period: ReportPeriod, customFrom: string, customTo: string, now = new Date()): { from: string; to: string } {
  const today = businessDay(now);
  if (period === "today") return { from: today, to: today };
  if (period === "week") {
    const noon = new Date(`${today}T12:00:00Z`);
    const weekday = noon.getUTCDay() || 7;
    noon.setUTCDate(noon.getUTCDate() - weekday + 1);
    return { from: noon.toISOString().slice(0, 10), to: today };
  }
  if (period === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  return { from: customFrom, to: customTo };
}

export function isValidRange(range: { from: string; to: string }): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(range.from) && /^\d{4}-\d{2}-\d{2}$/.test(range.to) && range.from <= range.to;
}

export function categoryLabel(category: string): string {
  return category === "CLOTHES" || category === "SHOES"
    ? t(`accounting.categoryTitles.${category}`)
    : t("operationalReports.allCategories");
}

export function formatQuantity(value: number | null | undefined): string {
  return typeof value === "number" ? new Intl.NumberFormat(currentLocale()).format(value) : "—";
}

/** Sales out is net of voids/corrections, so it can be negative. */
export function formatSignedChange(value: number, sign: "+" | "-"): string {
  if (!value) return "0";
  const magnitude = formatQuantity(Math.abs(value));
  const effective = value < 0 ? (sign === "+" ? "-" : "+") : sign;
  return `${effective}${magnitude}`;
}

/** FC first (the till currency), USD equivalent second; "—" when unknown. */
export function formatMoney(money: Money | null | undefined): { primary: string; secondary: string | null } {
  if (!money || (money.fc === null && money.usd === null)) return { primary: "—", secondary: null };
  if (money.fc === null) return { primary: formatUSD(money.usd), secondary: null };
  return { primary: formatFC(money.fc), secondary: money.usd === null ? null : formatUSD(money.usd) };
}

/** One PDF cell: FC on the first line, USD on the second. */
export function moneyCell(money: Money | null | undefined): string {
  const { primary, secondary } = formatMoney(money);
  return secondary ? `${primary}\n${secondary}` : primary;
}

/** The selling price in its authoritative currency first. */
export function sellingPriceCell(price: SellingPrice | null | undefined): string {
  if (!price) return "—";
  if (price.currency === "USD" && price.usd !== null) return price.fc === null ? formatUSD(price.usd) : `${formatUSD(price.usd)}\n${formatFC(price.fc)}`;
  return moneyCell(price);
}

/** "20 000 FC × 2" — a sold unit price in the currency it was sold in. */
export function soldPriceLine(price: SoldPrice, unit: string): string {
  const amount = price.currency === "FC" ? formatFC(price.unitPrice.fc) : formatUSD(price.unitPrice.usd);
  return `${amount} × ${formatQuantity(price.quantity)} ${unit}`;
}

export interface PdfTableModel {
  title: string;
  fileName: string;
  shop: ShopIdentity;
  meta: Array<{ label: string; value: string }>;
  summary: Array<{ label: string; value: string }>;
  headers: string[];
  /** Relative column weights; the renderer scales them to the page width. */
  weights: number[];
  numeric: boolean[];
  body: string[][];
  totals?: string[];
  empty: string;
  notes: string[];
}

interface ModelInput {
  shop: ShopIdentity;
  periodLabel: string;
  generatedAt: string;
  range: { from: string; to: string };
}

function slug(value: string): string {
  return value.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "produit";
}

function fileName(base: string, scope: string, range: { from: string; to: string }): string {
  return `${base}_${slug(scope)}_${range.from}_${range.to}.pdf`;
}

const generatedMeta = (input: ModelInput) => ({ label: t("operationalReports.generatedAt"), value: input.generatedAt });

/** Global Fiche de stock: every authorised product for the period. */
export function stockSheetPdfModel(data: StockSheetPayload, input: ModelInput): PdfTableModel {
  const totals = data.totals;
  return {
    title: t("operationalReports.stock.pdfTitle"),
    fileName: fileName("fiche-de-stock", data.category, input.range),
    shop: input.shop,
    meta: [
      { label: t("operationalReports.period"), value: input.periodLabel },
      { label: t("operationalReports.category"), value: categoryLabel(data.category) },
      generatedMeta(input),
    ],
    summary: [
      { label: t("operationalReports.products"), value: formatQuantity(data.rows.length) },
      { label: t("operationalReports.opening"), value: formatQuantity(totals.openingStock) },
      { label: t("operationalReports.additions"), value: formatSignedChange(totals.additions, "+") },
      { label: t("operationalReports.reductions"), value: formatSignedChange(totals.reductions, "-") },
      { label: t("operationalReports.salesOut"), value: formatSignedChange(totals.salesOut, "-") },
      { label: t("operationalReports.closing"), value: formatQuantity(totals.closingStock) },
      { label: t("operationalReports.inventoryValue"), value: formatMoney(totals.inventoryValue).primary },
    ],
    headers: [
      t("operationalReports.product"), t("operationalReports.category"), t("operationalReports.unit"),
      t("operationalReports.opening"), t("operationalReports.additions"), t("operationalReports.reductions"),
      t("operationalReports.salesOut"), t("operationalReports.closing"),
      t("operationalReports.sellingPrice"), t("operationalReports.inventoryValue"),
    ],
    weights: [56, 24, 14, 18, 18, 18, 18, 18, 28, 32],
    numeric: [false, false, false, true, true, true, true, true, true, true],
    body: data.rows.map((row) => [
      row.status === "deleted" ? `${row.product} (${t("operationalReports.deleted")})` : row.product,
      categoryLabel(row.category),
      row.unit,
      formatQuantity(row.openingStock),
      formatSignedChange(row.additions, "+"),
      formatSignedChange(row.reductions, "-"),
      formatSignedChange(row.salesOut, "-"),
      formatQuantity(row.closingStock),
      sellingPriceCell(row.sellingPrice),
      moneyCell(row.inventoryValue),
    ]),
    totals: [
      t("operationalReports.total"), "", "",
      formatQuantity(totals.openingStock), formatSignedChange(totals.additions, "+"),
      formatSignedChange(totals.reductions, "-"), formatSignedChange(totals.salesOut, "-"),
      formatQuantity(totals.closingStock), "", moneyCell(totals.inventoryValue),
    ],
    empty: t("operationalReports.noData"),
    notes: [
      t("operationalReports.stock.formula"),
      t("operationalReports.inventoryValueHint"),
      ...(data.complete ? [] : [t("operationalReports.incompleteHistory")]),
    ],
  };
}

/** Individual Fiche de stock: ONE product for the selected period. */
export function productStockSheetPdfModel(data: ProductStockSheetPayload, input: ModelInput): PdfTableModel {
  const { product, row } = data;
  const lines: Array<[string, string]> = row ? [
    [t("operationalReports.opening"), formatQuantity(row.openingStock)],
    [t("operationalReports.additions"), formatSignedChange(row.additions, "+")],
    [t("operationalReports.reductions"), formatSignedChange(row.reductions, "-")],
    [t("operationalReports.salesOut"), formatSignedChange(row.salesOut, "-")],
    [t("operationalReports.closing"), formatQuantity(row.closingStock)],
    [t("operationalReports.sellingPrice"), sellingPriceCell(row.sellingPrice ?? product.sellingPrice)],
    [t("operationalReports.inventoryValue"), moneyCell(row.inventoryValue)],
  ] : [];
  return {
    title: t("operationalReports.stock.pdfTitle"),
    fileName: fileName("fiche-de-stock", product.name, input.range),
    shop: input.shop,
    meta: [
      { label: t("operationalReports.product"), value: product.name },
      { label: t("operationalReports.category"), value: categoryLabel(product.category) },
      { label: t("operationalReports.unit"), value: product.unit },
      { label: t("operationalReports.period"), value: input.periodLabel },
      generatedMeta(input),
    ],
    summary: row ? [
      { label: t("operationalReports.opening"), value: formatQuantity(row.openingStock) },
      { label: t("operationalReports.closing"), value: formatQuantity(row.closingStock) },
      { label: t("operationalReports.inventoryValue"), value: formatMoney(row.inventoryValue).primary },
    ] : [],
    headers: [t("operationalReports.item"), t("operationalReports.value")],
    weights: [60, 40],
    numeric: [false, true],
    body: lines.map(([label, value]) => [label, value]),
    empty: t("operationalReports.productNotExisting"),
    notes: [
      t("operationalReports.stock.formula"),
      t("operationalReports.inventoryValueHint"),
      ...(row && !row.trackingComplete ? [t("operationalReports.incompleteHistory")] : []),
    ],
  };
}

/** Fiche des ventes: realised sales; cost and profit only when visible. */
export function salesSheetPdfModel(data: SalesSheetPayload, input: ModelInput): PdfTableModel {
  const summary = data.summary;
  const financial = data.financialsVisible;
  return {
    title: t("operationalReports.sales.pdfTitle"),
    fileName: fileName("fiche-des-ventes", data.category, input.range),
    shop: input.shop,
    meta: [
      { label: t("operationalReports.period"), value: input.periodLabel },
      { label: t("operationalReports.category"), value: categoryLabel(data.category) },
      generatedMeta(input),
    ],
    summary: [
      { label: t("operationalReports.skus"), value: formatQuantity(summary.skusSold) },
      { label: t("operationalReports.totalUnits"), value: formatQuantity(summary.unitsSold) },
      { label: t("operationalReports.revenue"), value: formatMoney(summary.revenue).primary },
      ...(financial ? [
        { label: t("operationalReports.purchaseCost"), value: formatMoney(summary.purchaseCost).primary },
        { label: t("operationalReports.profit"), value: formatMoney(summary.profit).primary },
      ] : []),
    ],
    headers: [
      t("operationalReports.product"), t("operationalReports.category"), t("operationalReports.soldAt"), t("operationalReports.quantitySold"),
      t("operationalReports.revenue"),
      ...(financial ? [t("operationalReports.purchaseCost"), t("operationalReports.profit")] : []),
    ],
    weights: financial ? [58, 24, 46, 22, 32, 32, 32] : [80, 30, 56, 26, 40],
    numeric: financial ? [false, false, false, true, true, true, true] : [false, false, false, true, true],
    body: data.rows.map((row) => [
      row.product, categoryLabel(row.category),
      row.prices.map((price) => soldPriceLine(price, row.unit)).join("\n"),
      `${formatQuantity(row.quantitySold)} ${row.unit}`,
      moneyCell(row.revenue),
      ...(financial ? [moneyCell(row.purchaseCost), moneyCell(row.profit)] : []),
    ]),
    totals: [
      t("operationalReports.total"), "", "", formatQuantity(summary.unitsSold),
      moneyCell(summary.revenue),
      ...(financial ? [moneyCell(summary.purchaseCost), moneyCell(summary.profit)] : []),
    ],
    empty: t("operationalReports.noData"),
    notes: [
      t("operationalReports.sales.revenueRule"),
      t("operationalReports.sales.recognition"),
      ...(financial ? [t("operationalReports.financialFormula")] : []),
    ],
  };
}
