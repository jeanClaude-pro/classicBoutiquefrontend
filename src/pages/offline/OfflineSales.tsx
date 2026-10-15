import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertTriangle, CheckCircle2, RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getDeviceSales } from "../../offline/repositories/sales";
import { requeueSale, resolveRefusedSale, synchronizeSales } from "../../offline/syncManager";
import type { LocalSale, SyncStatus } from "../../offline/types";
import { Button } from "../../components/ui";
import { useConfirmAction } from "../../hooks/useConfirmAction";

const STATUS_STYLE: Record<SyncStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  SYNCING: "bg-sky-100 text-sky-900",
  SYNCED: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-red-100 text-red-900",
  CONFLICT: "bg-red-100 text-red-900",
  RESOLVED: "bg-stone-200 text-stone-800",
};

// Managers decide what happens to a refused sale; a cashier cannot hide one.
const CAN_RESOLVE = new Set(["superadmin", "manager"]);

export default function OfflineSales() {
  const { user, token, offline } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const confirmAction = useConfirmAction();
  // Every sale stored on this device, whoever rang it up: a sale must never
  // be invisible just because another cashier is signed in.
  const sales = useLiveQuery<LocalSale[], LocalSale[]>(() => getDeviceSales(), [], []);
  const canSync = Boolean(user && token && !offline);
  const canResolve = Boolean(user && CAN_RESOLVE.has(user.role) && !offline);
  const refused = sales.filter((sale) => sale.syncStatus === "CONFLICT");

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

  const resolve = (sale: LocalSale) => {
    if (!user) return;
    confirmAction.request({
      title: t("offline.markResolved"),
      message: t("offline.resolvedConfirm"),
      details: [
        { label: t("offline.receipt"), value: sale.receiptNumber },
        { label: t("offline.cashier"), value: sale.ownerName },
        { label: t("offline.amount"), value: `${sale.payload.total.toFixed(2)} USD` },
        { label: t("offline.error"), value: sale.lastError || "—" },
      ],
      confirmLabel: t("offline.markResolved"),
      variant: "warning",
      action: () => resolveRefusedSale(sale.clientSaleId, user.username),
    });
  };

  return (
    <div className="page-container space-y-4 p-4 pb-28 sm:p-6 lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("offline.queuedSales")}</h1>
          <p className="text-sm text-stone-600">{t("offline.deviceSales")}. {t("offline.queuedSalesHint")}</p>
          {offline && <p className="mt-1 text-sm font-semibold text-amber-800">{t("offline.syncNeedsOnline")}</p>}
        </div>
        <Button disabled={!canSync || busy} onClick={() => void run(async () => undefined)}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? t("offline.syncing") : t("offline.retry")}
        </Button>
      </div>

      {refused.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900" role="alert">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />{t("offline.refusedTitle")} ({refused.length})</p>
          <p className="mt-1 text-sm">{t("offline.refusedHelp")}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="offline-table w-full min-w-[980px] text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="p-3">{t("offline.receipt")}</th>
              <th>{t("offline.cashier")}</th>
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
            {sales.map((sale) => {
              const mine = sale.ownerUserId === user?.id;
              return (
                <tr key={sale.clientSaleId} className={`border-t align-top ${sale.syncStatus === "CONFLICT" ? "bg-red-50/60" : ""}`}>
                  <td className="p-3 font-mono text-xs">{sale.receiptNumber}</td>
                  <td className="py-3">{sale.ownerName}</td>
                  <td className="py-3">{sale.payload.isWalkIn ? t("pos.walkIn") : sale.payload.customer?.name}</td>
                  <td className="py-3">{sale.payload.total.toFixed(2)} USD</td>
                  <td className="py-3">{new Date(sale.occurredAt).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-1 font-semibold ${STATUS_STYLE[sale.syncStatus]}`}>
                      {t(`offline.statuses.${sale.syncStatus}`)}
                    </span>
                    {sale.syncStatus === "RESOLVED" && sale.resolvedBy && (
                      <span className="mt-1 block text-xs text-stone-500">{sale.resolvedBy} · {sale.resolvedAt ? new Date(sale.resolvedAt).toLocaleString() : ""}</span>
                    )}
                  </td>
                  <td className="py-3">{sale.retryCount}</td>
                  <td className="py-3">{sale.lastAttemptAt ? new Date(sale.lastAttemptAt).toLocaleString() : "—"}</td>
                  <td className="max-w-xs py-3 text-red-700">{sale.lastError || "—"}</td>
                  <td className="space-y-2 p-3">
                    {(sale.syncStatus === "CONFLICT" || sale.syncStatus === "FAILED") && (mine ? (
                      <Button variant="secondary" size="sm" disabled={!canSync || busy} onClick={() => void run(() => requeueSale(sale.clientSaleId))}>
                        <RotateCcw className="h-4 w-4" />
                        {t("offline.retryOne")}
                      </Button>
                    ) : <span className="block text-xs text-stone-500">{t("offline.notMine")}</span>)}
                    {sale.syncStatus === "CONFLICT" && canResolve && (
                      <Button variant="ghost" size="sm" onClick={() => resolve(sale)}>
                        <CheckCircle2 className="h-4 w-4" />
                        {t("offline.markResolved")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sales.length === 0 && <p className="p-8 text-center text-stone-500">{t("offline.none")}</p>}
      </div>
      {confirmAction.dialog}
    </div>
  );
}
