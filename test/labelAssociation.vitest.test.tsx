// Every rendered <label> must name a real form control (DevTools: "A <label>
// isn't associated with a form field"), and ids must stay unique in the page.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import Sortie from "../src/pages/Sortie";

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
  { match: /^\/creditors\/selector/, reply: { body: [{ _id: "c1", name: "Banque", type: "bank" }] } },
  { match: /^\/expenses\/funds\//, reply: { body: { category: "CLOTHES", availablePurchaseFunds: 900, fundingShortfall: 0 } } },
]);

test("Décaissements: every label names its control, for expenses and repayments", async () => {
  signIn({ role: "manager", username: "tester" });
  sortieApi();
  const user = userEvent.setup();
  renderPage(<Sortie />, "/sortie");
  await user.type(await screen.findByLabelText("Motif du décaissement *"), "Transport");
  await user.type(screen.getByLabelText("Montant (FC)"), "28500");
  expect(screen.getByLabelText("Montant (FC)")).toHaveValue(28500);
  // FC is the only currency: there is no currency switch any more.
  expect(screen.queryByRole("button", { name: /USD/ })).not.toBeInTheDocument();
  expectLabelsAssociated();

  await user.click(screen.getByRole("radio", { name: /Remboursement/i }));
  expect(await screen.findByLabelText("Créancier actif *")).toHaveProperty("tagName", "SELECT");
  expectLabelsAssociated();
});
