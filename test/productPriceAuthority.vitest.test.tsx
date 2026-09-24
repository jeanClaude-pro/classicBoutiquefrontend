// The authoritative currency of a Product's normal price, through the real
// pages: a new sale after a rate change, the EXCHANGE_RATE_CHANGED retry, and
// the Products edit form.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import NewSale from "../src/pages/NewSale";
import Products from "../src/pages/products/products";

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
// Defined as 20,000 FC when the rate was 2,850; `price` is its USD value then.
const robe = { _id: "p-robe", name: "Robe soirée", category: "Robes", mainCategory: "CLOTHES", price: 20000 / 2850, priceEnteredAmount: 20000, priceFC: 20000, priceEnteredCurrency: "FC", priceExchangeRate: 2850, stock: 20, minStock: 1, status: "active" };
// Defined as $20 when the rate was 2,850; `priceFC` is its FC value then.
const chemise = { _id: "p-chemise", name: "Chemise lin", category: "Chemises", mainCategory: "CLOTHES", price: 20, priceEnteredAmount: 20, priceFC: 57000, priceEnteredCurrency: "USD", priceExchangeRate: 2850, stock: 20, minStock: 1, status: "active" };
const flat = (text: string | null | undefined) => (text || "").replace(/\s/g, "");

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

const salePosts = (api: ReturnType<typeof mockApi>) =>
  api.calls.filter((call) => call.method === "POST" && /\/sales$/.test(call.url));
type SaleBody = { exchangeRate: number; items: Array<Record<string, unknown>> };

