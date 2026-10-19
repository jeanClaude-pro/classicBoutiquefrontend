import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays, autoGranularity, bucketCount, bucketLabel, businessToday, daysBetween,
  presetRange, subtractMonths, timeSeriesQuery, validateRange,
} from "../src/pages/analytics/financialTimeSeries.ts";

test("today follows the boutique's timezone, not the browser's", () => {
  // 23:30 UTC on 18 October is already 19 October in Lubumbashi (UTC+2).
  assert.equal(businessToday(new Date("2026-10-18T23:30:00Z")), "2026-10-19");
  assert.equal(businessToday(new Date("2026-10-18T21:59:59Z")), "2026-10-18");
});

test("range presets are inclusive and end today", () => {
  const today = "2026-10-19";
  assert.deepEqual(presetRange("7d", today), { from: "2026-10-13", to: today });
  assert.deepEqual(presetRange("30d", today), { from: "2026-09-20", to: today });
  assert.equal(daysBetween(presetRange("90d", today).from, today), 90);
  assert.deepEqual(presetRange("6m", today), { from: "2026-04-20", to: today });
  assert.deepEqual(presetRange("12m", today), { from: "2025-10-20", to: today });
  assert.deepEqual(presetRange("ytd", today), { from: "2026-01-01", to: today });
});

test("calendar arithmetic handles month ends and leap years", () => {
  assert.equal(subtractMonths("2026-03-31", 1), "2026-02-28");
  assert.equal(subtractMonths("2024-03-31", 1), "2024-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("bucket counts match the server's Monday weeks and calendar months", () => {
  assert.equal(bucketCount("2026-09-10", "2026-09-21", "week"), 3);
  assert.equal(bucketCount("2026-11-15", "2027-01-02", "month"), 3);
  assert.equal(bucketCount("2026-01-01", "2026-01-31", "day"), 31);
  assert.equal(autoGranularity(62), "day");
  assert.equal(autoGranularity(63), "week");
  assert.equal(autoGranularity(367), "month");
});

test("custom ranges are validated before any request", () => {
  assert.equal(validateRange("2026-01-01", "2026-01-31"), null);
  assert.equal(validateRange("2026-02-01", "2026-01-31"), "order");
  assert.equal(validateRange("", "2026-01-31"), "invalid");
  assert.equal(timeSeriesQuery({ from: "2026-01-01", to: "2026-01-31", granularity: "auto", category: "SHOES" }), "from=2026-01-01&to=2026-01-31&granularity=auto&category=SHOES");
  assert.equal(timeSeriesQuery({ from: "2026-01-01", to: "2026-01-31", granularity: "week" }), "from=2026-01-01&to=2026-01-31&granularity=week");
});

test("bucket labels are calendar dates whatever the browser timezone", () => {
  assert.match(bucketLabel({ start: "2026-09-01", end: "2026-09-30" }, "month"), /septembre 2026/i);
  assert.match(bucketLabel({ start: "2026-09-10", end: "2026-09-13" }, "week"), /10 septembre 2026 – 13 septembre 2026/);
});

test("a single day is charted hour by hour", () => {
  assert.equal(autoGranularity(1), "hour");
  assert.equal(autoGranularity(2), "day");
  assert.equal(bucketCount("2026-10-19", "2026-10-19", "hour"), 24);
  assert.match(bucketLabel({ date: "2026-10-19T14", start: "2026-10-19", end: "2026-10-19" }, "hour"), /lundi 19 octobre 2026, 14:00 – 15:00/i);
  assert.match(bucketLabel({ date: "2026-10-19T23", start: "2026-10-19", end: "2026-10-19" }, "hour"), /23:00 – 00:00/);
});
