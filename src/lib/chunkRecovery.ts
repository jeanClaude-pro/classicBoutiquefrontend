// After a deployment, a tab still running the previous build can request a
// route chunk that no longer exists. The import then fails (or the SPA
// fallback returns HTML instead of JavaScript). A single guarded reload
// fetches the new build; the guard prevents any reload loop.

const CHUNK_ERROR = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|loading (css )?chunk [\w-]+ failed|expected a javascript(-or-wasm)? module script|is not a valid javascript mime type|unable to preload css/i;

export const CHUNK_RELOAD_KEY = "app:chunk-reload-at";
export const CHUNK_RELOAD_WINDOW_MS = 60_000;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return CHUNK_ERROR.test(text);
}

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

/** True at most once per window; records the attempt so a reload cannot loop. */
export function claimChunkReload(storage: StorageLike | null, now = Date.now(), windowMs = CHUNK_RELOAD_WINDOW_MS): boolean {
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Number.isFinite(last) && now - last < windowMs) return false;
    storage.setItem(CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

/** Reloads the page once to pick up the new build. Returns false when the guard blocks it. */
export function reloadForNewVersion(): boolean {
  const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;
  if (!claimChunkReload(storage)) return false;
  window.location.reload();
  return true;
}
