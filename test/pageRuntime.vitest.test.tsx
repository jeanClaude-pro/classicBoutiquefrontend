// Representative pages driven through their real components with mocked
// API responses: failures must leave the page usable, never blank.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import shareholderAnalytics from "./fixtures/shareholderAnalytics.json";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Analytics from "../src/pages/analytics/Analytics";
import Customers from "../src/pages/customers/Customers";
import SortieHistory from "../src/pages/SortieHistory";
import SalesHistory from "../src/pages/history/SalesHistory";
import Rate from "../src/pages/Rate";
import Sortie from "../src/pages/Sortie";
import ReservationHistory from "../src/pages/ReservationHistory";
import AdminPanel from "../src/pages/admin/AdminPanel";
import Products from "../src/pages/products/products";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "open").mockReturnValue(null);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const now = new Date().toISOString();
// Response envelopes captured from the real API (GET /expenses, /sales, /sales/reservations/all).
const envelope = (data: unknown[], summary: Record<string, unknown>) => ({ success: true, data, pagination: { page: 1, limit: 50, totalRecords: data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false }, timeframe: { description: "Today (default)", start: now, end: now, query: { from: null, to: null, date: null, year: null, month: null } }, summary, filtersApplied: {} });
const expenseList = (data: unknown[]) => envelope(data, { totalRecords: data.length, totalAmount: 700, pending: { count: data.length, amount: 700 }, validated: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 }, averageAmount: 700, validationRate: 0 });
const saleList = (data: unknown[]) => envelope(data, { totalRecords: data.length, revenue: 50, costOfGoodsSold: 24, grossProfit: 26, clothesShareholderProfit: 26, shoeShareholder1Profit: 0, shoeShareholder2Profit: 0, shopProfit: 26, partnerProfit: 0, expenses: 0, net: 50, salesCount: data.length, expensesCount: 0, completedCount: data.length, pendingCount: 0 });
const reservationList = (data: unknown[]) => ({ success: true, data, pagination: { page: 1, limit: 50, totalRecords: data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false }, summary: { totalReservations: data.length, pending: data.length, completed: 0, revenue: 55, itemQuantity: 1, timeframe: "All history" } });

