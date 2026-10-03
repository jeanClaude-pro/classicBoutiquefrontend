/**
 * Automatic sign-out of an unattended POS terminal.
 *
 * Activity (pointer, keyboard, touch, wheel) is recorded in localStorage so
 * every tab of the same browser shares one idle clock. After the configured
 * idle time (VITE_IDLE_TIMEOUT_MINUTES, default 20) the session ends.
 *
 * A sale in progress (a non-empty POS cart) places a hold: the sign-out is
 * deferred so a cashier who steps away briefly does not lose the cart, but
 * never beyond MAX_HOLD_MINUTES of inactivity, so a terminal left with a cart
 * open still locks eventually.
 */

export const LAST_ACTIVITY_KEY = "lastActivityAt";
export const DEFAULT_IDLE_MINUTES = 20;
export const MAX_HOLD_MINUTES = 60;
const CHECK_INTERVAL_MS = 15_000;
const WRITE_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/** Idle timeout in ms from the build-time setting (1–480 minutes). */
export function idleTimeoutMs(rawMinutes: unknown = readConfiguredMinutes()): number {
  const minutes = Number(rawMinutes);
  const valid = Number.isFinite(minutes) && minutes >= 1 ? Math.min(minutes, 480) : DEFAULT_IDLE_MINUTES;
  return valid * 60_000;
}

function readConfiguredMinutes(): unknown {
  try {
    return (import.meta as { env?: Record<string, unknown> }).env?.VITE_IDLE_TIMEOUT_MINUTES;
  } catch {
    return undefined;
  }
}

/** Pure decision used by the timer (and by tests). */
export function shouldSignOut({ now, lastActivity, timeoutMs, holding }: {
  now: number; lastActivity: number; timeoutMs: number; holding: boolean;
}): boolean {
  const idle = now - lastActivity;
  if (idle < timeoutMs) return false;
  if (holding && idle < Math.max(timeoutMs, MAX_HOLD_MINUTES * 60_000)) return false;
  return true;
}

const holds = new Set<string>();

/** Marks (or clears) work in progress that defers the idle sign-out. */
export function setActivityHold(id: string, active: boolean): void {
  if (active) holds.add(id);
  else holds.delete(id);
}

export function hasActivityHold(): boolean {
  return holds.size > 0;
}

function readSharedActivity(): number {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeSharedActivity(at: number): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    // Storage unavailable: the in-memory clock of this tab still applies.
  }
}

/**
 * Starts watching for inactivity; calls onIdle once when the session should
 * end. Returns a function that stops the watcher.
 */
export function startIdleTimer(onIdle: () => void, timeoutMs: number = idleTimeoutMs()): () => void {
  let lastActivity = Date.now();
  let lastWrite = 0;
  let fired = false;
  writeSharedActivity(lastActivity);

  const onActivity = () => {
    lastActivity = Date.now();
    if (lastActivity - lastWrite >= WRITE_THROTTLE_MS) {
      lastWrite = lastActivity;
      writeSharedActivity(lastActivity);
    }
  };

  const check = () => {
    if (fired) return;
    const latest = Math.max(lastActivity, readSharedActivity());
    if (shouldSignOut({ now: Date.now(), lastActivity: latest, timeoutMs, holding: hasActivityHold() })) {
      fired = true;
      onIdle();
    }
  };

  for (const event of ACTIVITY_EVENTS) window.addEventListener(event, onActivity, { passive: true });
  // A tab brought back to the foreground is checked immediately.
  document.addEventListener("visibilitychange", check);
  const interval = window.setInterval(check, CHECK_INTERVAL_MS);

  return () => {
    for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity);
    document.removeEventListener("visibilitychange", check);
    window.clearInterval(interval);
  };
}
