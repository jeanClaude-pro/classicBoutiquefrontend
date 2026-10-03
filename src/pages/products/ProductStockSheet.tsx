// Fiche de stock of ONE product (Products → Actions → Fiche de stock). A
// summary for the selected period, never a movement ledger: the server
// derives every figure from the stock ledger for this product only.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { serverUrl } from "../../utils/constants";
import { formatNowGMT2 } from "../../utils/dateUtils";
import { requestJson, toApiError } from "../../lib/apiError";
import { formatFC, formatUSD } from "../../utils/salePricing";
import { downloadOperationalReportPdf } from "../reports/operationalReportPdf";
import {
  categoryLabel,
  formatQuantity,
  formatSignedChange,
  productStockSheetPdfModel,
  type Money,
  type ProductStockSheetPayload,
  type SellingPrice,
} from "../reports/operationalReportModel";
import { ReportFilterFields, SummaryCard } from "../reports/reportControls";
import { periodLabelOf, useReportFilters, useShopIdentity } from "../reports/reportFilters";

/** A price or value in the currency that defines the product's price first. */
function inAuthority(money: Money | null | undefined, currency: SellingPrice["currency"] | undefined) {
  if (!money) return { primary: "—", secondary: null as string | null };
  const fc = money.fc === null ? null : formatFC(money.fc);
  const usd = money.usd === null ? null : formatUSD(money.usd);
  return currency === "USD" ? { primary: usd ?? fc ?? "—", secondary: usd ? fc : null } : { primary: fc ?? usd ?? "—", secondary: fc ? usd : null };
}

export default function ProductStockSheet() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const filters = useReportFilters({ withCategory: false });
  const shop = useShopIdentity();
  const [data, setData] = useState<ProductStockSheetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const { query, rangeValid, range, ready } = filters;

  const load = useCallback(async () => {
    if (!rangeValid || !ready) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const payload = await requestJson<ProductStockSheetPayload>(`${serverUrl}/products/${encodeURIComponent(id)}/stock-sheet?${query}`);
      if (seq === requestSeq.current) setData(payload);
    } catch (caught) {
      if (seq === requestSeq.current) { setError(toApiError(caught).message); setData(null); }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [id, query, rangeValid, ready]);

  useEffect(() => { void load(); }, [load]);

  const product = data?.product;
  const row = data?.row ?? null;
  const periodLabel = periodLabelOf(data?.period, range);
  const authority = product?.sellingPrice?.currency;
  const price = inAuthority(row?.sellingPrice ?? product?.sellingPrice, authority);
  const value = inAuthority(row?.inventoryValue, authority);

  function exportPdf() {
    if (!data) return;
    downloadOperationalReportPdf(productStockSheetPdfModel(data, { shop, periodLabel, generatedAt: formatNowGMT2(), range }));
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link to="/products" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("operationalReports.backToProducts")}
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("operationalReports.stock.title")}</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-slate-900 sm:text-3xl">{product?.name || (loading ? t("common.loading") : "—")}</h1>
        {product && (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <div><dt className="text-slate-600">{t("operationalReports.category")}</dt><dd className="font-medium text-slate-900">{categoryLabel(product.category)}</dd></div>
            <div><dt className="text-slate-600">{t("operationalReports.reference")}</dt><dd className="break-words font-medium text-slate-900">{[product.subcategory, product.brand].filter(Boolean).join(" · ") || "—"}</dd></div>
            <div><dt className="text-slate-600">{t("operationalReports.unit")}</dt><dd className="font-medium text-slate-900">{product.unit}</dd></div>
            <div><dt className="text-slate-600">{t("operationalReports.currentStock")}</dt><dd className="font-medium tabular-nums text-slate-900">{formatQuantity(product.currentStock)}</dd></div>
            <div><dt className="text-slate-600">{t("operationalReports.status")}</dt><dd className="font-medium text-slate-900">{product.status === "active" ? t("operationalReports.statusActive") : t("operationalReports.statusInactive")}</dd></div>
            <div><dt className="text-slate-600">{t("operationalReports.sellingPrice")}</dt><dd className="font-medium tabular-nums text-slate-900">{inAuthority(product.sellingPrice, authority).primary}</dd></div>
          </dl>
        )}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={t("operationalReports.filters")}>
        <div className="report-filter-bar">
          <ReportFilterFields filters={filters} withCategory={false} idPrefix="product-sheet" />
          <div className="report-filter-actions">
            <button type="button" onClick={() => void load()} disabled={loading || !rangeValid} className="ui-button ui-button--ghost flex-1 sm:flex-none">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              {t("common.refresh")}
            </button>
            <button type="button" onClick={exportPdf} disabled={!data || loading} className="ui-button ui-button--secondary flex-1 sm:flex-none">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("operationalReports.downloadPdf")}
            </button>
          </div>
        </div>
        {!rangeValid && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("operationalReports.invalidRange")}</p>}
      </section>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}

      {data && (
        <section aria-busy={loading} aria-labelledby="product-sheet-summary" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="product-sheet-summary" className="text-base font-semibold text-slate-900">
            {t("operationalReports.period")} : <span className="font-normal">{periodLabel}</span>
          </h2>
          {!row ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-600">{t("operationalReports.productNotExisting")}</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <SummaryCard label={t("operationalReports.opening")} value={formatQuantity(row.openingStock)} />
                <SummaryCard label={t("operationalReports.additions")} value={formatSignedChange(row.additions, "+")} tone="text-emerald-800" />
                <SummaryCard label={t("operationalReports.reductions")} value={formatSignedChange(row.reductions, "-")} tone="text-red-800" />
                <SummaryCard label={t("operationalReports.salesOut")} value={formatSignedChange(row.salesOut, "-")} tone="text-blue-800" />
                <SummaryCard label={t("operationalReports.closing")} value={formatQuantity(row.closingStock)} />
              </div>
              <p className="mt-3 text-xs text-slate-600">{t("operationalReports.stock.formula")}</p>
              {!row.trackingComplete && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("operationalReports.incompleteHistory")}</p>}

              <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t("operationalReports.inventoryValue")}</h3>
                <p className="mt-1 break-words text-2xl font-bold tabular-nums text-gray-900">{value.primary}</p>
                {value.secondary && <p className="text-sm tabular-nums text-gray-600">≈ {value.secondary}</p>}
                {row.closingStock !== null && row.inventoryValue && (
                  <p className="mt-2 text-sm text-gray-800">
                    {t("operationalReports.valuationFormula", { quantity: formatQuantity(row.closingStock), unit: product?.unit, price: price.primary, value: value.primary })}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-600">{t("operationalReports.inventoryValueHint")}</p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
