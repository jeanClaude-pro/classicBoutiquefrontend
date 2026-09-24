// Every rendered <label> must name a real form control (DevTools: "A <label>
// isn't associated with a form field"), and ids must stay unique in the page.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Sortie from "../src/pages/Sortie";
import Rate from "../src/pages/Rate";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function expectLabelsAssociated() {
  const labels = Array.from(document.querySelectorAll("label"));
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    const control = label.htmlFor ? document.getElementById(label.htmlFor) : label.querySelector("input, select, textarea");
    expect(control, `label "${label.textContent?.trim()}"`).not.toBeNull();
    expect(["INPUT", "SELECT", "TEXTAREA"]).toContain(control!.tagName);
  }
  const ids = Array.from(document.querySelectorAll("[id]"), (element) => element.id);
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
}

const sortieApi = () => mockApi([
  { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850 } } },
  { match: /^\/creditors\/selector/, reply: { body: [{ _id: "c1", name: "Banque", type: "bank" }] } },
  { match: /^\/expenses\/funds\//, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
]);

test("Décaissements: every label names its control in both currency modes and for repayments", async () => {
  signIn({ role: "manager", username: "tester" });
  sortieApi();
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.type(await screen.findByLabelText("Motif du décaissement *"), "Transport");
  await user.type(screen.getByLabelText(/^Montant/), "2850");
  expect(screen.getByLabelText(/^Montant/)).toHaveValue(2850);
  expectLabelsAssociated();

  await user.click(screen.getByRole("button", { name: "FC → USD" }));
  await user.type(screen.getByLabelText(/^Montant/), "12.5");
  expect(screen.getByLabelText(/^Montant/)).toHaveValue(12.5);
  expectLabelsAssociated();

  await user.click(screen.getByRole("radio", { name: /Remboursement/i }));
  expect(await screen.findByLabelText("Créancier actif *")).toHaveProperty("tagName", "SELECT");
  expectLabelsAssociated();
});

test("Taux de change: every label names its control", async () => {
  signIn({ role: "superadmin" });
  mockApi([
    { match: /^\/exchange-rates\/current/, reply: { body: { rate: 2850, effectiveFrom: new Date().toISOString(), notes: "" } } },
    { match: /^\/exchange-rates\/history/, reply: { body: { history: [] } } },
  ]);
  renderPage(<Rate />, "/rate");
  expect(await screen.findByLabelText(/Nouveau Taux/)).toHaveProperty("tagName", "INPUT");
  expectLabelsAssociated();
});