test("Point de vente: after the rate moves to 2,900 an FC product still sells at exactly 20,000 FC and a USD product at $20", async () => {
  signIn({ role: "staff", username: "caissier" });
  const api = mockApi([
    { match: /^\/products/, reply: { body: [robe, chemise] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2900, effectiveFrom: now } } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "POST", match: /^\/print\//, reply: { body: { success: true } } },
    { method: "POST", match: /^\/sales$/, reply: { status: 201, body: { _id: "s1", saleId: "SALE-1" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "1");
  await addToCart(user, "Chemise lin", "1");
  const table = flat(screen.getByRole("table").textContent);
  expect(table).toContain("20000FC");
  expect(table).toContain("58000FC");
  expect(table).not.toContain("20351");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(1));
  const body = salePosts(api)[0].body as SaleBody;
  expect(body.exchangeRate).toBe(2900);
  expect(body.items[0]).toMatchObject({ enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000, exchangeRate: 2900, priceUSD: 20000 / 2900 });
  expect(body.items[1]).toMatchObject({ enteredPrice: 20, enteredCurrency: "USD", priceUSD: 20, priceFC: 58000, exchangeRate: 2900 });
});

test("Point de vente: EXCHANGE_RATE_CHANGED keeps 20,000 FC and $20, recomputes only the other currency, and the retry succeeds", async () => {
  signIn({ role: "staff", username: "caissier" });
  let activeRate = 2850;
  let posts = 0;
  const api = mockApi([
    { match: /^\/products/, reply: { body: [robe, chemise] } },
    { match: /^\/exchange-rates\/current/, reply: () => ({ body: { rate: activeRate, effectiveFrom: now } }) },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "POST", match: /^\/print\//, reply: { body: { success: true } } },
    { method: "POST", match: /^\/sales$/, reply: () => {
      posts += 1;
      if (posts === 1) {
        activeRate = 2900;
        return { status: 409, body: { error: "EXCHANGE_RATE_CHANGED", message: "Le taux de change a changé.", exchangeRate: 2900 } };
      }
      return { status: 201, body: { _id: "s1", saleId: "SALE-1" } };
    } },
  ]);
  const user = userEvent.setup();
  renderPage(<NewSale />, "/");
  await addToCart(user, "Robe soirée", "1");
  await addToCart(user, "Chemise lin", "1");
  expect(flat(screen.getByRole("table").textContent)).toContain("57000FC");
  await user.click(screen.getByText("Client de passage (vente sans coordonnées client)"));
  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  expect(await screen.findByText(/Le taux de change a changé/)).toBeInTheDocument();
  await waitFor(() => expect(flat(screen.getByRole("table").textContent)).toContain("58000FC"));
  expect(flat(screen.getByRole("table").textContent)).toContain("20000FC");

  await user.click(screen.getByRole("button", { name: "Enregistrer la vente" }));
  await waitFor(() => expect(salePosts(api)).toHaveLength(2));
  const retry = salePosts(api)[1].body as SaleBody;
  expect(retry.exchangeRate).toBe(2900);
  expect(retry.items[0]).toMatchObject({ enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000, exchangeRate: 2900 });
  expect(retry.items[1]).toMatchObject({ enteredPrice: 20, enteredCurrency: "USD", priceFC: 58000, exchangeRate: 2900 });
});

const stocked = [
  { ...robe, unitCost: 10000 / 2850, unitCostEnteredAmount: 10000, unitCostEnteredCurrency: "FC", unitCostFC: 10000, unitCostExchangeRate: 2850, purchasedQuantity: 20, unit: "pcs" },
  { ...chemise, unitCost: 8, unitCostEnteredAmount: 8, unitCostEnteredCurrency: "USD", purchasedQuantity: 20, unit: "pcs" },
];
// PUT answers like the server: the stored product with the submitted fields.
function productsApi() {
  return mockApi([
    { match: /^\/products$/, reply: { body: stocked } },
    { match: /^\/categories/, reply: { body: [] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2900, effectiveFrom: now } } },
    { method: "PUT", match: /^\/products\//, reply: ({ url, body }) => ({ body: { ...stocked.find((product) => url.endsWith(product._id)), ...(body as object) } }) },
  ]);
}

const openEdit = async (user: ReturnType<typeof userEvent.setup>, index: number) => {
  const buttons = await screen.findAllByRole("button", { name: "Modifier l'article" });
  await user.click(buttons[index]);
};
const putBodies = (api: ReturnType<typeof mockApi>) =>
  api.calls.filter((call) => call.method === "PUT").map((call) => call.body as Record<string, unknown>);

test("Articles: the edit form opens on the authoritative price, and an unrelated edit never resubmits price or cost", async () => {
  signIn({ role: "superadmin" });
  const api = productsApi();
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  await screen.findAllByText("Robe soirée");
  await waitFor(() => expect(api.calls.some((call) => /exchange-rates/.test(call.url))).toBe(true));

  // FC product: 20,000 FC exactly, not 20,351 FC.
  await openEdit(user, 0);
  expect(document.getElementById("product-prix-de-vente")).toHaveValue(20000);
  const stock = document.getElementById("product-stock-actuel") as HTMLInputElement;
  await user.clear(stock);
  await user.type(stock, "18");
  await user.click(screen.getByRole("button", { name: "Mettre à jour l'article" }));
  await waitFor(() => expect(putBodies(api)).toHaveLength(1));
  const unrelated = putBodies(api)[0];
  expect(unrelated.stock).toBe(18);
  for (const key of ["price", "priceEnteredAmount", "priceEnteredCurrency", "priceFC", "unitCost", "unitCostEnteredAmount", "unitCostEnteredCurrency"]) {
    expect(unrelated).not.toHaveProperty(key);
  }

  // USD product: opens in USD on $20, not on its old 57,000 FC value.
  await openEdit(user, 1);
  expect(document.getElementById("product-prix-de-vente")).toHaveValue(20);
});

test("Articles: an explicit new price, or a switch of currency, becomes the authoritative price", async () => {
  signIn({ role: "superadmin" });
  const api = productsApi();
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  await screen.findAllByText("Robe soirée");
  await waitFor(() => expect(api.calls.some((call) => /exchange-rates/.test(call.url))).toBe(true));

  // 20,000 FC -> 22,000 FC.
  await openEdit(user, 0);
  const price = document.getElementById("product-prix-de-vente") as HTMLInputElement;
  await user.clear(price);
  await user.type(price, "22000");
  await user.click(screen.getByRole("button", { name: "Mettre à jour l'article" }));
  await waitFor(() => expect(putBodies(api)).toHaveLength(1));
  expect(putBodies(api)[0]).toMatchObject({ priceEnteredAmount: 22000, priceEnteredCurrency: "FC", priceExchangeRate: 2900 });
  expect(putBodies(api)[0]).not.toHaveProperty("unitCostEnteredAmount");

  // FC -> USD: the switched currency (whole cents) is sent as the new authority.
  await openEdit(user, 0);
  await user.click(screen.getByRole("button", { name: /FC → USD/ }));
  await user.click(screen.getByRole("button", { name: "Mettre à jour l'article" }));
  await waitFor(() => expect(putBodies(api)).toHaveLength(2));
  // 22,000 FC at 2,900 = $7.5862 -> $7.59.
  expect(putBodies(api)[1]).toMatchObject({ priceEnteredCurrency: "USD", priceEnteredAmount: 7.59 });
});
