import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ApiError } from "../src/lib/apiError";
import { useConfirmAction, type ConfirmActionRequest } from "../src/hooks/useConfirmAction";

const notify = vi.hoisted(() => ({ notifySuccess: vi.fn(), notifyError: vi.fn(), notifyInfo: vi.fn() }));
vi.mock("../src/lib/notify", () => notify);

// A page-like harness: a list, a trigger button and the shared dialog.
function Harness({ request }: { request: Partial<ConfirmActionRequest<unknown>> & Pick<ConfirmActionRequest<unknown>, "action"> }) {
  const confirm = useConfirmAction();
  const [refreshed, setRefreshed] = useState(0);
  return (
    <div>
      <h1>Historique des décaissements</h1>
      <p>Actualisations : {refreshed}</p>
      <button
        type="button"
        onClick={() => confirm.request({
          title: "Valider cet achat de marchandises ?",
          message: "Le montant sera prélevé sur les fonds de réapprovisionnement CHAUSSURES disponibles.",
          confirmLabel: "Valider l'achat",
          pendingLabel: "Validation…",
          successMessage: "Achat de marchandises validé avec succès.",
          onSuccess: () => setRefreshed((value) => value + 1),
          ...request,
        })}
      >
        Valider
      </button>
      {confirm.dialog}
    </div>
  );
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => { document.body.style.overflow = ""; });

