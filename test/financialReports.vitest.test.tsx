// Reports: category accounting tables and the financial trend chart, driven
// through the real components with mocked API responses.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import shareholderAnalytics from "./fixtures/shareholderAnalytics.json";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Analytics from "../src/pages/analytics/Analytics";
import CategoryAccountingTables from "../src/pages/analytics/CategoryAccountingTables";
import FinancialTrendChart from "../src/pages/analytics/FinancialTrendChart";
import type { CategoryReportDTO } from "../src/pages/analytics/CategoryAccountingTables";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const figures = (revenue: number, cogs: number, sales: number) => ({
  revenue, costOfGoodsSold: cogs, grossProfit: revenue - cogs, companyExpenses: 0, netResult: revenue - cogs,
  grossMargin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : null,
  revenueFC: revenue * 2800, costOfGoodsSoldFC: cogs * 2800, grossProfitFC: (revenue - cogs) * 2800, companyExpensesFC: 0, netResultFC: (revenue - cogs) * 2800,
  sales, unitsSold: sales,
});
function timeSeries(category: "CLOTHES" | "SHOES" | null) {
  const categories = category ? [category] : ["CLOTHES", "SHOES"];
  const days = [["2026-09-21", 0, 0, 0], ["2026-09-22", 55, 30, 1], ["2026-09-23", 20, 8, 1]] as const;
  return {
    success: true, source: "mongodb-aggregation", paginated: false,
    range: { from: "2026-09-21", to: "2026-09-23", start: "", end: "", days: 3 }, granularity: "day", currency: "USD", categories,
    series: days.map(([date, revenue, cogs, sales]) => ({ date, start: date, end: date, partial: false, ...figures(revenue, cogs, sales), byCategory: {} })),
    totals: { ...figures(75, 38, 2), byCategory: {} },
  };
}

test("a shareholder sees only its category as a table and a chart scoped by the server", async () => {
  const user = userEvent.setup();
  signIn({ role: "admin", assignedCategory: "SHOES", permissions: ["/sales", "/reports", "/products"] });
  const api = mockApi([
    { match: /^\/analytics\/summary/, reply: { body: shareholderAnalytics } },
    { match: /^\/analytics\/timeseries\?/, reply: { body: timeSeries("SHOES") } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  renderPage(<Analytics />, "/reports");

  const tables = await screen.findByRole("region", { name: "Comptabilité par catégorie" });
  expect(within(tables).getByRole("table", { name: "Chaussures" })).toBeInTheDocument();
  expect(within(tables).queryByRole("table", { name: "Vêtements" })).not.toBeInTheDocument();
  await user.click(within(tables).getByRole("button", { name: "Comprendre les chiffres" }));
  const period = within(tables).getByRole("table", { name: "Performance de la période" });
  const headers = within(period).getAllByRole("columnheader").map((cell) => cell.textContent);
  expect(headers).toEqual(["Indicateur", "Chaussures"]);
  expect(within(tables).queryByText("Vêtements")).not.toBeInTheDocument();

  // The chart loads lazily, then asks for its series without a category:
  // the server pins a shareholder to its assigned category.
  expect(await screen.findByText("Total de la période")).toBeInTheDocument();
  await waitFor(() => expect(api.calls.some((call) => call.url.includes("/analytics/timeseries?"))).toBe(true));
  const request = api.calls.find((call) => call.url.includes("/analytics/timeseries?"))!;
  expect(new URL(request.url).searchParams.get("category")).toBeNull();
  expect(screen.queryByRole("group", { name: "Catégorie" })).not.toBeInTheDocument();
  expect(api.unmatched).toEqual([]);
});

const category = (overrides: Partial<CategoryReportDTO>): CategoryReportDTO => ({
  revenue: 0, costOfGoodsSold: 0, grossProfit: 0, companyExpenses: 0, netProfit: 0, goodsPurchases: 0, recoveredCapital: 0,
  profitUsedForPurchases: 0, distributableProfit: 0, shareholder1: 0, shareholder2: 0, ...overrides,
});

test("the Total column adds both categories to the cent and margins come from the shown values", async () => {
  const user = userEvent.setup();
  render(
    <CategoryAccountingTables
      periodLabel="Ce Mois"
      breakdown={{
        CLOTHES: category({ revenue: 100.1, costOfGoodsSold: 60.05, grossProfit: 40.05, netProfit: 40.05, distributableProfit: 40.05, shareholder1: 40.05 }),
        SHOES: category({ revenue: 0.2, costOfGoodsSold: 0.1, grossProfit: 0.1, companyExpenses: 5, netProfit: -4.9 }),
      }}
      inventory={{ CLOTHES: { products: 3, unitsInStock: 12, acquisitionValue: 120, retailValue: 300 } }}
    />,
  );
  expect(screen.getByRole("table", { name: "Vêtements" })).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Chaussures" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Comprendre les chiffres" }));
  const period = screen.getByRole("table", { name: "Performance de la période" });
  const row = (label: string) => within(period).getByRole("rowheader", { name: label }).closest("tr")!;
  const cells = (label: string) => within(row(label)).getAllByRole("cell").map((cell) => cell.querySelector(".fin-value")?.textContent?.replace(/\s/g, " "));

  expect(cells("Chiffre d'affaires")).toEqual(["100,10 $US", "0,20 $US", "100,30 $US"]);
  expect(cells("Résultat net")).toEqual(["40,05 $US", "-4,90 $US", "35,15 $US"]);
  expect(cells("Marge brute")).toEqual(["40,0 %", "50,0 %", "40,0 %"]);
  // Shares belong to different people: they are never totalled.
  expect(cells("Part actionnaire 1")[2]).toBe("—");
  expect(cells("Part actionnaire 2")[0]).toBe("—");
  // A loss is shown as a loss.
  expect(within(row("Résultat net")).getAllByRole("cell")[1]).toHaveClass("is-negative");
  // Phones read each value with its category label.
  expect(within(row("Chiffre d'affaires")).getAllByRole("cell").map((cell) => cell.getAttribute("data-label"))).toEqual(["Vêtements", "Chaussures", "Total"]);
  expect(screen.getByRole("table", { name: "Valeur du stock (USD)" })).toBeInTheDocument();
});