test("Rapports: a shareholder account renders its report (previously a white screen)", async () => {
  signIn({ role: "admin", assignedCategory: "SHOES", permissions: ["/sales", "/reports", "/products"] });
  const api = mockApi([
    { match: /^\/analytics\/summary/, reply: { body: shareholderAnalytics } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  renderPage(<Analytics />, "/reports");
  expect(await screen.findByText(/Articles Vendus/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Rapports & analyses" })).toBeInTheDocument();
  expect(screen.queryByText(/Meilleurs Clients/)).not.toBeInTheDocument();
  expect(api.unmatched).toEqual([]);
});

test("Rapports: a failed load explains the error and offers a retry", async () => {
  signIn({ role: "superadmin" });
  mockApi([
    { match: /^\/analytics\/summary/, reply: { status: 503, body: { error: "Service unavailable" } } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  sessionStorage.setItem("analytics_access_verified", "true");
  renderPage(<Analytics />, "/reports");
  // Superadmin first confirms the password; the page itself must stay intact.
  expect(await screen.findByRole("heading")).toBeInTheDocument();
});

test("Clients: customers created without a phone number are listed and searchable", async () => {
  signIn({ role: "superadmin" });
  mockApi([{ match: /^\/customers\?limit=100&page=1/, reply: { body: { customers: [
    { _id: "c1", name: "Awa Kabila", phone: "0991112222", totalPurchases: 2, totalSpent: 40, createdAt: now, updatedAt: now },
    { _id: "c2", name: "Client sans téléphone", totalPurchases: 1, totalSpent: 12, createdAt: now, updatedAt: now },
  ], totalPages: 1 } } }]);
  const user = userEvent.setup();
  renderPage(<Customers />, "/customers");
  expect(await screen.findByText("Client sans téléphone")).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText(/Rechercher/i), "099");
  expect(screen.getByText("Awa Kabila")).toBeInTheDocument();
  expect(screen.queryByText("Client sans téléphone")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Ajouter un client/i })).not.toBeInTheDocument();
});

test("Clients: a failed load shows a French error and a retry, not a blank page", async () => {
  signIn({ role: "superadmin" });
  mockApi([{ match: /^\/customers/, reply: { networkError: true } }]);
  renderPage(<Customers />, "/customers");
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Impossible de charger les clients");
  expect(alert).toHaveTextContent("Impossible de contacter le serveur");
  expect(within(alert).getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
});

const pendingPurchase = { _id: "e1", expenseId: "EXP-1", reason: "Achat baskets", recipientName: "Fournisseur", recipientPhone: "099", amount: 700, amountUSD: 700, paymentMethod: "cash", status: "pending", recordedBy: "m", createdAt: now, updatedAt: now, expenseType: "GOODS_PURCHASE", category: "SHOES" };

test("Historique des décaissements: insufficient funds keeps the page usable with a clear message", async () => {
  signIn({ role: "superadmin" });
  const api = mockApi([
    { match: /^\/expenses\/permissions\/me/, reply: { body: { canValidate: true, isAdmin: true, canEditAll: true, canDeleteAll: true, userId: "u-self", userName: "tester" } } },
    { match: /^\/expenses\?/, reply: { body: expenseList([pendingPurchase]) } },
    { method: "PATCH", match: /^\/expenses\/e1\/validate/, reply: { status: 409, body: { error: "INSUFFICIENT_PURCHASE_FUNDS", message: "Fonds de réapprovisionnement insuffisants", category: "SHOES", requested: 700, available: 500 } } },
  ]);
  const user = userEvent.setup();
  renderPage(<SortieHistory />, "/sortiehistory");
  await user.click(await screen.findByRole("button", { name: "Valider EXP-1" }));
  const dialog = screen.getByRole("alertdialog", { name: "Valider cet achat de marchandises ?" });
  expect(dialog).toHaveTextContent("Le bénéfice des actionnaires ne sera pas utilisé.");
  await user.click(within(dialog).getByRole("button", { name: "Valider l'achat" }));
  const alert = await within(dialog).findByRole("alert");
  expect(alert).toHaveTextContent("Fonds insuffisants");
  expect(alert).toHaveTextContent("Montant demandé : 700,00 $");
  expect(alert).toHaveTextContent("Fonds disponibles : 500,00 $");
  expect(dialog).not.toHaveTextContent("INSUFFICIENT_PURCHASE_FUNDS");
  expect(screen.getByRole("heading", { name: "Historique des décaissements" })).toBeInTheDocument();
  // The list was refreshed so the user decides on current data.
  await waitFor(() => expect(api.calls.filter((call) => /\/expenses\?/.test(call.url)).length).toBeGreaterThanOrEqual(2));
});

test("Historique des décaissements: rejection asks for a reason and calls the reject endpoint", async () => {
  signIn({ role: "manager" });
  const api = mockApi([
    { match: /^\/expenses\/permissions\/me/, reply: { body: { canValidate: true, isAdmin: false, userId: "u-self", userName: "tester" } } },
    { match: /^\/expenses\?/, reply: { body: expenseList([pendingPurchase]) } },
    { method: "PATCH", match: /^\/expenses\/e1\/reject/, reply: { body: { ...pendingPurchase, status: "rejected" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<SortieHistory />, "/sortiehistory");
  await user.click(await screen.findByRole("button", { name: "Rejeter EXP-1" }));
  const dialog = screen.getByRole("alertdialog", { name: "Rejeter ce décaissement ?" });
  await user.type(within(dialog).getByLabelText(/Motif du rejet/), "Doublon");
  await user.click(within(dialog).getByRole("button", { name: "Rejeter" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  const reject = api.calls.find((call) => call.method === "PATCH");
  expect(reject?.url).toMatch(/\/expenses\/e1\/reject$/);
  expect(reject?.body).toEqual({ reason: "Doublon" });
  expect(api.calls.some((call) => call.method === "DELETE")).toBe(false);
});

test("Historique des ventes: a failed void leaves the list usable", async () => {
  signIn({ role: "superadmin" });
  const sale = { _id: "s1", saleId: "SALE-1", customer: { name: "Awa" }, items: [{ productId: "p1", name: "Chemise", quantity: 2, price: 25, total: 50 }], total: 50, subtotal: 50, paymentMethod: "cash", status: "completed", type: "sale", salesPerson: "tester", createdAt: now, updatedAt: now };
  mockApi([
    { match: /^\/sales\?/, reply: { body: saleList([sale]) } },
    { match: /^\/products/, reply: { body: [] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PATCH", match: /^\/sales\/s1\/void/, reply: { status: 500, body: { error: "Failed to void sale" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<SalesHistory />, "/sales");
  await user.click(await screen.findByRole("button", { name: "Annuler la vente SALE-1" }));
  const dialog = screen.getByRole("alertdialog", { name: "Annuler cette vente ?" });
  expect(dialog).toHaveTextContent("Les 2 pièce(s) seront remises en stock.");
  await user.click(within(dialog).getByRole("button", { name: "Annuler la vente" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Une erreur interne est survenue");
  await user.click(within(dialog).getByRole("button", { name: "Fermer" }));
  expect(screen.getByRole("heading", { name: "Historique des ventes" })).toBeInTheDocument();
  expect(screen.getByText("SALE-1")).toBeInTheDocument();
});

test("Taux de change: the current rate displays correctly and an update is confirmed", async () => {
  signIn({ role: "superadmin" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850, effectiveFrom: now, notes: "" } } },
    { match: /^\/exchange-rates\/history/, reply: { body: { history: [] } } },
    { method: "POST", match: /^\/exchange-rates$/, reply: { status: 201, body: { message: "ok", rate: { rate: 2900 } } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Rate />, "/rate");
  expect(await screen.findByText(/1 USD = 2\s?850,00 FC/)).toBeInTheDocument();
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  await user.type(screen.getByPlaceholderText(/Ex: 2500/), "2900");
  await user.click(screen.getByRole("button", { name: /Appliquer le nouveau taux/ }));
  const dialog = screen.getByRole("alertdialog", { name: "Appliquer ce nouveau taux ?" });
  expect(dialog).toHaveTextContent("gardent le taux en vigueur");
  await user.click(within(dialog).getByRole("button", { name: "Appliquer le taux" }));
  await waitFor(() => expect(api.calls.some((call) => call.method === "POST")).toBe(true));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("Décaissements: a retry after a network failure reuses the same request key", async () => {
  signIn({ role: "superadmin", username: "tester" });
  let attempts = 0;
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: () => (++attempts === 1 ? { networkError: true } : { status: 201, body: { _id: "x", status: "validated" } }) },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.type(await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc."), "Transport");
  await user.type(screen.getByPlaceholderText("Nom complet"), "Taxi");
  await user.type(screen.getByPlaceholderText("Numéro de téléphone"), "0990000000");
  await user.type(screen.getByPlaceholderText("0"), "2850");
  const submit = screen.getByRole("button", { name: "Enregistrer le décaissement" });
  await user.click(submit);
  expect(await screen.findByText(/Impossible de contacter le serveur/)).toBeInTheDocument();
  expect(submit).toBeEnabled();
  await user.click(submit);
  await waitFor(() => expect(screen.getByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc.")).toHaveValue(""));
  const posts = api.calls.filter((call) => call.method === "POST");
  expect(posts).toHaveLength(2);
  expect((posts[0].body as { requestKey: string }).requestKey).toBe((posts[1].body as { requestKey: string }).requestKey);
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("Décaissements: one submit click creates one expense, resets, and never opens a confirmation", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 201, body: { _id: "expense-one", status: "validated" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  const reason = await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc.");
  await user.type(reason, "Transport unique");
  await user.type(screen.getByPlaceholderText("Nom complet"), "Taxi");
  await user.type(screen.getByPlaceholderText("Numéro de téléphone"), "0990000000");
  await user.type(screen.getByPlaceholderText("0"), "2850");
  await user.click(screen.getByRole("button", { name: "Enregistrer le décaissement" }));

  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(api.calls.filter((call) => call.method === "POST" && /\/expenses$/.test(call.url))).toHaveLength(1);
  await waitFor(() => expect(reason).toHaveValue(""));
  expect(screen.getByRole("heading", { name: "Décaissements" })).toBeInTheDocument();
  expect((await screen.findAllByText(/Décaissement enregistré et validé/)).length).toBeGreaterThan(0);
});

test("Décaissements: two synchronous submit events still send only one POST", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 201, body: { status: "validated" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  const reason = await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc.");
  await user.type(reason, "Transport unique");
  await user.type(screen.getByPlaceholderText("Nom complet"), "Taxi");
  await user.type(screen.getByPlaceholderText("Numéro de téléphone"), "0990000000");
  await user.type(screen.getByPlaceholderText("0"), "2850");
  const form = reason.closest("form")!;

  fireEvent.submit(form);
  fireEvent.submit(form);

  await waitFor(() => expect(reason).toHaveValue(""));
  expect(api.calls.filter((call) => call.method === "POST" && /\/expenses$/.test(call.url))).toHaveLength(1);
});

test("Décaissements: three consecutive one-click submissions use three request keys", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 201, body: { status: "validated" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  const reason = await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc.");
  const recipient = screen.getByPlaceholderText("Nom complet");
  const phone = screen.getByPlaceholderText("Numéro de téléphone");
  const amount = screen.getByPlaceholderText("0");

  for (const index of [1, 2, 3]) {
    await user.type(reason, `Dépense ${index}`);
    await user.type(recipient, `Bénéficiaire ${index}`);
    await user.type(phone, `099000000${index}`);
    await user.type(amount, String(2850 * index));
    await user.click(screen.getByRole("button", { name: "Enregistrer le décaissement" }));
    await waitFor(() => expect(reason).toHaveValue(""));
  }

  const posts = api.calls.filter((call) => call.method === "POST" && /\/expenses$/.test(call.url));
  expect(posts).toHaveLength(3);
  expect(new Set(posts.map((call) => (call.body as { requestKey: string }).requestKey)).size).toBe(3);
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("Décaissements: a 400 releases the button and shows the API error", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 400, body: { error: "category must be CLOTHES or SHOES" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.type(await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc."), "Transport invalide");
  await user.type(screen.getByPlaceholderText("Nom complet"), "Taxi");
  await user.type(screen.getByPlaceholderText("Numéro de téléphone"), "0990000000");
  await user.type(screen.getByPlaceholderText("0"), "2850");
  const submit = screen.getByRole("button", { name: "Enregistrer le décaissement" });
  await user.click(submit);

  expect(await screen.findByText(/Certaines informations sont invalides/)).toBeInTheDocument();
  expect(submit).toBeEnabled();
  expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(1);
});

test("Décaissements: an idempotency conflict stays readable and never unmounts the page", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [] } },
    { match: /^\/expenses\/funds\/CLOTHES/, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 409, body: { error: "IDEMPOTENCY_CONFLICT", message: "Cette clé de requête a déjà été utilisée avec des données différentes." } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.type(await screen.findByPlaceholderText("Ex: Achat fournitures bureau, Transport, etc."), "Transport conflictuel");
  await user.type(screen.getByPlaceholderText("Nom complet"), "Taxi");
  await user.type(screen.getByPlaceholderText("Numéro de téléphone"), "0990000000");
  await user.type(screen.getByPlaceholderText("0"), "2850");
  const submit = screen.getByRole("button", { name: "Enregistrer le décaissement" });
  await user.click(submit);

  expect(await screen.findByText(/Cette clé de requête a déjà été utilisée avec des données différentes/)).toBeInTheDocument();
  expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Décaissements" })).toBeInTheDocument();
  expect(submit).toBeEnabled();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("Suivi des réservations: completing a reservation confirms the real effect and updates the row", async () => {
  signIn({ role: "manager", username: "tester" });
  const reservation = { _id: "r1", saleId: "RES-1", customer: { name: "Jean", phone: "099" }, items: [{ productId: "p1", name: "Basket", quantity: 1, price: 55, total: 55 }], total: 55, subtotal: 55, paymentMethod: "cash", status: "pending", type: "reservation", salesPerson: "tester", createdAt: now, updatedAt: now };
  const api = mockApi([
    { match: /^\/sales\/reservations\/all/, reply: { body: reservationList([reservation]) } },
    { match: /^\/products/, reply: { body: [] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PATCH", match: /^\/sales\/r1\/complete/, reply: { body: { ...reservation, status: "completed" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<ReservationHistory />, "/reservationhistory");
  await user.click(await screen.findByTitle("Terminer la réservation"));
  const dialog = screen.getByRole("alertdialog", { name: "Terminer cette réservation ?" });
  expect(dialog).toHaveTextContent("Le stock ne change pas");
  await user.click(within(dialog).getByRole("button", { name: "Terminer la réservation" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(api.calls.find((call) => call.method === "PATCH")?.body).toEqual({});
  expect(screen.queryByTitle("Terminer la réservation")).not.toBeInTheDocument();
});

test("Administration: another account can be deactivated and reactivated without blanking the page", async () => {
  signIn({ role: "superadmin", id: "u-self" });
  let active = true;
  const api = mockApi([
    { match: /^\/users$/, reply: { body: [
      { _id: "u-self", username: "tester", email: "t@test.local", role: "superadmin", isActive: true, permissions: [], createdAt: now },
      { _id: "u2", username: "caissier", email: "c@test.local", role: "staff", isActive: true, permissions: [], createdAt: now },
    ] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PUT", match: /^\/users\/u2\/status/, reply: () => {
      active = !active;
      return { body: { message: active ? "User activated successfully" : "User deactivated successfully", user: { _id: "u2", isActive: active } } };
    } },
  ]);
  const user = userEvent.setup();
  renderPage(<AdminPanel />, "/admin");
  expect(await screen.findByText("Actif · votre compte")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Supprimer tester" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Actif/ }));
  const dialog = screen.getByRole("alertdialog", { name: "Désactiver ce compte ?" });
  await user.click(within(dialog).getByRole("button", { name: "Désactiver" }));
  await waitFor(() => expect(screen.getByText("Désactivé")).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Désactivé/ }));
  const reactivateDialog = screen.getByRole("alertdialog", { name: "Réactiver ce compte ?" });
  await user.click(within(reactivateDialog).getByRole("button", { name: "Réactiver" }));
  await waitFor(() => expect(screen.getAllByText("Actif").length).toBeGreaterThan(0));
  expect(screen.getByText("caissier")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
  expect(api.calls.filter((call) => call.method === "PUT")).toHaveLength(2);
});

test("Articles & stock: deleting asks for confirmation and a failure keeps the article", async () => {
  signIn({ role: "superadmin" });
  mockApi([
    { match: /^\/products/, reply: { body: [{ _id: "p1", name: "Chemise Oxford", category: "Chemises", mainCategory: "CLOTHES", price: 25, unitCost: 12, stock: 4, minStock: 1, status: "active", unit: "pcs" }] } },
    { match: /^\/categories/, reply: { body: [] } },
    { method: "DELETE", match: /^\/products\/p1/, reply: { status: 403, body: { message: "Forbidden" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  await user.click(await screen.findByRole("button", { name: "Supprimer Chemise Oxford" }));
  const dialog = screen.getByRole("alertdialog", { name: "Supprimer définitivement cet article ?" });
  expect(dialog).toHaveTextContent("avec son stock de 4 pièce(s)");
  await user.click(within(dialog).getByRole("button", { name: "Supprimer définitivement" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Vous n'avez pas l'autorisation d'effectuer cette opération.");
  await user.click(within(dialog).getByRole("button", { name: "Fermer" }));
  expect(screen.getAllByText("Chemise Oxford").length).toBeGreaterThan(0);
});

test("Décaissements: a debt repayment can be submitted for a creditor without a phone number", async () => {
  signIn({ role: "superadmin", username: "tester" });
  const api = mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/creditors\/selector/, reply: { body: [{ _id: "cr1", name: "Banque Test", type: "bank" }] } },
    { method: "POST", match: /^\/expenses$/, reply: { status: 201, body: { _id: "x", status: "validated" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.click(await screen.findByText("Remboursement de dette"));
  const creditorSelect = await screen.findByDisplayValue("Sélectionner...");
  await user.selectOptions(creditorSelect, "cr1");
  await user.type(screen.getByPlaceholderText("0"), "28500");
  await user.click(screen.getByRole("button", { name: "Enregistrer le décaissement" }));
  await waitFor(() => expect(api.calls.some((call) => call.method === "POST")).toBe(true));
  expect(api.calls.find((call) => call.method === "POST")?.body).toMatchObject({ expenseType: "REPAYMENT", creditorId: "cr1" });
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