test("opens with an explanatory title and message, and cancels without calling the action", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(<Harness request={{ action }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  const dialog = screen.getByRole("alertdialog", { name: "Valider cet achat de marchandises ?" });
  expect(dialog).toHaveTextContent("fonds de réapprovisionnement CHAUSSURES");
  await user.click(screen.getByRole("button", { name: "Annuler" }));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
});

test("Escape cancels and focus returns to the button that opened the dialog", async () => {
  const user = userEvent.setup();
  render(<Harness request={{ action: vi.fn() }} />);
  const trigger = screen.getByRole("button", { name: "Valider" });
  await user.click(trigger);
  expect(screen.getByRole("button", { name: "Valider l'achat" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test("Tab stays inside the dialog", async () => {
  const user = userEvent.setup();
  render(<Harness request={{ action: vi.fn() }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  const dialog = screen.getByRole("alertdialog");
  for (let i = 0; i < 5; i += 1) {
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  }
});

test("shows a loading state, ignores repeated clicks and runs the action once", async () => {
  const user = userEvent.setup();
  const pending = deferred<unknown>();
  const action = vi.fn(() => pending.promise);
  render(<Harness request={{ action }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  const confirm = screen.getByRole("button", { name: "Valider l'achat" });
  await user.click(confirm);
  const busy = screen.getByRole("button", { name: "Validation…" });
  expect(busy).toBeDisabled();
  expect(screen.getByRole("button", { name: "Annuler" })).toBeDisabled();
  await user.click(busy);
  await user.dblClick(busy);
  await user.keyboard("{Escape}");
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve({}); });
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("a translated button survives idle → pending → failure → idle without a DOM ownership crash", async () => {
  const user = userEvent.setup();
  const pending = deferred<unknown>();
  const action = vi.fn(() => pending.promise);
  render(<Harness request={{ action }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  const confirm = screen.getByRole("button", { name: "Valider l'achat" });

  // Simulate browser translation software replacing the visible text node.
  const idle = confirm.querySelector<HTMLElement>('[data-confirm-label="idle"]')!;
  const translated = document.createElement("font");
  translated.textContent = "Confirmer l'achat";
  idle.replaceChildren(translated);

  await user.click(confirm);
  expect(screen.getByRole("button", { name: "Validation…" })).toBeDisabled();
  await act(async () => { pending.reject(new TypeError("Failed to fetch")); });
  expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de contacter le serveur");
  expect(screen.getByRole("button", { name: "Valider l'achat" })).toBeEnabled();
  expect(screen.getByRole("heading", { name: "Historique des décaissements" })).toBeInTheDocument();
});

test("a translated button survives idle → pending → success and closes the dialog cleanly", async () => {
  const user = userEvent.setup();
  const pending = deferred<unknown>();
  const action = vi.fn(() => pending.promise);
  render(<Harness request={{ action }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  const confirm = screen.getByRole("button", { name: "Valider l'achat" });
  const idle = confirm.querySelector<HTMLElement>('[data-confirm-label="idle"]')!;
  const translated = document.createElement("font");
  translated.textContent = "Confirmer l'achat";
  idle.replaceChildren(translated);

  await user.dblClick(confirm);
  expect(action).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Validation…" })).toBeDisabled();
  await act(async () => { pending.resolve({}); });
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Historique des décaissements" })).toBeInTheDocument();
});

test("on success: closes, notifies once and refreshes the page data", async () => {
  const user = userEvent.setup();
  render(<Harness request={{ action: vi.fn(async () => ({ status: "validated" })) }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(notify.notifySuccess).toHaveBeenCalledWith("Achat de marchandises validé avec succès.");
  expect(screen.getByText("Actualisations : 1")).toBeInTheDocument();
});

test("on API error: stays open with a French explanation and remains usable", async () => {
  const user = userEvent.setup();
  const onError = vi.fn();
  const action = vi.fn()
    .mockRejectedValueOnce(new ApiError({ status: 409, code: "INSUFFICIENT_PURCHASE_FUNDS", title: "Fonds insuffisants", message: "Montant demandé : 700,00 $\nFonds disponibles : 500,00 $" }))
    .mockResolvedValueOnce({});
  render(<Harness request={{ action, onError }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Fonds insuffisants");
  expect(alert).toHaveTextContent("Fonds disponibles : 500,00 $");
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "INSUFFICIENT_PURCHASE_FUNDS" }));
  // The page behind is intact and the dialog can be retried.
  expect(screen.getByRole("heading", { name: "Historique des décaissements" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(action).toHaveBeenCalledTimes(2);
});

test("a network failure or an unexpected exception never escapes into rendering", async () => {
  const user = userEvent.setup();
  render(<Harness request={{ action: vi.fn(async () => { throw new TypeError("Failed to fetch"); }) }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de contacter le serveur");
  expect(screen.getByRole("button", { name: "Fermer" })).toBeEnabled();
});

test("a follow-up failure after success is reported, not thrown", async () => {
  const user = userEvent.setup();
  render(<Harness request={{ action: vi.fn(async () => ({})), onSuccess: () => { throw new Error("refresh failed"); } }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  await waitFor(() => expect(notify.notifyError).toHaveBeenCalled());
  expect(screen.getByRole("heading", { name: "Historique des décaissements" })).toBeInTheDocument();
});

test("a required reason keeps the confirm button disabled until it is provided", async () => {
  const user = userEvent.setup();
  const action = vi.fn(async (reason: string) => ({ reason }));
  render(<Harness request={{ action, confirmLabel: "Rejeter", variant: "danger", reason: { label: "Motif du rejet", required: true } }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  expect(screen.getByLabelText(/Motif du rejet/)).toHaveFocus();
  expect(screen.getByRole("button", { name: "Rejeter" })).toBeDisabled();
  await user.type(screen.getByLabelText(/Motif du rejet/), "  doublon  ");
  await user.click(screen.getByRole("button", { name: "Rejeter" }));
  await waitFor(() => expect(action).toHaveBeenCalledWith("doublon"));
});

test("a hanging onError follow-up never keeps the dialog loading", async () => {
  const user = userEvent.setup();
  const never = new Promise<void>(() => {});
  const onError = vi.fn(() => never);
  const action = vi.fn()
    .mockRejectedValueOnce(new ApiError({ status: 400, title: "Données invalides", message: "Certaines informations sont invalides." }))
    .mockResolvedValueOnce({});
  render(<Harness request={{ action, onError }} />);
  await user.click(screen.getByRole("button", { name: "Valider" }));
  await user.click(screen.getByRole("button", { name: "Valider l'achat" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Données invalides");
  expect(onError).toHaveBeenCalledTimes(1);
  // Recovered: the confirm button is usable again and a retry goes through once.
  const retry = screen.getByRole("button", { name: "Valider l'achat" });
  expect(retry).toBeEnabled();
  await user.dblClick(retry);
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(action).toHaveBeenCalledTimes(2);
});

test("a hanging onSuccess follow-up does not leave the page busy", async () => {
  const user = userEvent.setup();
  const onSuccess = vi.fn(() => new Promise<void>(() => {}));
  function BusyProbe() {
    const confirm = useConfirmAction();
    return (
      <div>
        <p>busy: {String(confirm.busy)}</p>
        <button type="button" onClick={() => confirm.request({ title: "T", confirmLabel: "OK", action: async () => ({}), onSuccess })}>Ouvrir</button>
        {confirm.dialog}
      </div>
    );
  }
  render(<BusyProbe />);
  await user.click(screen.getByRole("button", { name: "Ouvrir" }));
  await user.click(screen.getByRole("button", { name: "OK" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  expect(screen.getByText("busy: false")).toBeInTheDocument();
});
