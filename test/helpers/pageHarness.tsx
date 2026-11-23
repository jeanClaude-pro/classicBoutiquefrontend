import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { vi } from "vitest";
import { AuthProvider } from "../../src/context/AuthProvider";

export const API = "https://api.test.invalid/api";

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** A structurally valid, non-expired JWT (the client only reads `exp`). */
export function fakeJwt(): string {
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url({ id: "u1", exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

/** A signed-in browser: the server holds the session (httpOnly cookie, never
 *  visible to page code); the device only keeps a display copy of the user. */
export function signIn(user: Record<string, unknown>): void {
  localStorage.setItem("user", JSON.stringify({ id: "u-self", username: "tester", email: "t@test.local", permissions: [], ...user }));
  localStorage.setItem("sessionExpiresAt", new Date(Date.now() + 3600_000).toISOString());
}

/** The superadmin confirmed the Reports password: the server answers as if
 *  its httpOnly proof cookie were present (POST /auth/reauth succeeds). */
export async function confirmReportsPassword(): Promise<void> {
  const { confirmPassword } = await import("../../src/lib/reportsReauth");
  const previous = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ confirmed: true, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
  try { await confirmPassword("test-password"); } finally { globalThis.fetch = previous; }
}

type Handler = (request: { method: string; url: string; body: unknown }) => { status?: number; body?: unknown; networkError?: boolean };
export interface Route { method?: string; match: RegExp; reply: Handler | { status?: number; body?: unknown } }

/** Routes fetch by method + URL; unmatched requests answer 404 and are recorded. */
export function mockApi(routes: Route[]) {
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  const unmatched: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    let body: unknown = undefined;
    try { body = init?.body ? JSON.parse(String(init.body)) : undefined; } catch { body = init?.body; }
    const request = { method, url, body };
    calls.push(request);
    const route = routes.find((candidate) => (candidate.method || "GET") === method && candidate.match.test(url.replace(API, "")));
    // The app confirms the signed-in session with the server at start-up.
    // Unless a test mocks it, the server confirms the user signed in by signIn().
    if (!route && method === "GET" && url.replace(API, "") === "/auth/session") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const expiresAt = localStorage.getItem("sessionExpiresAt");
      return new Response(JSON.stringify(user ? { user, expiresAt } : { message: "Authentication required" }), { status: user ? 200 : 401, headers: { "Content-Type": "application/json" } });
    }
    if (!route) {
      unmatched.push(`${method} ${url.replace(API, "")}`);
      return new Response(JSON.stringify({ error: "Not mocked" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    const reply = typeof route.reply === "function" ? route.reply(request) : route.reply;
    if ("networkError" in reply && reply.networkError) throw new TypeError("Failed to fetch");
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, unmatched, fetchMock };
}

export function renderPage(ui: ReactElement, path = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        {ui}
        <ToastContainer />
      </MemoryRouter>
    </AuthProvider>,
  );
}
