// Quantity-based unit-price discounts and exact FC snapshots, exercised through
// the real pages: the POS cart, the server's refusal of a line, retries, and
// the history / reprint / correction surfaces of a recorded FC sale.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import NewSale from "../src/pages/NewSale";
import SalesHistory from "../src/pages/history/SalesHistory";

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

const RATE = 2850;
const now = new Date().toISOString();
// Priced as 20,000 FC at 2,850 FC/USD. Staff never receive acquisition cost.
const robe = { _id: "p-robe", name: "Robe soirée", category: "Robes", mainCategory: "CLOTHES", price: 20000 / RATE, priceFC: 20000, priceEnteredCurrency: "FC", priceExchangeRate: RATE, stock: 20, minStock: 1, status: "active" };
const chemise = { _id: "p-chemise", name: "Chemise lin", category: "Chemises", mainCategory: "CLOTHES", price: 25, stock: 20, minStock: 1, status: "active" };
const flat = (text: string | null | undefined) => (text || "").replace(/[\s\u202f\u00a0]/g, "");

type Reply = Parameters<typeof mockApi>[0][number]["reply"];
function posApi(saleReply: Reply) {
  return mockApi([
    { match: /^\/products/, reply: { body: [robe, chemise] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: RATE, effectiveFrom: now } } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "POST", match: /^\/print\//, reply: { body: { success: true } } },
    { method: "POST", match: /^\/sales$/, reply: saleReply },
  ]);
}

async function addToCart(user: ReturnType<typeof userEvent.setup>, name: string, quantity: string) {
  const search = await screen.findByPlaceholderText("Rechercher un article...");
  await user.clear(search);
  await user.type(search, name.split(" ")[0]);
  await user.click(await screen.findByText(name, { selector: "div *" }));
  const quantityField = screen.getByPlaceholderText("Entrer le nombre de pièces");
  await user.clear(quantityField);
  await user.type(quantityField, quantity);
  await user.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
}

async function setUnitPrice(user: ReturnType<typeof userEvent.setup>, name: string, value: string) {
  const input = await screen.findByRole("textbox", { name: `Prix unitaire de ${name}` });
  await user.clear(input);
  await user.type(input, value);
  await user.tab();
  return input;
}

const salePosts = (api: ReturnType<typeof mockApi>) =>
  api.calls.filter((call) => call.method === "POST" && /\/sales$/.test(call.url));

test("Point de vente: under 5 pieces no unit price can be edited in the cart", async () => {
  signIn({ role: "staff", username: "caissier" });
  posApi({ status: 201, body: { _id: "s1", saleId: "SALE-1" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "4");
  expect(await screen.findByText(/4 pièce\(s\) sur 5/)).toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: /Prix unitaire de Robe/ })).not.toBeInTheDocument();
  expect(flat(screen.getByRole("table").textContent)).toContain("80000FC");
});

test("Point de vente: at 5 pieces an exact 18,000 FC unit price is sold as 5 x 18,000 FC", async () => {
  signIn({ role: "staff", username: "caissier" });
  const api = posApi(({ body }) => ({ status: 201, body: { _id: "s1", saleId: "SALE-1", total: 31.6, exchangeRate: RATE, items: (body as { items: unknown[] }).items } }));
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "5");
  expect(await screen.findByText(/Panier admissible/)).toBeInTheDocument();
  expect(screen.getByText(/celui d'UNE pièce/)).toBeInTheDocument();

  // Clearing the field while typing never re-prices the line mid-way.
  const input = await setUnitPrice(user, "Robe soirée", "18000");
  expect(input).toHaveValue("18000");
  const row = input.closest("tr") as HTMLElement;
  expect(flat(row.textContent)).toContain("90000FC");
  expect(flat(row.textContent)).toContain("Prixnormal:20000FC");

  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(1));
  const body = salePosts(api)[0].body as { items: Array<Record<string, unknown>>; exchangeRate: number; requestKey: string };
  expect(body.items[0]).toMatchObject({ productId: "p-robe", quantity: 5, enteredPrice: 18000, enteredCurrency: "FC", priceFC: 18000, exchangeRate: RATE });
  expect(body.exchangeRate).toBe(RATE);
  expect(typeof body.requestKey).toBe("string");
  expect(JSON.stringify(body)).not.toMatch(/unitCost|acquisition|grossProfit|minimum/i);
});

