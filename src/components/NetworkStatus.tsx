import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "../hooks/useAuth";
import { connectivityState, subscribeConnectivity } from "../offline/connectivity";
import { offlineDb } from "../offline/db";

export default function NetworkStatus() {
  const { user, offline: offlineSession } = useAuth();
  const [state, setState] = useState(connectivityState);
  const { t } = useTranslation();
  useEffect(() => subscribeConnectivity(setState), []);
  const pending = useLiveQuery(() => user ? offlineDb.sales.where("ownerUserId").equals(user.id).filter((sale) => sale.syncStatus !== "SYNCED").count() : Promise.resolve(0), [user?.id], 0);
  const online = state === "online";
  return <Link to="/offline-sales" className={`network-status ${online ? "is-online" : "is-offline"}`} role="status" aria-live="polite">
    {state === "checking" ? <RefreshCw className="animate-spin" aria-hidden="true" /> : online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
    <span>{offlineSession ? t("offline.session") : state === "checking" ? t("offline.checking") : online ? t("system.online") : t("system.offlineShort")}{pending > 0 ? ` · ${t("offline.pending", { count: pending })}` : ""}</span>
  </Link>;
}
