// Interaction flows fixed during the runtime audit: each one used to leave the
// user without feedback, with a misleading success, or with a hidden record.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import SalesHistory from "../src/pages/history/SalesHistory";
import SortieHistory from "../src/pages/SortieHistory";
import AdminPanel from "../src/pages/admin/AdminPanel";
import NewSale from "../src/pages/NewSale";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(window, "open").mockReturnValue(null);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const now = new Date().toISOString();
const page = (data: unknown[], summary: Record<string, unknown>, description = "Today (default)") => ({
  success: true, data,
  pagination: { page: 1, limit: 50, totalRecords: data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  timeframe: { description, start: now, end: now, query: {} },
  summary, filtersApplied: {},
});

test("Historique des ventes: a legacy sale without customer data stays listed, in French", async () => {
  signIn({ role: "superadmin" });
  const legacy = { _id: "s-old", saleId: "SALE-LEGACY-2", items: [{ productId: "p1", name: "Article supprimé", quantity: 1, price: 12, total: 12 }], total: 12, subtotal: 12, paymentMethod: "other", status: "completed", type: "sale", createdAt: now, updatedAt: now };
  mockApi([
    { match: /^\/sales\?/, reply: { body: page([legacy], { totalRecords: 1, revenue: 12, expenses: 0, net: 12, salesCount: 1, expensesCount: 0 }, "Month: 2026-09") } },
    { match: /^\/products/, reply: { body: [] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  renderPage(<SalesHistory />, "/sales");
  expect(await screen.findByText("SALE-LEGACY-2")).toBeInTheDocument();
  expect(screen.getByText("Client non renseigné")).toBeInTheDocument();
  expect(screen.getByText("Autre")).toBeInTheDocument();
  expect(screen.getByText("Terminée")).toBeInTheDocument();
  expect(screen.getByText(/Toutes les ventes - Septembre 2026/)).toBeInTheDocument();
  expect(screen.queryByText(/Month:|Show Filters|Summary Statistics/)).not.toBeInTheDocument();
});

const pendingExpense = { _id: "e1", expenseId: "EXP-1", reason: "Transport", recipientName: "Taxi", recipientPhone: "099", amount: 20, amountUSD: 20, paymentMethod: "cash", status: "pending", recordedBy: "u-self", createdAt: now, updatedAt: now, expenseType: "COMPANY_EXPENSE", category: "CLOTHES" };
const expensePage = (data: unknown[]) => page(data, { totalRecords: data.length, totalAmount: 20, pending: { count: 1, amount: 20 }, validated: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 } });

test("Historique des décaissements: a failed edit is explained inside the dialog, which stays usable", async () => {
  signIn({ role: "superadmin" });
  let attempts = 0;
  const api = mockApi([
    { match: /^\/expenses\/permissions\/me/, reply: { body: { canValidate: true, isAdmin: true, canEditAll: true, canDeleteAll: true, userId: "u-self" } } },
    { match: /^\/expenses\?/, reply: { body: expensePage([pendingExpense]) } },
    { method: "PUT", match: /^\/expenses\/e1$/, reply: () => (++attempts === 1
      ? { status: 409, body: { message: "Expense status changed; refresh and retry" } }
      : { body: { ...pendingExpense, reason: "Transport client" } }) },
  ]);
  const user = userEvent.setup();
  renderPage(<SortieHistory />, "/sortiehistory");
  await user.click(await screen.findByTitle("Modifier le décaissement"));
  const reason = screen.getByLabelText(/Motif du décaissement/);
  await user.clear(reason);
  await user.type(reason, "Transport client");
  await user.click(screen.getByRole("button", { name: /Enregistrer les modifications/ }));

  // The error is visible inside the dialog (the page banner sits behind its overlay).
  const heading = screen.getByRole("heading", { name: "Modifier le décaissement" });
  const dialogBody = heading.closest("div.bg-white") as HTMLElement;
  expect(await within(dialogBody).findByRole("alert")).toHaveTextContent("Cette opération a été modifiée entre-temps");
  // The list was refreshed after the conflict and the dialog can be retried.
  await waitFor(() => expect(api.calls.filter((call) => /\/expenses\?/.test(call.url)).length).toBeGreaterThanOrEqual(2));
  await user.click(within(dialogBody).getByRole("button", { name: /Enregistrer les modifications/ }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Modifier le décaissement" })).not.toBeInTheDocument());
  expect((await screen.findAllByText("Modification enregistrée avec succès.")).length).toBeGreaterThan(0);
  expect(screen.getByText("Transport client")).toBeInTheDocument();
});

const accounts = [
  { _id: "u-self", username: "tester", email: "t@test.local", role: "superadmin", isActive: true, permissions: [], createdAt: now },
  { _id: "u2", username: "awa", email: "a@test.local", role: "manager", isActive: true, permissions: ["/sales"], createdAt: now },
];

test("Administration: a role change is confirmed first; cancelling changes nothing", async () => {
  signIn({ role: "superadmin", id: "u-self" });
  const api = mockApi([
    { match: /^\/users$/, reply: { body: accounts } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PUT", match: /^\/users\/u2\/role$/, reply: { body: { ...accounts[1], role: "inventory_manager" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<AdminPanel />, "/admin");
  // The same role names as the navigation (config/roles.ts).
  await user.click(await screen.findByRole("button", { name: /^Responsable/ }));
  await user.selectOptions(screen.getByRole("combobox", { name: "" }), "inventory_manager");
  let dialog = screen.getByRole("alertdialog", { name: "Changer le rôle de ce compte ?" });
  expect(dialog).toHaveTextContent("« awa » passera de « Responsable » à « Gestionnaire de stock ».");
  await user.click(within(dialog).getByRole("button", { name: "Annuler" }));
  expect(api.calls.some((call) => call.method === "PUT")).toBe(false);
  expect(screen.getByRole("button", { name: /^Responsable/ })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Responsable/ }));
  await user.selectOptions(screen.getByRole("combobox", { name: "" }), "inventory_manager");
  dialog = screen.getByRole("alertdialog", { name: "Changer le rôle de ce compte ?" });
  await user.click(within(dialog).getByRole("button", { name: "Changer le rôle" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(api.calls.find((call) => call.method === "PUT")?.body).toEqual({ role: "inventory_manager" });
  expect(await screen.findByRole("button", { name: /^Gestionnaire de stock/ })).toBeInTheDocument();
});

test("Administration: a refused permission reset reports the error, never a success", async () => {
  signIn({ role: "superadmin", id: "u-self" });
  mockApi([
    { match: /^\/users$/, reply: { body: accounts } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PUT", match: /^\/users\/u2\/permissions$/, reply: { status: 403, body: { message: "Access denied. Superadmin role required." } } },
  ]);
  const user = userEvent.setup();
  renderPage(<AdminPanel />, "/admin");
  await screen.findByText("awa");
  const row = screen.getByText("awa").closest("tr") as HTMLElement;
  await user.click(within(row).getByTitle("Gérer les permissions"));
  await user.click(await screen.findByRole("button", { name: /Réinitialiser au rôle/ }));
  expect(await screen.findByText("Vous n'avez pas l'autorisation d'effectuer cette opération.")).toBeInTheDocument();
  expect(screen.queryByText("Permissions réinitialisées au rôle par défaut")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
});

const product = { _id: "p1", name: "Chemise Oxford", category: "Chemises", mainCategory: "CLOTHES", price: 25, unitCost: 12, stock: 5, minStock: 1, status: "active" };

async function fillWalkInSale(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByPlaceholderText("Rechercher un article..."), "Chemise");
  await user.click(await screen.findByText("Chemise Oxford", { selector: "div *" }));
  await user.type(screen.getByPlaceholderText("Entrer le nombre de pièces"), "1");
  const fcPrice = screen.queryByPlaceholderText("Entrer le prix en FC");
  if (fcPrice) await user.type(fcPrice, "71250");
  await user.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
}

function posApi(saleReply: Parameters<typeof mockApi>[0][number]["reply"]) {
  return mockApi([
    { match: /^\/products/, reply: { body: [product] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "POST", match: /^\/print\//, reply: { body: { success: true } } },
    { method: "POST", match: /^\/sales$/, reply: saleReply },
  ]);
}

test("Point de vente: a double click records exactly one sale", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = posApi({ status: 201, body: { _id: "s1", saleId: "SALE-1" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await fillWalkInSale(user);
  await user.dblClick(screen.getByRole("button", { name: "Enregistrer la vente" }));
  expect((await screen.findAllByText("Vente enregistrée avec succès.")).length).toBeGreaterThan(0);
  expect(api.calls.filter((call) => call.method === "POST" && /\/sales$/.test(call.url))).toHaveLength(1);
});

test("Point de vente: a stock conflict is explained in French and the cart is kept", async () => {
  signIn({ role: "superadmin", username: "tester" });
  posApi({ status: 409, body: { message: "Insufficient stock for Chemise Oxford. Available: 0" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await fillWalkInSale(user);
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  expect(await screen.findByText(/Stock insuffisant pour Chemise Oxford \(disponible : 0\)/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer la vente" })).toBeEnabled();
  expect(screen.getByRole("heading", { name: "Point de vente" })).toBeInTheDocument();
});
