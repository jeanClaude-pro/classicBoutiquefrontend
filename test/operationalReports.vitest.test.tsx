// Stock and sales reports through the real screens:
// - Products → Actions → Fiche de stock opens THAT product's fiche;
// - the global stock PDF is generated from a dialog, never listed on screen;
// - Products sold is its own page with purchase cost / revenue / profit.
// The PDF renderer is mocked; the model it receives is checked instead.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Products from "../src/pages/products/products";
import ProductStockSheet from "../src/pages/products/ProductStockSheet";
import ProductsSold from "../src/pages/reports/ProductsSold";
import { downloadOperationalReportPdf } from "../src/pages/reports/operationalReportPdf";
import { businessDay, type PdfTableModel } from "../src/pages/reports/operationalReportModel";

vi.mock("../src/pages/reports/operationalReportPdf", () => ({ downloadOperationalReportPdf: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.mocked(downloadOperationalReportPdf).mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const today = businessDay(new Date());
const period = { start: `${today}T00:00:00.000+02:00`, end: `${today}T23:59:59.999+02:00` };
const flat = (text: string | null | undefined) => (text || "").replace(/[\s\u202f\u00a0]/g, "");
const lastModel = () => vi.mocked(downloadOperationalReportPdf).mock.calls.at(-1)?.[0] as PdfTableModel;
const params = (url: string) => new URL(url).searchParams;

const products = [
  { _id: "pA", name: "Chemise Classic", category: "Chemises", mainCategory: "CLOTHES", price: 20, unitCost: 10, stock: 13, minStock: 1, status: "active", unit: "pcs" },
  { _id: "pB", name: "Nike Air", category: "Baskets", mainCategory: "SHOES", price: 50, unitCost: 30, stock: 7, minStock: 1, status: "active", unit: "paire" },
];
const usd = (amount: number) => ({ currency: "USD", usd: amount, fc: amount * 2850 });
const ficheOf = (id: string) => {
  const product = products.find((item) => item._id === id)!;
  const closing = product.stock;
  return {
    period,
    product: { productId: id, name: product.name, category: product.mainCategory, unit: product.unit, status: "active", currentStock: product.stock, sellingPrice: usd(product.price) },
    row: {
      productId: id, product: product.name, category: product.mainCategory, unit: product.unit, status: "active",
      openingStock: 0, additions: closing + 3, reductions: 1, salesOut: 2, closingStock: closing, trackingComplete: true,
      sellingPrice: usd(product.price), inventoryValue: { usd: closing * product.price, fc: closing * product.price * 2850 },
    },
  };
};
const stockSheet = (category: string) => ({
  category, period, complete: true,
  rows: [ficheOf("pA").row, ficheOf("pB").row].filter((row) => category === "ALL" || row.category === category),
  totals: { openingStock: 0, additions: 0, reductions: 0, salesOut: 0, closingStock: 0, inventoryValue: { usd: 0, fc: 0 } },
});

function productApi() {
  return mockApi([
    { match: /^\/products\/stock-sheet\?/, reply: ({ url }) => ({ body: stockSheet(params(url).get("category") || "ALL") }) },
    { match: /^\/products\/pA\/stock-sheet\?/, reply: { body: ficheOf("pA") } },
    { match: /^\/products\/pB\/stock-sheet\?/, reply: { body: ficheOf("pB") } },
    { match: /^\/products\/pX\/stock-sheet\?/, reply: { status: 403, body: { error: "CATEGORY_FORBIDDEN", message: "Ce produit appartient à une autre catégorie." } } },
    { match: /^\/products/, reply: { body: products } },
    { match: /^\/categories/, reply: { body: [] } },
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
    { match: /^\/settings\/receipt/, reply: { body: { shopName: "ETS DOUBLE M CLASSIC BOUTIQUE", shopAddress: "780 AV. Du 30 Juin" } } },
  ]);
}
const productRoutes = (
  <Routes>
    <Route path="/products" element={<Products />} />
    <Route path="/products/:id/stock-sheet" element={<ProductStockSheet />} />
  </Routes>
);

test("Produits: every product has its own Fiche de stock action and no global sheet is listed", async () => {
  signIn({ role: "superadmin" });
  const api = productApi();
  const user = userEvent.setup();
  renderPage(productRoutes, "/products");
  await user.click(await screen.findByRole("button", { name: "Actions pour Chemise Classic" }));
  expect(screen.getByRole("menuitem", { name: "Fiche de stock de Chemise Classic" })).toHaveAttribute("href", "/products/pA/stock-sheet");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Actions pour Nike Air" }));
  expect(screen.getByRole("menuitem", { name: "Fiche de stock de Nike Air" })).toHaveAttribute("href", "/products/pB/stock-sheet");
  expect(api.calls.some((call) => call.url.includes("stock-sheet"))).toBe(false);
  expect(screen.queryByRole("table", { name: /Fiche de stock/ })).not.toBeInTheDocument();
});

test("Produits: Actions → Fiche de stock opens that exact product, with its valuation and PDF", async () => {
  signIn({ role: "superadmin" });
  const api = productApi();
  const user = userEvent.setup();
  renderPage(productRoutes, "/products");
  await user.click(await screen.findByRole("button", { name: "Actions pour Nike Air" }));
  await user.click(screen.getByRole("menuitem", { name: "Fiche de stock de Nike Air" }));

  expect(await screen.findByRole("heading", { level: 1, name: "Nike Air" })).toBeInTheDocument();
  const calls = api.calls.filter((call) => call.url.includes("stock-sheet"));
  expect(calls.map((call) => new URL(call.url).pathname)).toEqual(["/api/products/pB/stock-sheet"]);
  expect(params(calls[0].url).get("from")).toBe(today);
  expect(params(calls[0].url).has("category")).toBe(false);
  // 7 pairs x $50 = $350, never presented as revenue.
  expect(flat(screen.getByText(/7 paire ×/).textContent)).toBe("7paire×50,00$US=350,00$US");
  expect(screen.getByText(/Ce n'est pas un chiffre d'affaires réalisé/)).toBeInTheDocument();
  expect(screen.getByText("Sorties par ventes")).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Période"), "month");
  await waitFor(() => expect(params(api.calls.filter((call) => call.url.includes("/pB/stock-sheet")).at(-1)!.url).get("from")).toBe(`${today.slice(0, 7)}-01`));
  await waitFor(() => expect(screen.getByRole("button", { name: "Télécharger PDF" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Télécharger PDF" }));
  const model = lastModel();
  expect(model.title).toBe("FICHE DE STOCK");
  expect(model.meta.slice(0, 3).map((item) => item.value)).toEqual(["Nike Air", "Chaussures", "paire"]);
  expect(model.fileName).toBe(`fiche-de-stock_nike-air_${today.slice(0, 7)}-01_${today}.pdf`);
  expect(flat(model.body.find(([label]) => label === "Valeur du stock au prix de vente")?.[1])).toContain("350,00$US");
  expect(JSON.stringify(model)).not.toMatch(/Chemise Classic/);
});

test("Fiche de stock: a product of another category is refused by the server and shown as an error", async () => {
  signIn({ role: "admin", assignedCategory: "CLOTHES", permissions: ["/products"] });
  productApi();
  renderPage(<Routes><Route path="/products/:id/stock-sheet" element={<ProductStockSheet />} /></Routes>, "/products/pX/stock-sheet");
  // Every 401/403 gets the application's single authorization message.
  expect((await screen.findAllByText("Vous n'avez pas l'autorisation d'effectuer cette opération.")).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Télécharger PDF" })).toBeDisabled();
});

test("Produits: the global stock PDF is generated from the chosen period and category", async () => {
  signIn({ role: "superadmin" });
  const api = productApi();
  const user = userEvent.setup();
  renderPage(productRoutes, "/products");
  await user.click(await screen.findByRole("button", { name: "Télécharger la fiche de stock" }));
  const dialog = screen.getByRole("alertdialog", { name: "Fiche de stock de tous les produits" });
  await user.selectOptions(within(dialog).getByLabelText("Catégorie"), "SHOES");
  await user.click(within(dialog).getByRole("button", { name: "Télécharger PDF" }));
  await waitFor(() => expect(downloadOperationalReportPdf).toHaveBeenCalledTimes(1));
  const call = api.calls.find((item) => item.url.includes("/products/stock-sheet"))!;
  expect(params(call.url).get("category")).toBe("SHOES");
  expect(params(call.url).get("to")).toBe(today);
  const model = lastModel();
  expect(model.meta[1].value).toBe("Chaussures");
  expect(model.body.map((row) => row[0])).toEqual(["Nike Air"]);
  expect(model.headers).toContain("Valeur du stock au prix de vente");
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("Produits: a shareholder's stock PDF is pinned to the assigned category", async () => {
  signIn({ role: "admin", assignedCategory: "CLOTHES", permissions: ["/products"] });
  const api = productApi();
  const user = userEvent.setup();
  renderPage(productRoutes, "/products");
  await user.click(await screen.findByRole("button", { name: "Télécharger la fiche de stock" }));
  const dialog = screen.getByRole("alertdialog");
  const category = within(dialog).getByLabelText("Catégorie");
  expect(category).toBeDisabled();
  expect(within(category).queryByRole("option", { name: "Chaussures" })).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Télécharger PDF" }));
  await waitFor(() => expect(downloadOperationalReportPdf).toHaveBeenCalled());
  expect(params(api.calls.find((item) => item.url.includes("/products/stock-sheet"))!.url).get("category")).toBe("CLOTHES");
});

// ------------------------------------------------------------------ products sold

const money = (usdAmount: number) => ({ usd: usdAmount, fc: usdAmount * 2850 });
const soldPayload = (category: string, financialsVisible: boolean) => {
  // 1 piece at the normal $20 and 4 at the discounted $15: 5 pieces out, $80.
  const prices = [
    { currency: "USD", unitPrice: money(20), quantity: 1, revenue: money(20) },
    { currency: "USD", unitPrice: money(15), quantity: 4, revenue: money(60) },
  ];
  const row = { productId: "pA", product: "Chemise Classic", category: "CLOTHES", unit: "pcs", prices, quantitySold: 5, revenue: money(80) };
  const summary = { skusSold: 1, unitsSold: 5, revenue: money(80) };
  return financialsVisible
    ? { category, period, financialsVisible, rows: [{ ...row, purchaseCost: money(50), profit: money(30) }], summary: { ...summary, purchaseCost: money(50), profit: money(30) } }
    : { category, period, financialsVisible, rows: [row], summary };
};
function soldApi(financialsVisible = true) {
  return mockApi([
    { match: /^\/analytics\/sales-sheet\?/, reply: ({ url }) => ({ body: soldPayload(params(url).get("category") || "ALL", financialsVisible) }) },
    { match: /^\/settings\/receipt/, reply: { body: { shopName: "ETS DOUBLE M CLASSIC BOUTIQUE" } } },
  ]);
}

test("Fiche des ventes: each product shows the price it was sold at, the pieces that left and the revenue", async () => {
  signIn({ role: "superadmin" });
  const api = soldApi();
  const user = userEvent.setup();
  renderPage(<ProductsSold />, "/reports/products-sold");
  const row = (await screen.findByRole("rowheader", { name: "Chemise Classic" })).closest("tr") as HTMLElement;
  // Revenue = 1 x $20 + 4 x $15 = $80; cost $50; profit $80 - $50 = $30.
  expect(within(row).getAllByRole("cell").map((cell) => flat(cell.textContent))).toEqual([
    "Vêtements", "20,00$US×1pcs15,00$US×4pcs", "5pcs", "228000FC≈80,00$US", "142500FC≈50,00$US", "85500FC≈30,00$US",
  ]);
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Produit", "Catégorie", "Prix de vente pratiqué", "Pièces sorties", "Chiffre d'affaires", "Coût d'achat", "Bénéfice"]);
  expect(screen.getByText(/prix auquel chaque pièce a été vendue × pièces sorties/)).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "Total" })).toBeInTheDocument();
  expect(screen.getByText(/Chiffre d'affaires = coût d'achat \+ bénéfice/)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Catégorie"), "CLOTHES");
  await waitFor(() => expect(params(api.calls.at(-1)!.url).get("category")).toBe("CLOTHES"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Télécharger PDF" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Télécharger PDF" }));
  const model = lastModel();
  expect(model.title).toBe("FICHE DES VENTES");
  expect(model.meta[1].value).toBe("Vêtements");
  expect(model.headers.slice(2)).toEqual(["Prix de vente pratiqué", "Pièces sorties", "Chiffre d'affaires", "Coût d'achat", "Bénéfice"]);
  expect(model.body[0][2].split("\n").map(flat)).toEqual(["20,00$US×1pcs", "15,00$US×4pcs"]);
  expect(model.body[0].slice(4).map((cell) => flat(cell.split("\n")[0]))).toEqual(["228000FC", "142500FC", "85500FC"]);
  expect(api.calls.some((call) => /\/sales\?|\/sales$/.test(call.url))).toBe(false);
});

test("Fiche des ventes: roles without financial access see the price sold at, pieces and revenue only", async () => {
  signIn({ role: "manager" });
  soldApi(false);
  renderPage(<ProductsSold />, "/reports/products-sold");
  await screen.findByRole("rowheader", { name: "Chemise Classic" });
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Produit", "Catégorie", "Prix de vente pratiqué", "Pièces sorties", "Chiffre d'affaires"]);
  expect(screen.queryByText("Bénéfice")).not.toBeInTheDocument();
  expect(screen.getByText(/réservés au superadministrateur et aux actionnaires/)).toBeInTheDocument();
});

test("Fiche des ventes: a shareholder is pinned to the assigned category", async () => {
  signIn({ role: "admin", assignedCategory: "SHOES", permissions: ["/reports"] });
  const api = soldApi();
  renderPage(<ProductsSold />, "/reports/products-sold");
  await screen.findByRole("rowheader", { name: "Chemise Classic" });
  const category = screen.getByLabelText("Catégorie");
  expect(category).toBeDisabled();
  expect(within(category).queryByRole("option", { name: "Toutes les catégories" })).not.toBeInTheDocument();
  expect(api.calls.filter((call) => call.url.includes("sales-sheet")).every((call) => params(call.url).get("category") === "SHOES")).toBe(true);
});

test("a shareholder's module permission covers its sub-pages, and only those", async () => {
  const { RequireAuth } = await import("../src/components/RequireAuth");
  const guarded = (
    <Routes>
      <Route path="/products/:id/stock-sheet" element={<RequireAuth><ProductStockSheet /></RequireAuth>} />
      <Route path="/reports/products-sold" element={<RequireAuth><ProductsSold /></RequireAuth>} />
    </Routes>
  );
  signIn({ role: "admin", assignedCategory: "CLOTHES", permissions: ["/products"] });
  productApi();
  const first = renderPage(guarded, "/products/pA/stock-sheet");
  expect(await screen.findByRole("heading", { level: 1, name: "Chemise Classic" })).toBeInTheDocument();
  first.unmount();

  renderPage(guarded, "/reports/products-sold");
  expect(await screen.findByText(/Module non autorisé|non autorisé/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Fiche des ventes" })).not.toBeInTheDocument();
});
