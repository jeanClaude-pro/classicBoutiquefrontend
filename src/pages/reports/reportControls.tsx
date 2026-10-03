// Presentational pieces shared by the stock and sales report screens.
import { useTranslation } from "react-i18next";
import { categoryLabel, formatMoney, type Money, type ReportCategory, type ReportPeriod } from "./operationalReportModel";
import { fieldClass, type ReportFilters } from "./reportFilters";

export function ReportFilterFields({ filters, withCategory = true, idPrefix }: { filters: ReportFilters; withCategory?: boolean; idPrefix: string }) {
  const { t } = useTranslation();
  const { fixedCategory } = filters;
  return (
    <>
      <label className="text-sm font-medium text-slate-700 report-filter-field" htmlFor={`${idPrefix}-period`}>
        {t("operationalReports.period")}
        <select id={`${idPrefix}-period`} value={filters.period} onChange={(event) => filters.setPeriod(event.target.value as ReportPeriod)} className={fieldClass}>
          <option value="today">{t("operationalReports.today")}</option>
          <option value="week">{t("operationalReports.thisWeek")}</option>
          <option value="month">{t("operationalReports.thisMonth")}</option>
          <option value="custom">{t("operationalReports.custom")}</option>
        </select>
      </label>
      {filters.period === "custom" && (
        <>
          <label className="text-sm font-medium text-slate-700 report-filter-field" htmlFor={`${idPrefix}-from`}>
            {t("operationalReports.from")}
            <input id={`${idPrefix}-from`} type="date" value={filters.customFrom} max={filters.customTo || undefined} onChange={(event) => filters.setCustomFrom(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-sm font-medium text-slate-700 report-filter-field" htmlFor={`${idPrefix}-to`}>
            {t("operationalReports.to")}
            <input id={`${idPrefix}-to`} type="date" value={filters.customTo} min={filters.customFrom || undefined} onChange={(event) => filters.setCustomTo(event.target.value)} className={fieldClass} />
          </label>
        </>
      )}
      {withCategory && (
        <label className="text-sm font-medium text-slate-700 report-filter-field" htmlFor={`${idPrefix}-category`}>
          {t("operationalReports.category")}
          <select id={`${idPrefix}-category`} value={filters.category} disabled={Boolean(fixedCategory)} onChange={(event) => filters.setCategory(event.target.value as ReportCategory)} className={fieldClass}>
            {!fixedCategory && <option value="ALL">{t("operationalReports.allCategories")}</option>}
            {(!fixedCategory || fixedCategory === "CLOTHES") && <option value="CLOTHES">{categoryLabel("CLOTHES")}</option>}
            {(!fixedCategory || fixedCategory === "SHOES") && <option value="SHOES">{categoryLabel("SHOES")}</option>}
          </select>
        </label>
      )}
    </>
  );
}

export function SummaryCard({ label, value, secondary, tone = "text-slate-900", hint }: { label: string; value: string; secondary?: string | null; tone?: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</p>
      <p className={`mt-1 break-words text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      {secondary && <p className="text-xs tabular-nums text-slate-600">≈ {secondary}</p>}
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

/** FC amount with its USD equivalent underneath. */
export function MoneyValue({ money, strong = false, align = "right" }: { money: Money | null | undefined; strong?: boolean; align?: "left" | "right" }) {
  const { primary, secondary } = formatMoney(money);
  return (
    <span className={`inline-block tabular-nums ${align === "right" ? "text-right" : "text-left"}`}>
      <span className={`block ${strong ? "font-semibold text-slate-900" : ""}`}>{primary}</span>
      {secondary && <span className="block text-xs text-slate-500">≈ {secondary}</span>}
    </span>
  );
}
