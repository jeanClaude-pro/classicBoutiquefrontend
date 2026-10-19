// Financial time-series chart of the Reports page.
//
// One measure, one axis: a thin forest-green line through the exact bucket
// values, with narrow low-opacity bars of the same values beneath it.
// `type="monotone"` draws a smooth curve that passes through every point and
// never overshoots between two of them (monotone cubic interpolation), so
// peaks and declines are the real ones. Empty buckets are real zeros from
// the server; nothing is averaged, resampled or smoothed in the data.
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { serverUrl } from "../../utils/constants";
import { formatFC, formatUSD } from "../../utils/salePricing";
import { requestJson, toApiError } from "../../lib/apiError";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ErrorState } from "../../components/ui";
import type { AccountingCategory } from "./accountingPresentation";
import {
  FC_FIELD, MAX_BUCKETS, SERIES_METRICS,
  autoGranularity, axisLabel, bucketCount, bucketLabel, compactAmount, daysBetween,
  rangeLabel, timeSeriesQuery,
  type Granularity, type GranularityChoice, type SeriesBucket, type SeriesMetric, type TimeSeriesResponse,
} from "./financialTimeSeries";
import "./financialReports.css";

// Same values as the design tokens (SVG presentation attributes cannot read CSS variables).
const FOREST = "#166534";
const CHARCOAL = "#27272a";
const MUTED = "#71717a";
const GRID = "#ecece6";
const AXIS = "#d4d4cd";

type CategoryFilter = AccountingCategory | "ALL";

interface ChartRow extends SeriesBucket { value: number }

function ChartTooltip({ active, row, metricLabel, granularity, fcField }: {
  active?: boolean; row?: ChartRow; metricLabel: string; granularity: Granularity; fcField: keyof SeriesBucket;
}) {
  const { t } = useTranslation();
  if (!active || !row) return null;
  const fc = row[fcField] as number;
  return (
    <div className="fin-tooltip" role="status">
      <p className="fin-tooltip-date">{bucketLabel(row, granularity)}</p>
      <p className={`fin-tooltip-value${row.value < 0 ? " is-negative" : ""}`}>{formatUSD(row.value)}</p>
      <p className="fin-tooltip-fc">≈ {formatFC(fc)}</p>
      <div className="fin-tooltip-meta">
        <span>{metricLabel}</span>
        <span>{t("financialReports.chart.salesCount", { count: row.sales })} · {t("financialReports.chart.units", { count: row.unitsSold })}</span>
        {row.grossMargin !== null && <span>{t("financialReports.chart.margin", { value: row.grossMargin.toFixed(1) })}</span>}
      </div>
      {row.partial && <p className="fin-tooltip-partial">{t("financialReports.chart.partialBucket")}</p>}
    </div>
  );
}

