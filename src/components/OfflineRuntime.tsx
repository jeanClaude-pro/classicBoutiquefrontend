import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { startConnectivityMonitor, subscribeConnectivity } from "../offline/connectivity";
import { synchronizeSales } from "../offline/syncManager";
import { fetchMe } from "../services/authService";
import { disableOfflineAccess, renewOfflineAuthorization } from "../offline/offlineAuth";
import { toApiError } from "../lib/apiError";
import { OFFLINE_SESSION_KEY } from "../lib/sessionManager";
import type { ConnectivityState } from "../offline/types";

const RECONNECTED_TOAST_ID = "offline-session-reconnected";

function offlineSessionExpired(): boolean {
  try {
    const saved = JSON.parse(sessionStorage.getItem(OFFLINE_SESSION_KEY) || "null") as { expiresAt?: string } | null;
    return !saved?.expiresAt || new Date(saved.expiresAt).getTime() <= Date.now();
  } catch {
    return true;
  }
}

/**
 * The single owner of connectivity monitoring, account revalidation and
 * queue synchronization. Pages never start a sync loop themselves (the
 * offline sales page only asks for a manual retry through the same lock).
 */
export function OfflineRuntime() {
  const { user, token, offline, clearAuth } = useAuth();
  const { t } = useTranslation();
  const previous = useRef<ConnectivityState | null>(null);

  useEffect(() => startConnectivityMonitor(), []);

  // Revalidate the account against the server, then drain the queue. Runs on
  // a fresh online session and every time the API becomes reachable again.
  const revalidate = useRef<() => void>(() => undefined);
  revalidate.current = () => {
    if (!user || !token || offline) return;
    void fetchMe()
      .then(async (me) => {
        const current = { ...user, ...me, id: user.id };
        if (me.isActive === false) {
          await disableOfflineAccess(user.id);
          clearAuth();
          return;
        }
        // Role, scope and permissions refreshed from the server; the offline
        // authorization window restarts from this trusted check.
        await renewOfflineAuthorization(current);
        await synchronizeSales(user.id, token);
      })
      .catch((error) => {
        // 401 is handled by the global interceptor (session invalidated).
        if (toApiError(error).status === 403) void disableOfflineAccess(user.id).then(() => clearAuth());
      });
  };

  useEffect(() => {
    if (user && token && !offline) revalidate.current();
  }, [user?.id, token, offline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => subscribeConnectivity((state) => {
    const wasOnline = previous.current === "online";
    const reconnected = previous.current === "offline" && state === "online";
    previous.current = state;
    if (offline) {
      if (offlineSessionExpired()) { clearAuth(); return; }
      if (state === "online" && !wasOnline) {
        // Queued sales can only be synchronized under a real server session.
        toast.info(
          <div className="space-y-2">
            <p>{t("offline.reconnected")}</p>
            <button
              type="button"
              className="ui-button ui-button--primary ui-button--sm"
              onClick={() => { toast.dismiss(RECONNECTED_TOAST_ID); clearAuth(); }}
            >
              {t("offline.signInOnline")}
            </button>
          </div>,
          { toastId: RECONNECTED_TOAST_ID, autoClose: false, closeOnClick: false },
        );
      }
      return;
    }
    if (state !== "online" || !user || !token) return;
    // Boot is covered by the session effect above; a real reconnection
    // revalidates the account first, a routine check just drains the queue.
    if (reconnected) revalidate.current();
    else void synchronizeSales(user.id, token).catch(() => undefined);
  }), [user, token, offline, clearAuth, t]);

  return null;
}
