// Family Sale in the POS and family-member management in Clients, exercised
// through the real pages. The server stays authoritative (see
// server/test/familySales.integration.test.js); these tests pin what the
// client sends and that the normal checkout is untouched.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn, type Route } from "./helpers/pageHarness";
import NewSale from "../src/pages/NewSale";
import Customers from "../src/pages/customers/Customers";

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
const robe = { _id: "p-robe", name: "Robe soirée", category: "Robes", mainCategory: "CLOTHES", price: 20000 / RATE, priceFC: 20000, priceEnteredCurrency: "FC", priceExchangeRate: RATE, stock: 20, minStock: 1, status: "active" };
const marie = { _id: "c-marie", name: "Marie Famille", phone: "0990000001", isFamilyMember: true };
const flat = (text: string | null | undefined) => (text || "").replace(/[\s\u202f\u00a0]/g, "");

type Reply = Route["reply"];
function posApi({ sale = { status: 201, body: { _id: "s1", saleId: "SALE-1" } } as Reply, healthy = true } = {}) {
  return mockApi([
    { match: /^\/health/, reply: healthy ? { body: { ok: true } } : () => ({ networkError: true }) },
    { match: /^\/products/, reply: { body: [robe] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: RATE, effectiveFrom: now } } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { match: /^\/customers\?/, reply: { body: { customers: [marie], totalPages: 1 } } },
    { method: "POST", match: /^\/print\//, reply: { body: { success: true } } },
    { method: "POST", match: /^\/sales$/, reply: sale },
  ]);
}
const salePosts = (api: ReturnType<typeof mockApi>) => api.calls.filter((call) => call.method === "POST" && /\/sales$/.test(call.url));

async function addOneRobe(user: ReturnType<typeof userEvent.setup>) {
  const search = await screen.findByPlaceholderText("Rechercher un article...");
  await user.type(search, "Robe");
  await user.click(await screen.findByText("Robe soirée", { selector: "div *" }));
  const quantity = screen.getByPlaceholderText("Entrer le nombre de pièces");
  await user.clear(quantity);
  await user.type(quantity, "1");
  await user.click(screen.getByRole("button", { name: /Ajouter au panier/ }));
}

async function startFamilySale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Commencer une vente famille" }));
  await user.click(await screen.findByRole("option", { name: /Marie Famille/ }));
  expect(await screen.findByText("Membre sélectionné : Marie Famille")).toBeInTheDocument();
}

async function setUnitPrice(user: ReturnType<typeof userEvent.setup>, value: string) {
  const input = await screen.findByRole("textbox", { name: "Prix unitaire de Robe soirée" });
  await user.clear(input);
  await user.type(input, value);
  await user.tab();
  return input;
}

test("Vente famille: only the operational superadmin is offered the family sale", async () => {
  signIn({ role: "staff", username: "caissier" });
  posApi();
  const { unmount } = renderPage(<NewSale />, "/");
  await screen.findByPlaceholderText("Rechercher un article...");
  expect(screen.queryByRole("button", { name: "Commencer une vente famille" })).not.toBeInTheDocument();
  unmount();

  localStorage.clear();
  signIn({ role: "admin", username: "actionnaire", assignedCategory: "CLOTHES" });
  posApi();
  renderPage(<NewSale />, "/");
  await screen.findByPlaceholderText("Rechercher un article...");
  expect(screen.queryByRole("button", { name: "Commencer une vente famille" })).not.toBeInTheDocument();
});

test("Vente famille: a registered member receives a one-piece discount sent with the family identity", async () => {
  signIn({ role: "superadmin", username: "patron" });
  const api = posApi({ sale: ({ body }) => ({ status: 201, body: { _id: "s1", saleId: "SALE-1", exchangeRate: RATE, items: (body as { items: unknown[] }).items } }) });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addOneRobe(user);
  await startFamilySale(user);

  const searches = api.calls.filter((call) => /\/customers\?/.test(call.url));
  expect(searches.length).toBeGreaterThan(0);
  expect(searches.every((call) => /familyOnly=true/.test(call.url))).toBe(true);
  expect(screen.getByText(/Vente famille : remise autorisée sans quantité minimale/)).toBeInTheDocument();
  // The client name/phone fields are filled from the record and locked.
  expect(screen.getByDisplayValue("Marie Famille")).toBeDisabled();

  const input = await setUnitPrice(user, "18000");
  expect(flat((input.closest("tr") as HTMLElement).textContent)).toContain("18000FC");
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(1));
  const body = salePosts(api)[0].body as Record<string, unknown> & { items: Array<Record<string, unknown>> };
  expect(body).toMatchObject({ isFamilySale: true, familyMemberId: "c-marie", offline: false, isWalkIn: false });
  expect(body.items[0]).toMatchObject({ productId: "p-robe", quantity: 1, enteredPrice: 18000, enteredCurrency: "FC" });
  expect(JSON.stringify(body)).not.toMatch(/isFamilyMember|unitCost|grossProfit/);
});

