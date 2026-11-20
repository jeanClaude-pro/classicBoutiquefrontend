import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { startConnectivityMonitor, subscribeConnectivity } from "../offline/connectivity";
import { synchronizeSales } from "../offline/syncManager";
import { retryPendingLogout } from "../services/authService";
import type { ConnectivityState } from "../offline/types";

/**
 * The single owner of connectivity monitoring, session revalidation and
 * queue synchronization. Pages never start a sync loop themselves (the
 * offline sales page only asks for a manual retry through the same lock).
 */
export function OfflineRuntime() {
  const { user, token, offline, verifySession } = useAuth();
  const previous = useRef<ConnectivityState | null>(null);

  useEffect(() => startConnectivityMonitor(), []);

  // A server-confirmed session drains this cashier's queue (start-up, login).
  useEffect(() => {
    if (user && token && !offline) void synchronizeSales(user.id, token).catch(() => undefined);
  }, [user?.id, token, offline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => subscribeConnectivity((state) => {
    const reconnected = previous.current === "offline" && state === "online";
    previous.current = state;
    if (state !== "online") return;
    if (reconnected) void retryPendingLogout();
    if (!token || !user) return;
    // Back online: the server confirms the session again (role, permissions,
    // disabled account...) before the queue is sent. A session that was never
    // confirmed is confirmed now.
    if (reconnected || offline) {
      void verifySession().then((result) => {
        if (result === "verified") void synchronizeSales(user.id, token).catch(() => undefined);
      });
      return;
    }
    void synchronizeSales(user.id, token).catch(() => undefined);
  }), [user, token, offline, verifySession]);

  return null;
}
