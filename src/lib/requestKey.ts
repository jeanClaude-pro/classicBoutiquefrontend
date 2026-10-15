/**
 * One key per user action that records money (sale, entry, expense, loan).
 * The same key is sent on every retry of that action, so a request that
 * reached the server before the connection dropped is returned as already
 * recorded instead of being recorded a second time.
 */
export const newRequestKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
