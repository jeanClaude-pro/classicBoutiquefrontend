import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SalesHistory from "../src/pages/history/SalesHistory";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";

const now = new Date().toISOString();
const completed = {
  _id: "completed-1",
  saleId: "SALE-COMPLETED",
  customer: { name: "Client actif", phone: "", email: "" },
  items: [{ _id: "line-1", productId: "p1", name: "Chemise", quantity: 2, price: 20, total: 40 }],
  subtotal: 40,
  total: 40,
  paymentMethod: "cash",
  status: "completed",
  type: "sale",
  createdAt: now,
  updatedAt: now,
};
const voided = {
  ...completed,
  _id: "voided-1",
  saleId: "SALE-VOIDED",
  customer: { name: "Client annulé", phone: "0990000000", email: "" },
  status: "voided",
  voidedAt: now,
  editHistory: [{ reason: "Erreur de saisie" }],
};

const response = (data: unknown[]) => ({
  success: true,
  data,
  pagination: { page: 1, limit: 50, totalRecords: data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  timeframe: { description: "Today (default)", start: now, end: now, query: {} },
  summary: { totalRecords: data.length, revenue: 40, expenses: 0, net: 40, salesCount: 1, expensesCount: 0 },
  filtersApplied: {},
});

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("completed history excludes voided sales and opens them from the separate archive", async () => {
  signIn({ role: "superadmin", username: "admin" });
  const api = mockApi([
    {
      match: /^\/sales\?/,
      reply: ({ url }) => ({ body: response(new URL(url).searchParams.get("status") === "voided" ? [voided] : [completed, voided]) }),
    },
    { match: /^\/products/, reply: { body: [] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);

  const user = userEvent.setup();
  renderPage(<SalesHistory />, "/sales");

  expect(await screen.findByText("SALE-COMPLETED")).toBeInTheDocument();
  expect(screen.queryByText("SALE-VOIDED")).not.toBeInTheDocument();
  expect(api.calls.some((call) => /[?&]status=completed(?:&|$)/.test(call.url))).toBe(true);

  await user.click(screen.getByRole("button", { name: "Voir les ventes annulées" }));
  const dialog = await screen.findByRole("dialog", { name: "Ventes annulées" });
  expect(await within(dialog).findByText("SALE-VOIDED")).toBeInTheDocument();
  expect(within(dialog).queryByText("SALE-COMPLETED")).not.toBeInTheDocument();
  expect(api.calls.some((call) => /[?&]status=voided(?:&|$)/.test(call.url))).toBe(true);

  await user.click(within(dialog).getByRole("button", { name: "Afficher les détails de la vente annulée SALE-VOIDED" }));
  expect(within(dialog).getByText(/Erreur de saisie/)).toBeInTheDocument();
});
