// Behaviour of the visual-system pieces that carry interaction: the row
// Actions menu (keyboard, focus, permissions), phone card layouts that keep
// every action reachable, the light sidebar's role filtering, and both
// interface languages.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import { ActionMenu } from "../src/components/ActionMenu";
import Products from "../src/pages/products/products";
import Customers from "../src/pages/customers/Customers";
import Sidebar from "../src/components/Sidebar";
import i18n from "../src/i18n";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await act(async () => { await i18n.changeLanguage("fr"); });
});

function phoneViewport() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"), media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }));
}

const now = new Date().toISOString();
const products = [
  { _id: "pA", name: "Chemise Classic", category: "Chemises", mainCategory: "CLOTHES", price: 20, unitCost: 10, stock: 2, minStock: 3, status: "active", unit: "pcs" },
  { _id: "pB", name: "Nike Air", category: "Baskets", mainCategory: "SHOES", price: 50, unitCost: 30, stock: 9, minStock: 1, status: "active", unit: "paire" },
];
const productsApi = () => mockApi([
  { match: /^\/products/, reply: { body: products } },
  { match: /^\/categories/, reply: { body: [] } },
  { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850, effectiveFrom: now } } },
]);

test("ActionMenu: keyboard opens on the first item, arrows move, Escape closes and returns focus", async () => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <ActionMenu label="Actions pour Robe" items={[
        { key: "sheet", label: "Fiche de stock", to: "/products/p1/stock-sheet" },
        { key: "edit", label: "Modifier", onSelect: onEdit },
        { key: "delete", label: "Supprimer", danger: true, onSelect: onDelete },
      ]} />
    </MemoryRouter>,
  );
  const trigger = screen.getByRole("button", { name: "Actions pour Robe" });
  expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  expect(trigger).toHaveAttribute("aria-expanded", "false");

  trigger.focus();
  await user.keyboard("{Enter}");
  const menu = screen.getByRole("menu", { name: "Actions pour Robe" });
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Fiche de stock" })).toHaveFocus());
  await user.keyboard("{ArrowDown}");
  expect(within(menu).getByRole("menuitem", { name: "Modifier" })).toHaveFocus();
  await user.keyboard("{End}");
  expect(within(menu).getByRole("menuitem", { name: "Supprimer" })).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(within(menu).getByRole("menuitem", { name: "Fiche de stock" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();

  await user.click(trigger);
  await user.click(screen.getByRole("menuitem", { name: "Modifier" }));
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).not.toHaveBeenCalled();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();

  await user.click(trigger);
  await user.click(document.body);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("Produits: the Actions menu keeps the role's actions (staff: view and stock sheet only)", async () => {
  signIn({ role: "staff" });
  productsApi();
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  await user.click(await screen.findByRole("button", { name: "Actions pour Chemise Classic" }));
  const items = screen.getAllByRole("menuitem").map((item) => item.getAttribute("aria-label") || item.textContent);
  expect(items).toEqual(["Voir l'article", "Fiche de stock de Chemise Classic"]);
  // Staff never see exact quantities; low stock is a status.
  expect(screen.getAllByText("Stock faible").length).toBeGreaterThan(0);
  expect(screen.queryByText("2 pcs")).not.toBeInTheDocument();
});

test("Produits: the superadmin's menu adds edit and the destructive delete", async () => {
  signIn({ role: "superadmin" });
  productsApi();
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  await user.click(await screen.findByRole("button", { name: "Actions pour Nike Air" }));
  expect(screen.getAllByRole("menuitem").map((item) => item.getAttribute("aria-label") || item.textContent))
    .toEqual(["Voir l'article", "Fiche de stock de Nike Air", "Modifier l'article", "Supprimer Nike Air"]);
  expect(screen.getByText("50,00 $US")).toBeInTheDocument();
});

test("Produits on a phone: one card per product, every action still reachable, no wide table", async () => {
  phoneViewport();
  signIn({ role: "superadmin" });
  productsApi();
  const user = userEvent.setup();
  renderPage(<Products />, "/products");
  const list = await screen.findByRole("list", { name: "Articles & stock" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Télécharger la fiche de stock" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ajouter un nouvel Article" })).toBeInTheDocument();
  await user.click(within(list).getByRole("button", { name: "Actions pour Chemise Classic" }));
  expect(screen.getByRole("menuitem", { name: "Fiche de stock de Chemise Classic" })).toHaveAttribute("href", "/products/pA/stock-sheet");
});

test("Clients on a phone: cards keep family status and all three actions", async () => {
  phoneViewport();
  signIn({ role: "superadmin" });
  mockApi([{
    match: /^\/customers\?/,
    reply: { body: { totalPages: 1, customers: [{ _id: "c1", name: "Marie", phone: "0990000001", totalPurchases: 3, totalSpent: 45, createdAt: now, updatedAt: now, firstPurchaseDate: now, lastPurchaseDate: now, isFamilyMember: true }] } },
  }]);
  renderPage(<Customers />, "/customers");
  const card = (await screen.findByText("Marie")).closest("li") as HTMLElement;
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(within(card).getByText("Membre de famille")).toBeInTheDocument();
  expect(within(card).getByRole("button", { name: "Voir les détails du client" })).toBeInTheDocument();
  expect(within(card).getByRole("button", { name: "Retirer le statut famille de Marie" })).toBeInTheDocument();
  expect(within(card).getByRole("button", { name: "Recalculer les statistiques" })).toBeInTheDocument();
});

test("Sidebar: navigation still follows permissions, and the language switch works", async () => {
  signIn({ role: "admin", assignedCategory: "CLOTHES", permissions: ["/reports", "/products"] });
  const user = userEvent.setup();
  renderPage(<Sidebar />, "/reports/products-sold");
  const nav = await screen.findByRole("navigation", { name: /navigation/i });
  const links = within(nav).getAllByRole("link").map((link) => link.getAttribute("href"));
  expect(links.sort()).toEqual(["/products", "/reports", "/reports/products-sold"]);
  // The Fiche des ventes has its own entry: only it is marked current.
  expect(within(nav).getAllByRole("link", { current: "page" }).map((link) => link.getAttribute("href"))).toEqual(["/reports/products-sold"]);

  await user.click(screen.getByRole("button", { name: "English" }));
  expect(await within(nav).findByRole("link", { name: /Reports/ })).toBeInTheDocument();
});

test("Sidebar: the Fiche des ventes is reachable for the roles that can open Reports, and only them", async () => {
  const visibleFor = (user: Record<string, unknown>, path = "/") => {
    localStorage.clear();
    signIn(user);
    const view = renderPage(<Sidebar />, path);
    const link = screen.queryByRole("link", { name: "Fiche des ventes" });
    const href = link?.getAttribute("href") ?? null;
    view.unmount();
    return href;
  };
  expect(visibleFor({ role: "superadmin" })).toBe("/reports/products-sold");
  expect(visibleFor({ role: "admin", assignedCategory: "SHOES", permissions: ["/reports"] })).toBe("/reports/products-sold");
  expect(visibleFor({ role: "admin", assignedCategory: "SHOES", permissions: ["/sales"] })).toBeNull();
  expect(visibleFor({ role: "staff" })).toBeNull();
  expect(visibleFor({ role: "manager" })).toBeNull();

  // On the Reports page itself, Reports (not the Fiche des ventes) is current.
  localStorage.clear();
  signIn({ role: "superadmin" });
  renderPage(<Sidebar />, "/reports");
  expect(screen.getByRole("link", { name: "Rapports & analyses" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Fiche des ventes" })).not.toHaveAttribute("aria-current");
});