test("Vente famille: without the server the mode cannot start and nothing is sold or queued", async () => {
  signIn({ role: "superadmin", username: "patron" });
  const api = posApi({ healthy: false });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addOneRobe(user);
  await user.click(await screen.findByRole("button", { name: "Commencer une vente famille" }));
  expect(await screen.findByText("La vente famille est disponible uniquement avec une connexion au serveur.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Membre de famille *")).not.toBeInTheDocument();
  expect(salePosts(api)).toHaveLength(0);
});

test("Vente famille: a server refusal is shown once, without the offline fallback re-posting it", async () => {
  signIn({ role: "superadmin", username: "patron" });
  const api = posApi({ sale: { status: 400, body: { error: "FAMILY_MEMBER_INVALID", message: "Le client sélectionné n'est pas un membre de famille enregistré." } } });
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addOneRobe(user);
  await startFamilySale(user);
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  expect(await screen.findAllByText(/Le client sélectionné n'est (pas|plus) un membre de famille enregistré/)).not.toHaveLength(0);
  expect(salePosts(api)).toHaveLength(1);
  // The cart is kept for the cashier.
  expect(screen.getByRole("textbox", { name: "Prix unitaire de Robe soirée" })).toBeInTheDocument();
});

test("Vente famille: returning to a normal sale restores normal prices under 5 pieces", async () => {
  signIn({ role: "superadmin", username: "patron" });
  posApi();
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addOneRobe(user);
  await startFamilySale(user);
  await setUnitPrice(user, "18000");
  await user.click(screen.getByRole("button", { name: "Revenir à la vente normale" }));
  expect(screen.queryByRole("textbox", { name: "Prix unitaire de Robe soirée" })).not.toBeInTheDocument();
  expect(flat(screen.getByRole("table").textContent)).toContain("20000FC");
  expect(screen.getByText(/1 pièce\(s\) sur 5/)).toBeInTheDocument();
});

test("Clients: the superadmin registers a family member and marks an existing client", async () => {
  signIn({ role: "superadmin", username: "patron" });
  const ordinary = { _id: "c-paul", name: "Paul", phone: "0990000002", totalPurchases: 1, totalSpent: 10, createdAt: now, updatedAt: now, firstPurchaseDate: now, lastPurchaseDate: now, isFamilyMember: false };
  const api = mockApi([
    { match: /^\/customers\?/, reply: { body: { customers: [ordinary], totalPages: 1 } } },
    { method: "POST", match: /^\/customers$/, reply: ({ body }) => ({ status: 201, body: { ...(body as object), _id: "c-new", totalPurchases: 0, totalSpent: 0, createdAt: now, updatedAt: now } }) },
    { method: "PUT", match: /^\/customers\/c-paul$/, reply: ({ body }) => ({ body: { ...ordinary, ...(body as object) } }) },
  ]);
  const user = userEvent.setup();
  renderPage(<Customers />, "/customers");
  await screen.findByText("Paul");

  await user.click(screen.getByRole("button", { name: "Nouveau membre de famille" }));
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Le nom est obligatoire.");
  await user.type(screen.getByLabelText("Nom *"), "Marie");
  await user.type(screen.getByLabelText("Téléphone"), "0990000002");
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/appartient déjà au client Paul/);
  await user.clear(screen.getByLabelText("Téléphone"));
  await user.type(screen.getByLabelText("Téléphone"), "0990000009");
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() => expect(api.calls.some((call) => call.method === "POST")).toBe(true));
  expect(api.calls.find((call) => call.method === "POST")?.body).toEqual({ name: "Marie", phone: "0990000009", email: "", isFamilyMember: true });

  await user.click(await screen.findByRole("button", { name: "Marquer Paul comme membre de famille" }));
  await waitFor(() => expect(api.calls.some((call) => call.method === "PUT")).toBe(true));
  expect(api.calls.find((call) => call.method === "PUT")?.body).toEqual({ isFamilyMember: true });

  await user.click(screen.getByRole("checkbox", { name: /Membres de famille uniquement/ }));
  expect(screen.getByRole("checkbox", { name: "Membres de famille uniquement (2)" })).toBeChecked();
});
