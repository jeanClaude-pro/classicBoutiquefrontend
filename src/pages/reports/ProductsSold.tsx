// Fiche des ventes / Products sold (/reports/products-sold): realised sales of
// the period per product, aggregated by the server from recognised sales and
// their immutable line snapshots. Revenue = purchase cost + profit = actual
// selling amount. Purchase cost and profit are only sent to the superadmin
// and to shareholders (for their own category).
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MODULES } from "../../config/modules";
import { serverUrl } from "../../utils/constants";
import { formatNowGMT2 } from "../../utils/dateUtils";
import { requestJson, toApiError } from "../../lib/apiError";
import { downloadOperationalReportPdf } from "./operationalReportPdf";
import { categoryLabel, formatMoney, formatQuantity, salesSheetPdfModel, soldPriceLine, type SalesSheetPayload } from "./operationalReportModel";
import { MoneyValue, ReportFilterFields, SummaryCard } from "./reportControls";
import { periodLabelOf, useReportFilters, useShopIdentity } from "./reportFilters";

const th = "border-b border-slate-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
const thNum = `${th} text-right`;
const td = "px-3 py-3 align-top";
const tdNum = `${td} text-right tabular-nums`;

export default function ProductsSold() {
  const { t } = useTranslation();
  const filters = useReportFilters();
  const shop = useShopIdentity();
  const [data, setData] = useState<SalesSheetPayload | null>(null);
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
      const payload = await requestJson<SalesSheetPayload>(`${serverUrl}/analytics/sales-sheet?${query}`);
      if (seq === requestSeq.current) setData(payload);
    } catch (caught) {
      if (seq === requestSeq.current) { setError(toApiError(caught).message); setData(null); }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [query, rangeValid, ready]);

  useEffect(() => { void load(); }, [load]);

  const periodLabel = periodLabelOf(data?.period, range);
  const financial = Boolean(data?.financialsVisible);
  const summary = data?.summary;

  function exportPdf() {
    if (!data) return;
    downloadOperationalReportPdf(salesSheetPdfModel(data, { shop, periodLabel, generatedAt: formatNowGMT2(), range }));
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link to="/reports" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("operationalReports.backToReports")}
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{MODULES.productsSold.label}</h1>
        <p className="mt-1 text-slate-600">{MODULES.productsSold.description}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={t("operationalReports.filters")}>
        <div className="report-filter-bar">
          <ReportFilterFields filters={filters} idPrefix="products-sold" />
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
      {loading && !data && <p role="status" className="text-sm text-slate-600">{t("common.loading")}</p>}

      {data && summary && (
        <section aria-busy={loading} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">{t("operationalReports.period")} :</span> {periodLabel}
            <span className="mx-2 text-slate-300" aria-hidden="true">|</span>
            <span className="font-medium">{t("operationalReports.category")} :</span> {categoryLabel(data.category)}
          </p>
          <div className={`mt-3 grid grid-cols-2 gap-3 ${financial ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
            <SummaryCard label={t("operationalReports.skus")} value={formatQuantity(summary.skusSold)} />
            <SummaryCard label={t("operationalReports.totalUnits")} value={formatQuantity(summary.unitsSold)} />
            <SummaryCard label={t("operationalReports.revenue")} {...moneyCard(summary.revenue)} />
            {financial && <SummaryCard label={t("operationalReports.purchaseCost")} {...moneyCard(summary.purchaseCost)} />}
            {financial && <SummaryCard label={t("operationalReports.profit")} tone="text-primary" {...moneyCard(summary.profit)} />}
          </div>
          <p className="mt-3 text-xs text-slate-600">{t("operationalReports.sales.revenueRule")}</p>
          <p className="mt-1 text-xs text-slate-600">{t("operationalReports.sales.recognition")}</p>
          <p className="mt-1 text-xs text-slate-600">{financial ? t("operationalReports.financialFormula") : t("operationalReports.financialsHidden")}</p>

          {data.rows.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-600">{t("operationalReports.noData")}</p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
                <table className={`w-full border-collapse text-sm ${financial ? "min-w-[900px]" : "min-w-[640px]"}`}>
                  <caption className="sr-only">{MODULES.productsSold.label}</caption>
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className={th}>{t("operationalReports.product")}</th>
                      <th scope="col" className={th}>{t("operationalReports.category")}</th>
                      <th scope="col" className={thNum}>{t("operationalReports.soldAt")}</th>
                      <th scope="col" className={thNum}>{t("operationalReports.quantitySold")}</th>
                      <th scope="col" className={thNum}>{t("operationalReports.revenue")}</th>
                      {financial && <th scope="col" className={thNum}>{t("operationalReports.purchaseCost")}</th>}
                      {financial && <th scope="col" className={thNum}>{t("operationalReports.profit")}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={`${row.productId}-${row.category}`}>
                        <th scope="row" className={`${td} text-left font-medium text-slate-900`}>{row.product}</th>
                        <td className={td}>{categoryLabel(row.category)}</td>
                        <td className={tdNum}>
                          <ul className="space-y-0.5">
                            {row.prices.map((price) => <li key={`${price.currency}-${price.unitPrice.usd}-${price.unitPrice.fc}`}>{soldPriceLine(price, row.unit)}</li>)}
                          </ul>
                        </td>
                        <td className={`${tdNum} font-semibold text-slate-900`}>{formatQuantity(row.quantitySold)} {row.unit}</td>
                        <td className={tdNum}><MoneyValue money={row.revenue} strong /></td>
                        {financial && <td className={tdNum}><MoneyValue money={row.purchaseCost} /></td>}
                        {financial && <td className={`${tdNum} text-primary`}><MoneyValue money={row.profit} /></td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <th scope="row" colSpan={3} className={`${td} text-left font-semibold`}>{t("operationalReports.total")}</th>
                      <td className={`${tdNum} font-semibold`}>{formatQuantity(summary.unitsSold)}</td>
                      <td className={tdNum}><MoneyValue money={summary.revenue} strong /></td>
                      {financial && <td className={tdNum}><MoneyValue money={summary.purchaseCost} strong /></td>}
                      {financial && <td className={tdNum}><MoneyValue money={summary.profit} strong /></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              <ul className="mt-4 grid gap-3 md:hidden" aria-label={MODULES.productsSold.label}>
                {data.rows.map((row) => (
                  <li key={`${row.productId}-${row.category}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words font-semibold text-slate-900">{row.product}</p>
                      <span className="flex-none text-xs text-slate-600">{categoryLabel(row.category)}</span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="col-span-2">
                        <dt className="text-xs text-slate-600">{t("operationalReports.soldAt")}</dt>
                        <dd className="tabular-nums">{row.prices.map((price) => <span key={`${price.currency}-${price.unitPrice.usd}-${price.unitPrice.fc}`} className="block">{soldPriceLine(price, row.unit)}</span>)}</dd>
                      </div>
                      <div><dt className="text-xs text-slate-600">{t("operationalReports.quantitySold")}</dt><dd className="text-lg font-semibold tabular-nums">{formatQuantity(row.quantitySold)} {row.unit}</dd></div>
                      <div><dt className="text-xs text-slate-600">{t("operationalReports.revenue")}</dt><dd><MoneyValue money={row.revenue} strong align="left" /></dd></div>
                      {financial && <div><dt className="text-xs text-slate-600">{t("operationalReports.purchaseCost")}</dt><dd><MoneyValue money={row.purchaseCost} align="left" /></dd></div>}
                      {financial && <div><dt className="text-xs text-slate-600">{t("operationalReports.profit")}</dt><dd className="text-primary"><MoneyValue money={row.profit} align="left" /></dd></div>}
                    </dl>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm md:hidden" aria-label={t("operationalReports.total")}>
                <div><dt className="text-xs text-slate-600">{t("operationalReports.totalUnits")}</dt><dd className="font-semibold tabular-nums">{formatQuantity(summary.unitsSold)}</dd></div>
                <div><dt className="text-xs text-slate-600">{t("operationalReports.revenue")}</dt><dd><MoneyValue money={summary.revenue} strong align="left" /></dd></div>
                {financial && <div><dt className="text-xs text-slate-600">{t("operationalReports.purchaseCost")}</dt><dd><MoneyValue money={summary.purchaseCost} strong align="left" /></dd></div>}
                {financial && <div><dt className="text-xs text-slate-600">{t("operationalReports.profit")}</dt><dd><MoneyValue money={summary.profit} strong align="left" /></dd></div>}
              </dl>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function moneyCard(money: SalesSheetPayload["summary"]["revenue"] | undefined) {
  const { primary, secondary } = formatMoney(money);
  return { value: primary, secondary };
}
