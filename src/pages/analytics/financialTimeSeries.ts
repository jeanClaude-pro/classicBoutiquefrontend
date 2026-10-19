// Data model of the Reports financial chart (GET /analytics/timeseries).
// The server computes every amount; this module only describes the payload,
// builds the request and formats dates. It never recalculates money.
import { currentLocale } from "../../i18n/index.ts";
import type { AccountingCategory } from "./accountingPresentation.ts";

export type Granularity = "hour" | "day" | "week" | "month";
export type GranularityChoice = Granularity | "auto";
export type SeriesMetric = "revenue" | "grossProfit" | "netResult";
export type RangePreset = "7d" | "30d" | "90d" | "6m" | "12m" | "ytd" | "custom";

export const BUSINESS_TIMEZONE = "Africa/Lubumbashi";
// Hourly buckets cover at most one week (7 x 24), like the API.
export const MAX_BUCKETS: Record<Granularity, number> = { hour: 168, day: 400, week: 260, month: 120 };
export const RANGE_PRESETS: readonly Exclude<RangePreset, "custom">[] = ["7d", "30d", "90d", "6m", "12m", "ytd"];
export const SERIES_METRICS: readonly SeriesMetric[] = ["revenue", "grossProfit", "netResult"];

export interface SeriesFigures {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  companyExpenses: number;
  netResult: number;
  grossMargin: number | null;
  revenueFC: number;
  costOfGoodsSoldFC: number;
  grossProfitFC: number;
  companyExpensesFC: number;
  netResultFC: number;
  sales: number;
  unitsSold: number;
}

export interface SeriesBucket extends SeriesFigures {
  /** First business day of the bucket (YYYY-MM-DD); "YYYY-MM-DDTHH" for an hour. */
  date: string;
  /** Business hour (0-23) of an hourly bucket. */
  hour?: number;
  /** Bucket clipped to the requested range. */
  start: string;
  end: string;
  partial: boolean;
  byCategory: Partial<Record<AccountingCategory, SeriesFigures>>;
}

export interface TimeSeriesResponse {
  success: boolean;
  source: string;
  range: { from: string; to: string; start: string; end: string; days: number };
  granularity: Granularity;
  currency: "USD";
  categories: AccountingCategory[];
  series: SeriesBucket[];
  totals: SeriesFigures & { byCategory: Partial<Record<AccountingCategory, SeriesFigures>> };
}

export const FC_FIELD: Record<SeriesMetric, keyof SeriesFigures> = {
  revenue: "revenueFC",
  grossProfit: "grossProfitFC",
  netResult: "netResultFC",
};

// ------------------------------------------------------------- calendar
const DAY_MS = 86_400_000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const utc = (key: string) => new Date(`${key}T00:00:00.000Z`);

/** Today's date in the boutique's business timezone (YYYY-MM-DD). */
export function businessToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(key: string, days: number): string {
  return isoDate(new Date(utc(key).getTime() + days * DAY_MS));
}

/** Same day `months` earlier, clamped to the end of shorter months. */
export function subtractMonths(key: string, months: number): string {
  const date = utc(key);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return isoDate(target);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS) + 1;
}

/** Inclusive range of a preset, ending today (business timezone). */
export function presetRange(preset: Exclude<RangePreset, "custom">, today: string = businessToday()): { from: string; to: string } {
  switch (preset) {
    case "7d": return { from: addDays(today, -6), to: today };
    case "30d": return { from: addDays(today, -29), to: today };
    case "90d": return { from: addDays(today, -89), to: today };
    case "6m": return { from: addDays(subtractMonths(today, 6), 1), to: today };
    case "12m": return { from: addDays(subtractMonths(today, 12), 1), to: today };
    case "ytd": return { from: `${today.slice(0, 4)}-01-01`, to: today };
  }
}

/** The bucket size the server picks for "auto" (kept in sync with the API). */
export function autoGranularity(days: number): Granularity {
  if (days <= 1) return "hour";
  if (days <= 62) return "day";
  if (days <= 366) return "week";
  return "month";
}

/** Number of buckets a range needs, to disable sizes the API would refuse. */
export function bucketCount(from: string, to: string, granularity: Granularity): number {
  if (granularity === "hour") return daysBetween(from, to) * 24;
  if (granularity === "day") return daysBetween(from, to);
  if (granularity === "week") {
    const start = utc(from);
    const monday = new Date(start.getTime() - ((start.getUTCDay() + 6) % 7) * DAY_MS);
    return Math.floor((utc(to).getTime() - monday.getTime()) / (7 * DAY_MS)) + 1;
  }
  const a = utc(from);
  const b = utc(to);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() + 1;
}

export function validateRange(from: string, to: string): "invalid" | "order" | null {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(from) || !pattern.test(to) || Number.isNaN(utc(from).getTime()) || Number.isNaN(utc(to).getTime())) return "invalid";
  if (from > to) return "order";
  return null;
}

export function timeSeriesQuery({ from, to, granularity, category }: {
  from: string; to: string; granularity: GranularityChoice; category?: AccountingCategory | null;
}): string {
  const params = new URLSearchParams({ from, to, granularity });
  if (category) params.set("category", category);
  return params.toString();
}

// ----------------------------------------------------------- formatting
// Bucket keys are calendar dates, so they are formatted in UTC: no browser
// timezone can move them to the previous day.
const dateFormat = (options: Intl.DateTimeFormatOptions) => (key: string) =>
  utc(key.slice(0, 10)).toLocaleDateString(currentLocale(), { timeZone: "UTC", ...options });

/** "14:00" for the business hour of an hourly key ("YYYY-MM-DDTHH"). */
export function hourLabel(key: string, offset = 0): string {
  const hour = (Number(key.slice(11, 13)) + offset) % 24;
  return new Date(Date.UTC(2000, 0, 1, hour)).toLocaleTimeString(currentLocale(), {
    timeZone: "UTC", hour: "2-digit", minute: "2-digit",
  });
}

export function axisLabel(key: string, granularity: Granularity): string {
  if (granularity === "hour") return hourLabel(key);
  if (granularity === "month") return dateFormat({ month: "short", year: "2-digit" })(key);
  return dateFormat({ day: "numeric", month: "short" })(key);
}

export function bucketLabel(bucket: Pick<SeriesBucket, "start" | "end"> & { date?: string }, granularity: Granularity): string {
  if (granularity === "hour" && bucket.date) {
    const day = dateFormat({ weekday: "long", day: "numeric", month: "long", year: "numeric" })(bucket.start);
    return `${day}, ${hourLabel(bucket.date)} – ${hourLabel(bucket.date, 1)}`;
  }
  const long = dateFormat({ day: "numeric", month: "long", year: "numeric" });
  if (granularity === "day") return dateFormat({ weekday: "long", day: "numeric", month: "long", year: "numeric" })(bucket.start);
  if (granularity === "month" && bucket.start.slice(8) === "01" && addDays(bucket.end, 1).slice(8) === "01") {
    return dateFormat({ month: "long", year: "numeric" })(bucket.start);
  }
  return bucket.start === bucket.end ? long(bucket.start) : `${long(bucket.start)} – ${long(bucket.end)}`;
}

export function rangeLabel(from: string, to: string): string {
  const long = dateFormat({ day: "numeric", month: "short", year: "numeric" });
  return from === to ? long(from) : `${long(from)} – ${long(to)}`;
}

/** Compact axis amounts (the unit is shown once above the axis): 1 250 → "1,3 k". */
export function compactAmount(value: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    notation: "compact", maximumFractionDigits: Math.abs(value) < 1000 ? 0 : 1,
  }).format(value);
}
