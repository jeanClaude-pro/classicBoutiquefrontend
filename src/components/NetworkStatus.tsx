import { useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "../hooks/useAuth";
import { connectivityState, subscribeConnectivity } from "../offline/connectivity";
import { deviceQueueSummary, type DeviceQueueSummary } from "../offline/repositories/sales";

const EMPTY: DeviceQueueSummary = { refused: 0, mineWaiting: 0, othersWaiting: 0, otherCashiers: [] };

/**
 * Connection state plus everything on this device that has not safely
 * reached the server: this cashier's queue, other cashiers' queues and
 * sales the server refused. Nothing unsent is ever invisible.
 */
export default function NetworkStatus() {
  const { user, offline: offlineSession } = useAuth();
  const [state, setState] = useState(connectivityState);
  const { t } = useTranslation();
  useEffect(() => subscribeConnectivity(setState), []);
  const summary = useLiveQuery(() => deviceQueueSummary(user?.id), [user?.id], EMPTY);
  const online = state === "online";
  const waiting = summary.mineWaiting + summary.othersWaiting;
  const tone = summary.refused > 0 ? "has-refused" : online ? "is-online" : "is-offline";
  return <>
    <Link to="/offline-sales" className={`network-status ${tone}`} role="status" aria-live="polite">
      {summary.refused > 0 ? <AlertTriangle aria-hidden="true" /> : state === "checking" ? <RefreshCw className="animate-spin" aria-hidden="true" /> : online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
      <span>
        {offlineSession ? t("offline.session") : state === "checking" ? t("offline.checking") : online ? t("system.online") : t("system.offlineShort")}
        {waiting > 0 ? ` · ${t("offline.pending", { count: waiting })}` : ""}
        {summary.refused > 0 ? ` · ${t("offline.refusedCount", { count: summary.refused })}` : ""}
      </span>
    </Link>
    {summary.refused > 0 && (
      <div className="unsent-alert is-danger" role="alert">
        <AlertTriangle aria-hidden="true" />
        <div><strong>{t("offline.refusedTitle")}</strong><p>{t("offline.refusedHelp")}</p></div>
        <Link to="/offline-sales">{t("offline.openQueue")}</Link>
      </div>
    )}
    {summary.othersWaiting > 0 && (
      <div className="unsent-alert is-warning" role="status">
        <AlertTriangle aria-hidden="true" />
        <div><strong>{t("offline.othersWaitingTitle")}</strong><p>{t("offline.othersWaiting", { names: summary.otherCashiers.join(", "), count: summary.othersWaiting })}</p></div>
        <Link to="/offline-sales">{t("offline.openQueue")}</Link>
      </div>
    )}
  </>;
}