test("Point de vente: a product priced in FC is recorded at exactly 20,000 FC", async () => {
  signIn({ role: "staff", username: "caissier" });
  const api = posApi({ status: 201, body: { _id: "s1", saleId: "SALE-1" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "1");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(1));
  expect((salePosts(api)[0].body as { items: Array<Record<string, unknown>> }).items[0]).toMatchObject({ enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000 });
});

test("Point de vente: a refused price is shown on its line, without the hidden floor, and the cart is kept", async () => {
  signIn({ role: "staff", username: "caissier" });
  posApi({ status: 400, body: { error: "PRICE_TOO_LOW", message: "Prix trop bas. Veuillez augmenter le prix.", itemIndex: 1 } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "3");
  await addToCart(user, "Chemise lin", "2");
  await setUnitPrice(user, "Chemise lin", "1");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));

  const chemiseInput = await screen.findByRole("textbox", { name: "Prix unitaire de Chemise lin" });
  await waitFor(() => expect(chemiseInput).toHaveAttribute("aria-invalid", "true"));
  const row = chemiseInput.closest("tr") as HTMLElement;
  expect(within(row).getByRole("alert")).toHaveTextContent("Prix trop bas. Veuillez augmenter le prix.");
  const robeRow = screen.getByRole("textbox", { name: "Prix unitaire de Robe soirée" }).closest("tr") as HTMLElement;
  expect(within(robeRow).queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enregistrer la vente" })).toBeEnabled();

  // Raising the price clears the line's refusal.
  await setUnitPrice(user, "Chemise lin", "25");
  expect(within(row).queryByRole("alert")).not.toBeInTheDocument();
});

test("Point de vente: a retry after a lost response reuses the request key", async () => {
  signIn({ role: "staff", username: "caissier" });
  let attempts = 0;
  const api = posApi(() => (++attempts === 1 ? { networkError: true } : { status: 200, body: { _id: "s1", saleId: "SALE-1" } }));
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Chemise lin", "1");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  const submit = screen.getByRole("button", { name: "Enregistrer la vente" });
  await user.click(submit);
  expect(await screen.findByText(/Impossible de contacter le serveur/)).toBeInTheDocument();
  await user.click(submit);
  expect((await screen.findAllByText("Vente enregistrée avec succès.")).length).toBeGreaterThan(0);
  const keys = salePosts(api).map((call) => (call.body as { requestKey: string }).requestKey);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});

test("Point de vente: removing pieces under 5 restores normal prices and says so", async () => {
  signIn({ role: "staff", username: "caissier" });
  posApi({ status: 201, body: { _id: "s1", saleId: "SALE-1" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "4");
  await addToCart(user, "Chemise lin", "1");
  await setUnitPrice(user, "Robe soirée", "18000");
  await user.click(screen.getByRole("button", { name: /Enlever Chemise lin/ }));
  expect(await screen.findByRole("status", { name: "" })).toHaveTextContent(/moins de 5 pièces/);
  expect(flat(screen.getByRole("table").textContent)).toContain("80000FC");
  expect(screen.queryByRole("textbox", { name: /Prix unitaire de/ })).not.toBeInTheDocument();
});

// A recorded FC sale: 20,000 FC entered, USD accounting rounded to $7.02.
// 7.02 x 2,850 would print 20,007 FC; the stored snapshot must be used.
const fcLine = { _id: "line-1", productId: "p-robe", name: "Robe soirée", quantity: 3, price: 20000 / RATE, total: 21.06, enteredPrice: 20000, enteredCurrency: "FC", priceUSD: 20000 / RATE, priceFC: 20000, exchangeRate: RATE, unitSellingPrice: 7.02 };
const fcSale = { _id: "s-fc", saleId: "SALE-FC-1", customer: { name: "Awa", phone: "0990000000", email: "" }, items: [fcLine], subtotal: 21.06, total: 21.06, paymentMethod: "cash", status: "completed", type: "sale", createdAt: now, updatedAt: now, exchangeRate: RATE };
const historyPage = (sale: unknown) => ({
  success: true, data: [sale],
  pagination: { page: 1, limit: 50, totalRecords: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  timeframe: { description: "Today (default)", start: now, end: now, query: {} },
  summary: { totalRecords: 1, revenue: 21.06, revenueFC: 60000, expenses: 0, net: 21.06, salesCount: 1, expensesCount: 0 }, filtersApplied: {},
});

test("Historique des ventes: history and reprint keep 20,000 FC and never call today's rate", async () => {
  signIn({ role: "superadmin", username: "admin" });
  const api = mockApi([
    { match: /^\/sales\?/, reply: { body: historyPage(fcSale) } },
    { match: /^\/products/, reply: { body: [robe] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  const written: string[] = [];
  vi.spyOn(window, "open").mockReturnValue({ document: { write: (html: string) => written.push(html), close: () => {} } } as unknown as Window);
  const user = userEvent.setup();
  renderPage(<SalesHistory />, "/sales");
  const row = (await screen.findByText("SALE-FC-1")).closest("tr") as HTMLElement;
  expect(flat(row.textContent)).toContain("60000FC");
  expect(flat(row.textContent)).not.toContain("60021");

  await user.click(within(row).getByTitle("Réimprimer le reçu"));
  const receipt = flat(written.join(""));
  expect(receipt).toContain("20000FC");
  expect(receipt).toContain("60000FC");
  expect(receipt).not.toMatch(/20007|60021/);
  expect(api.calls.some((call) => /exchange-rates/.test(call.url))).toBe(false);
});

test("Historique des ventes: a correction under 5 pieces restores the exact FC price and keeps the sale's rate", async () => {
  signIn({ role: "superadmin", username: "admin" });
  const discountedLine = { ...fcLine, quantity: 5, enteredPrice: 18000, priceFC: 18000, priceUSD: 18000 / RATE, price: 18000 / RATE, unitSellingPrice: 6.32, total: 31.6, referenceUnitSellingPrice: 7.02, referenceUnitSellingPriceFC: 20000, discountApplied: true, discountPerUnitFC: 2000 };
  const sale = { ...fcSale, items: [discountedLine], total: 31.6, subtotal: 31.6 };
  const api = mockApi([
    { match: /^\/sales\?/, reply: { body: historyPage(sale) } },
    { match: /^\/products/, reply: { body: [robe] } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "PUT", match: /^\/sales\/s-fc$/, reply: { body: sale } },
  ]);
  const user = userEvent.setup();
  renderPage(<SalesHistory />, "/sales");
  const row = (await screen.findByText("SALE-FC-1")).closest("tr") as HTMLElement;
  await user.click(within(row).getByTitle("Corriger la vente"));

  const price = await screen.findByLabelText("PU (FC)");
  expect(price).toHaveValue("18000");
  // Clearing the price and leaving the field neither crashes nor changes it.
  await user.clear(price);
  await user.tab();
  expect(price).toHaveValue("18000");

  const quantity = screen.getByLabelText(/Nombre de pièces/);
  await user.click(within(quantity.parentElement as HTMLElement).getAllByRole("button")[0]);
  expect(await screen.findByText(/moins de 5 pièces/)).toBeInTheDocument();
  expect(price).toHaveValue("20000");

  await user.type(screen.getByPlaceholderText(/raison pour la modification/), "Client a rendu une pièce");
  await user.click(screen.getByRole("button", { name: /Mettre à jour la vente/ }));
  await waitFor(() => expect(api.calls.some((call) => call.method === "PUT")).toBe(true));
  const body = api.calls.find((call) => call.method === "PUT")?.body as { items: Array<Record<string, unknown>> };
  expect(body.items[0]).toMatchObject({ _id: "line-1", quantity: 4, enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000, exchangeRate: RATE });
});

test("Point de vente: a price typed then saved directly (no Tab) is the price that is sent", async () => {
  signIn({ role: "staff", username: "caissier" });
  const api = posApi({ status: 201, body: { _id: "s1", saleId: "SALE-1" } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "5");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  const input = await screen.findByRole("textbox", { name: "Prix unitaire de Robe soirée" });
  await user.clear(input);
  await user.type(input, "17500");
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(1));
  expect((salePosts(api)[0].body as { items: Array<Record<string, unknown>> }).items[0]).toMatchObject({ enteredPrice: 17500, enteredCurrency: "FC" });
});
