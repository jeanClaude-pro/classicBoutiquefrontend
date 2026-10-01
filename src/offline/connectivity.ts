import { serverUrl } from "../utils/constants";
import type { ConnectivityState } from "./types";

type Listener = (state: ConnectivityState) => void;
let state: ConnectivityState = navigator.onLine ? "checking" : "offline";
let lastCheck = 0;
let inFlight: Promise<boolean> | null = null;
const listeners = new Set<Listener>();

function publish(next: ConnectivityState) {
  state = next;
  listeners.forEach((listener) => listener(next));
  window.dispatchEvent(new CustomEvent("connectivity:change", { detail: next }));
}

export function connectivityState(): ConnectivityState { return state; }
export function subscribeConnectivity(listener: Listener): () => void {
  listeners.add(listener); listener(state); return () => listeners.delete(listener);
}

export async function checkApiReachability(force = false): Promise<boolean> {
  if (!navigator.onLine) { publish("offline"); return false; }
  if (!force && Date.now() - lastCheck < 15_000) return state === "online";
  if (inFlight) return inFlight;
  // Only an unknown state shows "checking"; periodic re-checks keep the last
  // known state on screen instead of flickering every interval.
  if (state === "checking") publish("checking");
  inFlight = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(`${serverUrl}/health`, { cache: "no-store", signal: controller.signal });
      const reachable = response.ok;
      publish(reachable ? "online" : "offline");
      return reachable;
    } catch {
      publish("offline"); return false;
    } finally {
      clearTimeout(timeout); lastCheck = Date.now(); inFlight = null;
    }
  })();
  return inFlight;
}

export function startConnectivityMonitor(): () => void {
  const check = () => { void checkApiReachability(true); };
  window.addEventListener("online", check);
  window.addEventListener("offline", check);
  const timer = window.setInterval(check, 30_000);
  check();
  return () => { window.removeEventListener("online", check); window.removeEventListener("offline", check); clearInterval(timer); };
}