test("the FC view shows historical FC amounts and keeps USD where no FC exists", async () => {
  const user = userEvent.setup();
  render(<CategoryAccountingTables periodLabel="Ce Mois" breakdown={{ SHOES: category({ revenue: 10, revenueFC: 28000, capitalUsedForPurchases: 4 }) }} />);
  await user.click(screen.getByRole("button", { name: "Comprendre les chiffres" }));
  await user.click(screen.getByRole("button", { name: "FC" }));
  const period = screen.getByRole("table", { name: "Performance de la période" });
  const value = (label: string) => within(within(period).getByRole("rowheader", { name: label }).closest("tr")!).getAllByRole("cell")[0].textContent?.replace(/\s/g, " ");
  expect(value("Chiffre d'affaires")).toBe("28 000 FC");
  expect(value("dont capital récupéré")).toBe("4,00 $US");
});

test("the superadmin chart filters by category over the period it is given", async () => {
  signIn({ role: "superadmin" });
  const api = mockApi([
    { match: /^\/analytics\/timeseries\?/, reply: ({ url }) => ({ body: timeSeries((new URL(url).searchParams.get("category") as "SHOES") || null) }) },
  ]);
  const user = userEvent.setup();
  render(<FinancialTrendChart canFilterCategory from="2026-09-21" to="2026-09-23" />);
  expect(await screen.findByText(/75,00/)).toBeInTheDocument();
  // The chart has no period control of its own: it asks for the page's period.
  const first = new URL(api.calls[0].url).searchParams;
  expect([first.get("from"), first.get("to")]).toEqual(["2026-09-21", "2026-09-23"]);
  expect(screen.queryByRole("button", { name: "Personnalisée" })).not.toBeInTheDocument();
  expect(screen.getByText(/1 vente|2 ventes/)).toBeInTheDocument();

  await user.click(within(screen.getByRole("group", { name: "Catégorie" })).getByRole("button", { name: "Chaussures" }));
  await waitFor(() => expect(api.calls.at(-1)!.url).toContain("category=SHOES"));

  // Peak and lowest are the real buckets (55 on the 22nd, 0 on the 21st).
  expect(screen.getByText("55,00 $US")).toBeInTheDocument();
  expect(screen.getByText(/mardi 22 septembre 2026/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Afficher les données" }));
  const dataTable = screen.getByRole("table", { name: "Données du graphique" });
  expect(within(dataTable).getAllByRole("row")).toHaveLength(1 + 3 + 1);
});

test("a failed series load explains the error and retries", async () => {
  signIn({ role: "superadmin" });
  let fail = true;
  const api = mockApi([
    { match: /^\/analytics\/timeseries\?/, reply: () => (fail ? { status: 503, body: { error: "Service unavailable" } } : { body: timeSeries(null) }) },
  ]);
  const user = userEvent.setup();
  render(<FinancialTrendChart canFilterCategory from="2026-09-21" to="2026-09-23" />);
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  fail = false;
  await user.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(await screen.findByText("Total de la période")).toBeInTheDocument();
  expect(api.calls.length).toBe(2);
});

test("one period selector drives the summary and the chart, and validates a custom range", async () => {
  signIn({ role: "admin", assignedCategory: "SHOES", permissions: ["/sales", "/reports", "/products"] });
  const api = mockApi([
    { match: /^\/analytics\/summary/, reply: { body: shareholderAnalytics } },
    { match: /^\/analytics\/timeseries\?/, reply: { body: timeSeries("SHOES") } },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
  ]);
  const user = userEvent.setup();
  renderPage(<Analytics />, "/reports");
  expect(await screen.findByText("Total de la période")).toBeInTheDocument();

  // A single period control on the page.
  expect(screen.getAllByRole("group", { name: "Période d'analyse" })).toHaveLength(1);
  expect(screen.queryByRole("group", { name: "Période du graphique" })).not.toBeInTheDocument();

  const range = (path: string) => {
    const call = [...api.calls].reverse().find((entry) => entry.url.includes(path))!;
    const params = new URL(call.url).searchParams;
    return [params.get("from"), params.get("to")];
  };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lubumbashi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  await waitFor(() => expect(range("/analytics/timeseries?")).toEqual([today, today]));
  expect(range("/analytics/summary")).toEqual([today, today]);

  // Month: both requests start on the 1st; the chart stops at today.
  await user.click(screen.getByRole("button", { name: "Mois" }));
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  await waitFor(() => expect(range("/analytics/summary")[0]).toBe(firstOfMonth));
  await waitFor(() => expect(range("/analytics/timeseries?")).toEqual([firstOfMonth, today]));

  // Custom: an inverted range is refused before any request.
  await user.click(screen.getByRole("button", { name: "Personnalisée" }));
  const [from, to] = [screen.getByLabelText("Du"), screen.getByLabelText("Au")];
  await user.clear(from);
  await user.type(from, "2026-09-30");
  await user.clear(to);
  await user.type(to, "2026-09-01");
  const calls = api.calls.length;
  await user.click(screen.getByRole("button", { name: "Appliquer" }));
  expect(screen.getByRole("alert")).toHaveTextContent("La date de début doit précéder la date de fin.");
  expect(api.calls.length).toBe(calls);

  // A valid custom range reaches both endpoints unchanged.
  await user.clear(to);
  await user.type(to, "2026-10-05");
  await user.click(screen.getByRole("button", { name: "Appliquer" }));
  await waitFor(() => expect(range("/analytics/summary")).toEqual(["2026-09-30", "2026-10-05"]));
  await waitFor(() => expect(range("/analytics/timeseries?")).toEqual(["2026-09-30", "2026-10-05"]));
  expect(api.unmatched).toEqual([]);
});

test("a one-day period is drawn hour by hour", async () => {
  signIn({ role: "superadmin" });
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const key = `2026-10-19T${String(hour).padStart(2, "0")}`;
    const revenue = hour === 14 ? 40 : hour === 9 ? 10 : 0;
    return { date: key, hour, start: "2026-10-19", end: "2026-10-19", partial: false, ...figures(revenue, revenue / 2, revenue ? 1 : 0), byCategory: {} };
  });
  const api = mockApi([
    { match: /^\/analytics\/timeseries\?/, reply: { body: {
      success: true, source: "mongodb-aggregation", paginated: false,
      range: { from: "2026-10-19", to: "2026-10-19", start: "", end: "", days: 1 }, granularity: "hour", currency: "USD", categories: ["CLOTHES", "SHOES"],
      series: hours, totals: { ...figures(50, 25, 2), byCategory: {} },
    } } },
  ]);
  const user = userEvent.setup();
  render(<FinancialTrendChart canFilterCategory from="2026-10-19" to="2026-10-19" />);
  // The best hour is named with its time slot.
  expect(await screen.findByText(/14:00 – 15:00/)).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Auto (Par heure)" })).toBeInTheDocument();
  expect(new URL(api.calls[0].url).searchParams.get("granularity")).toBe("auto");
  await user.click(screen.getByRole("button", { name: "Afficher les données" }));
  const dataTable = screen.getByRole("table", { name: "Données du graphique" });
  expect(within(dataTable).getAllByRole("row")).toHaveLength(1 + 24 + 1);
});
