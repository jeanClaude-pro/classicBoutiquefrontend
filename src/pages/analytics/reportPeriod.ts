// The one analysis period of the Reports page.
//
// A period is a type plus an anchor business date (YYYY-MM-DD). Every section
// of the page (summary cards, profitability, accounting tables, debts, top
// lists, the trend chart and the PDF report) reads its from/to from here, so
// they always describe the same days. Dates are plain business-calendar
// strings walked in UTC: no browser timezone can move them by a day.
import { currentLocale, t as translate } from "../../i18n";
import { addDays, businessToday, daysBetween, rangeLabel } from "./financialTimeSeries";

export type PeriodType = "day" | "week" | "month" | "year" | "custom";
export const PERIOD_TYPES: readonly PeriodType[] = ["day", "week", "month", "year", "custom"];

export interface ReportPeriod {
  type: PeriodType;
  /** Inclusive business dates. */
  from: string;
  to: string;
}

const utc = (key: string) => new Date(`${key}T00:00:00.000Z`);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const format = (key: string, options: Intl.DateTimeFormatOptions) =>
  utc(key).toLocaleDateString(currentLocale(), { timeZone: "UTC", ...options });

/** The day, ISO week (Monday–Sunday), month or year that contains `anchor`. */
export function periodAround(type: Exclude<PeriodType, "custom">, anchor: string): ReportPeriod {
  const date = utc(anchor);
  switch (type) {
    case "day":
      return { type, from: anchor, to: anchor };
    case "week": {
      const from = addDays(anchor, -((date.getUTCDay() + 6) % 7));
      return { type, from, to: addDays(from, 6) };
    }
    case "month": {
      const from = `${anchor.slice(0, 7)}-01`;
      const to = isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
      return { type, from, to };
    }
    case "year":
      return { type, from: `${anchor.slice(0, 4)}-01-01`, to: `${anchor.slice(0, 4)}-12-31` };
  }
}

/** The previous or next period of the same type. */
export function shiftPeriod(period: ReportPeriod, direction: -1 | 1): ReportPeriod {
  if (period.type === "custom") {
    const length = daysBetween(period.from, period.to);
    return { ...period, from: addDays(period.from, direction * length), to: addDays(period.to, direction * length) };
  }
  // One day before the start, or one day after the end, lands in the neighbour.
  return periodAround(period.type, direction < 0 ? addDays(period.from, -1) : addDays(period.to, 1));
}

/** Nothing after today can hold data, so the next period is not offered. */
export function canGoForward(period: ReportPeriod, today: string = businessToday()): boolean {
  return shiftPeriod(period, 1).from <= today;
}

/**
 * The range the trend chart draws: the period, stopped at today so a current
 * month or year does not end in a run of future empty buckets.
 */
export function chartRange(period: ReportPeriod, today: string = businessToday()): { from: string; to: string } {
  if (period.to <= today || period.from > today) return { from: period.from, to: period.to };
  return { from: period.from, to: today };
}

/**
 * The legacy `timeframe` the summary endpoint still uses for its small chart
 * series. A custom range is mapped to the closest bucket size.
 */
export function summaryTimeframe(period: ReportPeriod): "day" | "week" | "month" | "year" {
  if (period.type !== "custom") return period.type;
  const days = daysBetween(period.from, period.to);
  if (days <= 7) return "day";
  if (days <= 31) return "week";
  return "month";
}

/** The period in words, in the current language. */
export function describePeriod(period: ReportPeriod): string {
  switch (period.type) {
    case "day":
      return format(period.from, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    case "month":
      return format(period.from, { month: "long", year: "numeric" });
    case "year":
      return translate("reports.year", { year: period.from.slice(0, 4) });
    default:
      return rangeLabel(period.from, period.to);
  }
}
