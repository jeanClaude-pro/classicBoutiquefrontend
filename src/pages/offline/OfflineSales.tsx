import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getUserSales } from "../../offline/repositories/sales";
import { requeueSale, synchronizeSales } from "../../offline/syncManager";
import type { LocalSale, SyncStatus } from "../../offline/types";

const STATUS_STYLE: Record<SyncStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  SYNCING: "bg-blue-100 text-blue-900",
  SYNCED: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-red-100 text-red-900",
  CONFLICT: "bg-red-100 text-red-900",
};

export default function OfflineSales() {
  const { user, token, offline } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const sales = useLiveQuery<LocalSale[], LocalSale[]>(
    () => (user ? getUserSales(user.id) : Promise.resolve([] as LocalSale[])),
    [user?.id],
    [],
  );
  const canSync = Boolean(user && token && !offline);

  // The sync manager serializes every submission; `busy` only stops a
  // double tap from queuing a second, redundant run.
  const run = async (task: () => Promise<void>) => {
    if (busy || !user) return;
    setBusy(true);
    try {
      await task();
      await synchronizeSales(user.id, token, true);
    } catch {
      // Failures are recorded on each sale and shown in the table.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-container space-y-4 p-4 pb-28 sm:p-6 lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("offline.queuedSales")}</h1>
          <p className="text-sm text-slate-500">{t("offline.queuedSalesHint")}</p>
          {offline && <p className="mt-1 text-sm font-semibold text-amber-800">{t("offline.syncNeedsOnline")}</p>}
        </div>
        <button
          type="button"
          disabled={!canSync || busy}
          className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={() => void run(async () => undefined)}
        >
          <RefreshCw className={`mr-2 inline h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? t("offline.syncing") : t("offline.retry")}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">{t("offline.receipt")}</th>
              <th>{t("offline.customer")}</th>
              <th>{t("offline.amount")}</th>
              <th>{t("offline.occurred")}</th>
              <th>{t("offline.status")}</th>
              <th>{t("offline.attempts")}</th>
              <th>{t("offline.lastAttempt")}</th>
              <th>{t("offline.error")}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.clientSaleId} className="border-t align-top">
                <td className="p-3 font-mono text-xs">{sale.receiptNumber}</td>
                <td className="py-3">{sale.payload.isWalkIn ? t("pos.walkIn") : sale.payload.customer?.name}</td>
                <td className="py-3">{sale.payload.total.toFixed(2)} USD</td>
                <td className="py-3">{new Date(sale.occurredAt).toLocaleString()}</td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-1 font-semibold ${STATUS_STYLE[sale.syncStatus]}`}>
                    {t(`offline.statuses.${sale.syncStatus}`)}
                  </span>
                </td>
                <td className="py-3">{sale.retryCount}</td>
                <td className="py-3">{sale.lastAttemptAt ? new Date(sale.lastAttemptAt).toLocaleString() : "—"}</td>
                <td className="max-w-xs py-3 text-red-700">{sale.lastError || "—"}</td>
                <td className="p-3">
                  {(sale.syncStatus === "CONFLICT" || sale.syncStatus === "FAILED") && (
                    <button
                      type="button"
                      disabled={!canSync || busy}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-50"
                      onClick={() => void run(() => requeueSale(sale.clientSaleId))}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("offline.retryOne")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p className="p-8 text-center text-slate-500">{t("offline.none")}</p>}
      </div>
    </div>
  );
}
