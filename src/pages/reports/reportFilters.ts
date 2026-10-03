// Report filter state (business-time periods, shareholder category pinned),
// period labels and the shop identity used in PDF headers.
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";
import { formatDateGMT2 } from "../../utils/dateUtils";
import { requestJson } from "../../lib/apiError";
import {
  COMPANY_NAME,
  businessDay,
  isValidRange,
  reportRange,
  type ReportCategory,
  type ReportPeriod,
  type ReportPeriodRange,
  type ShopIdentity,
} from "./operationalReportModel";

export const fieldClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600";

export function useReportFilters({ withCategory = true } = {}) {
  const { user, loading } = useAuth();
  const today = businessDay(new Date());
  const [period, setPeriod] = useState<ReportPeriod>("today");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const fixedCategory = user?.role === "admin" && (user.assignedCategory === "CLOTHES" || user.assignedCategory === "SHOES")
    ? user.assignedCategory
    : undefined;
  const [category, setCategory] = useState<ReportCategory>(fixedCategory || "ALL");
  const range = useMemo(() => reportRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const effectiveCategory: ReportCategory = withCategory ? (fixedCategory || category) : "ALL";
  const query = useMemo(() => {
    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (effectiveCategory !== "ALL") params.set("category", effectiveCategory);
    return params.toString();
  }, [range.from, range.to, effectiveCategory]);
  return {
    period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
    category: effectiveCategory, setCategory, fixedCategory,
    range, rangeValid: isValidRange(range), query,
    // Requests wait for the signed-in user so a shareholder's first request
    // already carries its pinned category.
    ready: !loading,
  };
}

export type ReportFilters = ReturnType<typeof useReportFilters>;

/** The period as the server computed it (business days), or as selected. */
export function periodLabelOf(period: ReportPeriodRange | null | undefined, range: { from: string; to: string }): string {
  return period
    ? `${formatDateGMT2(period.start)} – ${formatDateGMT2(period.end)}`
    : `${formatDateGMT2(`${range.from}T12:00:00Z`)} – ${formatDateGMT2(`${range.to}T12:00:00Z`)}`;
}

/** Official shop details from the receipt settings, for PDF headers. */
export function useShopIdentity(enabled = true): ShopIdentity {
  const [shop, setShop] = useState<ShopIdentity>({ shopName: COMPANY_NAME });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    requestJson<Record<string, string>>(`${serverUrl}/settings/receipt`).then((settings) => {
      if (!active || !settings) return;
      setShop({
        shopName: settings.shopName || COMPANY_NAME,
        shopAddress: settings.shopAddress,
        shopNumber: settings.shopNumber,
        shopRegistration: settings.shopRegistration,
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [enabled]);
  return shop;
}

