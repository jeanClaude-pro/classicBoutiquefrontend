// Reports by category (All / Clothes / Shoes) and the server-checked security
// rules: Reports password confirmation, start-up session check, sign-out.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import shareholderAnalytics from "./fixtures/shareholderAnalytics.json";
import { API, confirmReportsPassword, mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Analytics from "../src/pages/analytics/Analytics";
import { RequireAuth } from "../src/components/RequireAuth";
import { logoutSession, PENDING_LOGOUT_KEY, retryPendingLogout } from "../src/services/authService";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const series = (category: string | null) => ({
  success: true, source: "mongodb-aggregation", paginated: false, granularity: "day",
  categories: category ? [category] : ["CLOTHES", "SHOES"], series: [],
  totals: { revenue: 0, grossProfit: 0, netResult: 0, revenueFC: 0, grossProfitFC: 0, netResultFC: 0, sales: 0 },
});

/** Superadmin summary as the server builds it, for the whole shop or one category. */
function summary(category: string | null) {
  const breakdown = shareholderAnalytics.data.categoryBreakdown.SHOES;
  return {
    ...shareholderAnalytics,
    scope: { category: category || "ALL", shopWideIncluded: !category },
    data: {
      ...shareholderAnalytics.data,
      assignedCategory: undefined,
      totalRevenue: category === "SHOES" ? 50 : 125,
      totalEntries: category ? 0 : 300,
      entriesIncluded: !category,
      totalValidatedExpenses: 0,
      netRevenue: category === "SHOES" ? 50 : 425,
      totalCustomers: 0,
      totalProducts: 1,
      topCustomers: [],
      categoryBreakdown: category ? { [category]: { ...breakdown, category } } : { CLOTHES: { ...breakdown, category: "CLOTHES" }, SHOES: breakdown },
      recentTrends: { salesGrowth: null, revenueGrowth: null, customerGrowth: null },
      ...(category ? {} : { reimbursement: { borrowedDuringPeriod: 0, repaidDuringPeriod: 0, repaymentCount: 0, currentOutstanding: 900 } }),
    },
  };
}

const reportsApi = () => mockApi([
  { match: /^\/analytics\/summary\?/, reply: ({ url }) => ({ body: summary(new URL(url).searchParams.get("category")) }) },
  { match: /^\/analytics\/timeseries\?/, reply: ({ url }) => ({ body: series(new URL(url).searchParams.get("category")) }) },
  { match: /^\/settings\/receipt/, reply: { body: {} } },
]);

test("the superadmin restricts the whole Reports page to one category", async () => {
  signIn({ role: "superadmin" });
  confirmReportsPassword();
  const api = reportsApi();
  const user = userEvent.setup();
  renderPage(<Analytics />, "/reports");

  // Whole shop: money-in entries and debts are shown.
  expect(await screen.findByText("Entrées d'Argent")).toBeInTheDocument();
  expect(screen.getByText("Dettes et remboursements")).toBeInTheDocument();
  const selector = screen.getByRole("group", { name: "Catégorie du rapport" });
  expect(within(selector).getByRole("button", { name: "Toutes" })).toHaveAttribute("aria-pressed", "true");

  await user.click(within(selector).getByRole("button", { name: "Chaussures" }));

  // Every request of the page now carries the category...
  await waitFor(() => {
    const last = (pattern: RegExp) => api.calls.filter((call) => pattern.test(call.url)).at(-1)!;
    expect(new URL(last(/\/analytics\/summary\?/).url).searchParams.get("category")).toBe("SHOES");
    expect(new URL(last(/\/analytics\/timeseries\?/).url).searchParams.get("category")).toBe("SHOES");
  });
  expect(within(selector).getByRole("button", { name: "Chaussures" })).toHaveAttribute("aria-pressed", "true");
  // ...and the page explains what a category view cannot contain.
  expect(await screen.findByText(/elles ne sont affichées que dans la vue « Toutes »/)).toBeInTheDocument();
  expect(screen.queryByText("Entrées d'Argent")).not.toBeInTheDocument();
  expect(screen.queryByText("Dettes et remboursements")).not.toBeInTheDocument();
  expect(screen.getByText("Catégorie analysée")).toBeInTheDocument();
  // The CLOTHES shareholder card disappears; the SHOES one stays.
  expect(screen.queryByText(/Actionnaire vêtements/)).not.toBeInTheDocument();
  // The chart follows the page: no second category switch.
  expect(screen.queryByRole("group", { name: "Catégorie" })).not.toBeInTheDocument();
  // The products-sold sheet opens on the same category.
  expect(screen.getByRole("link", { name: /Ouvrir la fiche des ventes/ })).toHaveAttribute("href", "/reports/products-sold?category=SHOES");
  // The PDF cannot include shop-wide entries.
  const entries = screen.getByRole("checkbox", { name: /Rapport d'Entrées/ });
  expect(entries).toBeDisabled();
  expect(entries).not.toBeChecked();
});

test("the Reports password is checked by the server and never opens a second session", async () => {
  signIn({ role: "superadmin" });
  let attempts = 0;
  const api = mockApi([
    { method: "POST", match: /^\/auth\/reauth$/, reply: ({ body }) => {
      attempts += 1;
      return (body as { password: string }).password === "bon-mot-de-passe"
        ? { body: { reauthToken: "proof-1", expiresAt: new Date(Date.now() + 900_000).toISOString() } }
        : { status: 403, body: { error: "REAUTH_INVALID", code: "REAUTH_INVALID", message: "Mot de passe incorrect" } };
    } },
    { match: /^\/analytics\/summary\?/, reply: { body: summary(null) } },
    { match: /^\/analytics\/timeseries\?/, reply: { body: series(null) } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  const user = userEvent.setup();
  renderPage(<Analytics />, "/reports");

  const field = await screen.findByLabelText("Mot de passe administrateur");
  // Nothing is requested from the reports API before the confirmation.
  expect(api.calls.some((call) => call.url.includes("/analytics/"))).toBe(false);
  await user.type(field, "mauvais");
  await user.click(screen.getByRole("button", { name: "Accéder" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Mot de passe incorrect");
  // A wrong password is not treated as an expired session.
  expect(localStorage.getItem("token")).not.toBeNull();

  await user.type(screen.getByLabelText("Mot de passe administrateur"), "bon-mot-de-passe");
  await user.click(screen.getByRole("button", { name: "Accéder" }));
  expect(await screen.findByText("Entrées d'Argent")).toBeInTheDocument();
  expect(attempts).toBe(2);
  expect(api.calls.some((call) => call.url.endsWith("/auth/login"))).toBe(false);

  // The proof travels with every reports request.
  const fetchMock = vi.mocked(fetch);
  const summaryCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/analytics/summary"))!;
  expect((summaryCall[1]?.headers as Record<string, string>)["X-Reauth-Token"]).toBe("proof-1");
});

test("an expired confirmation brings the password screen back", async () => {
  signIn({ role: "superadmin" });
  confirmReportsPassword();
  mockApi([
    { match: /^\/analytics\/summary\?/, reply: { status: 403, body: { error: "REAUTH_REQUIRED", code: "REAUTH_REQUIRED", message: "Confirmez votre mot de passe" } } },
    { match: /^\/analytics\/timeseries\?/, reply: { body: series(null) } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  renderPage(<Analytics />, "/reports");
  expect(await screen.findByLabelText("Mot de passe administrateur")).toBeInTheDocument();
});

test("the role stored in the browser is replaced by the server's answer", async () => {
  // Someone edited localStorage to look like the superadmin.
  signIn({ role: "superadmin" });
  mockApi([
    { match: /^\/auth\/session$/, reply: { body: { user: { id: "u-self", username: "caissier", email: "t@test.local", role: "staff", permissions: ["/"] } } } },
  ]);
  renderPage(<Routes><Route path="/admin" element={<RequireAuth><p>Panneau admin</p></RequireAuth>} /></Routes>, "/admin");
  await waitFor(() => expect(JSON.parse(localStorage.getItem("user")!).role).toBe("staff"));
});

test("a session the server refuses is ended at start-up", async () => {
  signIn({ role: "superadmin" });
  mockApi([{ match: /^\/auth\/session$/, reply: { status: 401, body: { code: "SESSION_REVOKED", message: "Authentication required" } } }]);
  renderPage(<Routes><Route path="/" element={<RequireAuth><p>Caisse</p></RequireAuth>} /></Routes>, "/");
  await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
  expect(screen.queryByText("Caisse")).not.toBeInTheDocument();
});

test("without the server, a stored session only opens the till until it is confirmed", async () => {
  signIn({ role: "superadmin" });
  mockApi([{ match: /^\/auth\/session$/, reply: { networkError: true } }]);
  renderPage(<Routes><Route path="/reports" element={<RequireAuth><p>Rapports</p></RequireAuth>} /></Routes>, "/reports");
  expect(await screen.findByText("Session non vérifiée")).toBeInTheDocument();
  expect(screen.queryByText("Rapports")).not.toBeInTheDocument();
});

test("a sign-out that cannot reach the server is finished on the next connection", async () => {
  localStorage.setItem("token", "session-token");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
  expect(await logoutSession()).toBe(false);
  expect(localStorage.getItem(PENDING_LOGOUT_KEY)).toBe("session-token");

  const revoke = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
  vi.stubGlobal("fetch", revoke);
  await retryPendingLogout();
  expect(revoke).toHaveBeenCalledWith(`${API}/auth/logout`, expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer session-token" } }));
  expect(localStorage.getItem(PENDING_LOGOUT_KEY)).toBeNull();
});