export default function FinancialTrendChart({ canFilterCategory, lockedCategory, from, to, reloadToken = 0 }: {
  /** Superadmin: may switch between both categories and each one. */
  canFilterCategory: boolean;
  /** Shareholder: the server pins the series to this category anyway. */
  lockedCategory?: AccountingCategory | null;
  /** Inclusive business dates of the page's analysis period (owned by the Reports page). */
  from: string;
  to: string;
  /** Bumped by the page's Refresh button to reload the series. */
  reloadToken?: number;
}) {
  const { t, i18n } = useTranslation();
  const isPhone = useMediaQuery("(max-width: 640px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // The period is chosen once for the whole page; the chart only follows it.
  const range = useMemo(() => ({ from, to }), [from, to]);
  const [granularity, setGranularity] = useState<GranularityChoice>("auto");
  const [metric, setMetric] = useState<SeriesMetric>("revenue");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [showData, setShowData] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<TimeSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = daysBetween(range.from, range.to);
  const allowed = (choice: Granularity) => bucketCount(range.from, range.to, choice) <= MAX_BUCKETS[choice];
  const effectiveGranularity: GranularityChoice = granularity !== "auto" && !allowed(granularity) ? "auto" : granularity;
  const requestedCategory = canFilterCategory && category !== "ALL" ? category : null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const query = timeSeriesQuery({ ...range, granularity: effectiveGranularity, category: requestedCategory });
    requestJson<TimeSeriesResponse>(`${serverUrl}/analytics/timeseries?${query}`, { signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) return;
        if (payload?.source !== "mongodb-aggregation" || !Array.isArray(payload.series)) {
          throw new Error(t("reports.unexpectedResponse"));
        }
        setData(payload);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(toApiError(reason).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range, effectiveGranularity, requestedCategory, reloadKey, reloadToken, t]);

  const shownGranularity: Granularity = data?.granularity ?? (effectiveGranularity === "auto" ? autoGranularity(days) : effectiveGranularity);
  const rows: ChartRow[] = useMemo(
    () => (data?.series ?? []).map((bucket) => ({ ...bucket, value: bucket[metric] })),
    [data, metric],
  );

  const stats = useMemo(() => {
    if (!data || rows.length === 0) return null;
    let peak = rows[0];
    let low = rows[0];
    for (const row of rows) {
      if (row.value > peak.value) peak = row;
      if (row.value < low.value) low = row;
    }
    const total = data.totals[metric];
    return {
      total,
      totalFC: data.totals[FC_FIELD[metric]] as number,
      average: total / rows.length,
      peak,
      low,
      min: low.value,
      max: peak.value,
      allZero: rows.every((row) => row.value === 0),
    };
  }, [data, rows, metric]);

  const metricLabel = t(`financialReports.metrics.${metric}`);
  const granularityWord = t(`financialReports.granularity.per.${shownGranularity}`);

  const yDomain: [number | "auto", number | "auto"] = !stats || stats.allZero ? [0, 100] : [stats.min < 0 ? "auto" : 0, "auto"];
  const chartLabel = stats
    ? t("financialReports.chart.ariaSummary", {
      metric: metricLabel, range: rangeLabel(range.from, range.to), total: formatUSD(stats.total),
      peak: formatUSD(stats.peak.value), peakDate: bucketLabel(stats.peak, shownGranularity),
    })
    : metricLabel;
  const scopeTitle = lockedCategory
    ? t(`accounting.categoryTitles.${lockedCategory}`)
    : category === "ALL" ? t("financialReports.chart.allCategories") : t(`accounting.categoryTitles.${category}`);

  return (
    <section className="fin-chart analytics-card bg-white rounded-lg border border-gray-200" aria-labelledby="fin-chart-title" lang={i18n.language}>
      <div className="fin-chart-header">
        <div>
          <h2 id="fin-chart-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            {t("financialReports.chart.title", { metric: metricLabel })}
          </h2>
          <p>{scopeTitle} · {rangeLabel(range.from, range.to)} · {t(`financialReports.granularity.label.${shownGranularity}`)}</p>
        </div>
        <div className="fin-segmented" role="group" aria-label={t("financialReports.chart.metric")}>
          {SERIES_METRICS.map((option) => (
            <button key={option} type="button" aria-pressed={metric === option} className={metric === option ? "is-active" : undefined} onClick={() => setMetric(option)}>
              {t(`financialReports.metrics.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="fin-chart-controls">
        <span className="fin-spacer" />
        {canFilterCategory && (
          <div className="fin-segmented" role="group" aria-label={t("financialReports.chart.category")}>
            {(["ALL", "CLOTHES", "SHOES"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={category === option} className={category === option ? "is-active" : undefined} onClick={() => setCategory(option)}>
                {option === "ALL" ? t("financialReports.chart.allCategories") : t(`accounting.categoryTitles.${option}`)}
              </button>
            ))}
          </div>
        )}
        <label className="sr-only" htmlFor="fin-granularity">{t("financialReports.granularity.title")}</label>
        <select id="fin-granularity" className="fin-select" value={effectiveGranularity} onChange={(event) => setGranularity(event.target.value as GranularityChoice)}>
          <option value="auto">{t("financialReports.granularity.auto", { size: t(`financialReports.granularity.label.${autoGranularity(days)}`) })}</option>
          {(["hour", "day", "week", "month"] as const).map((option) => (
            <option key={option} value={option} disabled={!allowed(option)}>{t(`financialReports.granularity.label.${option}`)}</option>
          ))}
        </select>
      </div>

      {error && !data ? (
        <div className="mt-5"><ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /></div>
      ) : (
        <>
          <dl className="fin-kpis" aria-busy={loading || undefined}>
            <div className="fin-kpi">
              <dt>{t("financialReports.chart.kpi.total")}</dt>
              <dd className={stats && stats.total < 0 ? "is-negative" : undefined}>
                {stats ? formatUSD(stats.total) : "—"}
                {stats && <small>≈ {formatFC(stats.totalFC)}</small>}
              </dd>
            </div>
            <div className="fin-kpi">
              <dt>{t("financialReports.chart.kpi.average", { per: granularityWord })}</dt>
              <dd className={stats && stats.average < 0 ? "is-negative" : undefined}>
                {stats ? formatUSD(stats.average) : "—"}
                {data && <small>{t("financialReports.chart.salesCount", { count: data.totals.sales })}</small>}
              </dd>
            </div>
            <div className="fin-kpi">
              <dt>{t("financialReports.chart.kpi.peak")}</dt>
              <dd>
                {stats && !stats.allZero ? formatUSD(stats.peak.value) : "—"}
                {stats && !stats.allZero && <small>{bucketLabel(stats.peak, shownGranularity)}</small>}
              </dd>
            </div>
            <div className="fin-kpi">
              <dt>{t("financialReports.chart.kpi.low")}</dt>
              <dd className={stats && stats.low.value < 0 ? "is-negative" : undefined}>
                {stats && !stats.allZero ? formatUSD(stats.low.value) : "—"}
                {stats && !stats.allZero && <small>{bucketLabel(stats.low, shownGranularity)}</small>}
              </dd>
            </div>
          </dl>

          <figure className="fin-plot" role="img" aria-label={chartLabel}>
            <span className="fin-plot-unit" aria-hidden="true">USD</span>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ top: 18, right: isPhone ? 6 : 12, bottom: 0, left: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(key: string) => axisLabel(key, shownGranularity)}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: AXIS }}
                  minTickGap={shownGranularity === "hour" ? 4 : isPhone ? 18 : 28}
                  // One label per hour on a day view (every 3 hours on phones).
                  interval={shownGranularity === "hour" ? (isPhone ? 2 : 0) : "preserveStartEnd"}
                  tickMargin={8}
                />
                <YAxis
                  domain={yDomain}
                  tickFormatter={(value: number) => compactAmount(value)}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={isPhone ? 40 : 48}
                  tickCount={5}
                  allowDecimals={false}
                />
                {stats && stats.min < 0 && <ReferenceLine y={0} stroke={MUTED} strokeWidth={1} />}
                <Tooltip
                  cursor={{ stroke: AXIS, strokeWidth: 1 }}
                  isAnimationActive={false}
                  wrapperStyle={{ outline: "none", zIndex: 5 }}
                  content={(props) => (
                    <ChartTooltip
                      active={props.active}
                      row={props.payload?.[0]?.payload as ChartRow | undefined}
                      metricLabel={metricLabel}
                      granularity={shownGranularity}
                      fcField={FC_FIELD[metric]}
                    />
                  )}
                />
                <Bar
                  dataKey="value"
                  fill={FOREST}
                  fillOpacity={0.14}
                  maxBarSize={isPhone ? 4 : 6}
                  radius={[2, 2, 0, 0]}
                  activeBar={{ fill: FOREST, fillOpacity: 0.32 }}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
                <Line
                  dataKey="value"
                  type="monotone"
                  stroke={FOREST}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  dot={rows.length === 1 ? { r: 3, fill: FOREST, strokeWidth: 0 } : false}
                  activeDot={{ r: 4.5, fill: "#ffffff", stroke: FOREST, strokeWidth: 2 }}
                  isAnimationActive={!reducedMotion}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
            {stats?.allZero && !loading && <div className="fin-plot-empty"><span>{t("financialReports.chart.empty")}</span></div>}
            {loading && (
              <div className="fin-plot-loading" role="status">
                <span className="ui-button-spinner" aria-hidden="true" style={{ borderColor: AXIS, borderTopColor: CHARCOAL }} />
                {t("common.loading")}
              </div>
            )}
          </figure>
          {error && data && <p className="fin-field-error" role="alert">{error}</p>}

          <div className="fin-chart-footer">
            <span className="fin-legend" aria-hidden="true">
              <span><i className="is-line" />{metricLabel}</span>
              <span><i className="is-bar" />{t("financialReports.chart.barsLegend", { per: granularityWord })}</span>
            </span>
            <span>{t("financialReports.chart.source")}</span>
            <button type="button" className="fin-link-button" aria-expanded={showData} aria-controls="fin-chart-data" onClick={() => setShowData((value) => !value)}>
              {showData ? t("financialReports.chart.hideData") : t("financialReports.chart.showData")}
            </button>
          </div>

          {showData && data && (
            <div id="fin-chart-data" className="fin-data-table">
              <div className="fin-table-scroll" role="region" aria-label={t("financialReports.chart.dataTitle")} tabIndex={0}>
                <table className="fin-table">
                  <caption className="sr-only">{t("financialReports.chart.dataTitle")}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t("financialReports.chart.columns.period")}</th>
                      <th scope="col" className="text-right">{t("financialReports.metrics.revenue")}</th>
                      <th scope="col" className="text-right">{t("financialReports.rows.costOfGoodsSold")}</th>
                      <th scope="col" className="text-right">{t("financialReports.metrics.grossProfit")}</th>
                      <th scope="col" className="text-right">{t("financialReports.rows.companyExpenses")}</th>
                      <th scope="col" className="text-right">{t("financialReports.metrics.netResult")}</th>
                      <th scope="col" className="text-right">{t("financialReports.chart.columns.sales")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.map((bucket) => (
                      <tr key={bucket.date}>
                        <th scope="row">{bucketLabel(bucket, shownGranularity)}</th>
                        <td className="text-right">{formatUSD(bucket.revenue)}</td>
                        <td className="text-right">{formatUSD(bucket.costOfGoodsSold)}</td>
                        <td className={`text-right${bucket.grossProfit < 0 ? " is-negative" : ""}`}>{formatUSD(bucket.grossProfit)}</td>
                        <td className="text-right">{formatUSD(bucket.companyExpenses)}</td>
                        <td className={`text-right${bucket.netResult < 0 ? " is-negative" : ""}`}>{formatUSD(bucket.netResult)}</td>
                        <td className="text-right">{bucket.sales}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">{t("financialReports.tables.total")}</th>
                      <td className="text-right">{formatUSD(data.totals.revenue)}</td>
                      <td className="text-right">{formatUSD(data.totals.costOfGoodsSold)}</td>
                      <td className="text-right">{formatUSD(data.totals.grossProfit)}</td>
                      <td className="text-right">{formatUSD(data.totals.companyExpenses)}</td>
                      <td className="text-right">{formatUSD(data.totals.netResult)}</td>
                      <td className="text-right">{data.totals.sales}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
