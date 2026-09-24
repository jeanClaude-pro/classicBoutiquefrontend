import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, MESSAGES, apiErrorFromPayload, apiErrorFromResponse, toApiError, translateServerMessage } from "../src/lib/apiError.ts";

test("insufficient purchase funds become a titled French message with both amounts", () => {
  const error = apiErrorFromPayload(409, { error: "INSUFFICIENT_PURCHASE_FUNDS", message: "Fonds de réapprovisionnement insuffisants", requested: 700, available: 500, category: "SHOES" });
  assert.equal(error.title, "Fonds insuffisants");
  assert.match(error.message, /Montant demandé : 700,00 \$/);
  assert.match(error.message, /Fonds disponibles : 500,00 \$/);
  assert.equal(error.isConflict, false, "a refusal for funds is not a data conflict");
  assert.doesNotMatch(error.message, /INSUFFICIENT/);
});

test("concurrency conflicts explain that data changed and was refreshed", () => {
  for (const payload of [{ error: "Expense status changed; refresh and retry" }, { error: "Reservation status changed; refresh and retry" }, {}]) {
    const error = apiErrorFromPayload(409, payload);
    assert.equal(error.message, MESSAGES.conflict);
    assert.equal(error.isConflict, true);
  }
});

test("authorization errors never expose the server wording", () => {
  const forbidden = apiErrorFromPayload(403, { message: "Access denied. Superadmin role required." });
  assert.equal(forbidden.message, "Vous n'avez pas l'autorisation d'effectuer cette opération.");
  assert.equal(apiErrorFromPayload(401, { message: "Authentication required" }).message, MESSAGES.unauthorized);
  // A deactivated account keeps the (French) explanation from the server.
  assert.match(apiErrorFromPayload(403, { message: "Votre compte a été désactivé. Contactez un administrateur." }).message, /désactivé/);
});

test("every HTTP status maps to a controlled French message", () => {
  const expected: Record<number, string> = {
    400: MESSAGES.invalid, 404: MESSAGES.notFound, 413: MESSAGES.tooLarge, 422: MESSAGES.invalid,
    429: MESSAGES.rateLimited, 500: MESSAGES.server, 502: MESSAGES.unavailable, 503: MESSAGES.unavailable, 504: MESSAGES.unavailable,
  };
  for (const [status, message] of Object.entries(expected)) {
    assert.equal(apiErrorFromPayload(Number(status), { error: "Something technical happened" }).message, message, status);
  }
});

test("known English server messages are translated", () => {
  assert.equal(translateServerMessage("Insufficient stock for Robe soirée. Available: 0"), "Stock insuffisant pour Robe soirée (disponible : 0).");
  assert.equal(translateServerMessage("Sale is already voided"), "Cette vente est déjà annulée.");
  assert.equal(translateServerMessage("Only admins can void sales"), MESSAGES.forbidden);
  assert.equal(translateServerMessage("Cannot validate a rejected expense"), "Une dépense rejetée ne peut plus être validée.");
});

test("French business messages pass through; technical text is masked", () => {
  const french = "Les ventes à crédit ne sont pas prises en charge : une vente doit être encaissée intégralement.";
  assert.equal(apiErrorFromPayload(400, { error: french }).message, french);
  assert.equal(apiErrorFromPayload(503, { error: "Les opérations de vente exigent MongoDB en replica set pour garantir l'intégrité du stock." }).message, MESSAGES.unavailable);
  assert.equal(apiErrorFromPayload(500, { error: "E11000 duplicate key error collection" }).message, MESSAGES.server);
  assert.equal(apiErrorFromPayload(400, { error: "Cast to ObjectId failed for value" }).message, MESSAGES.invalid);
  assert.equal(apiErrorFromPayload(500, { error: "Une erreur française quelconque" }).message, MESSAGES.server, "5xx always uses the generic message");
});

test("malformed or empty error bodies never throw", async () => {
  const html = new Response("<html><body>Bad Gateway</body></html>", { status: 502 });
  assert.equal((await apiErrorFromResponse(html)).message, MESSAGES.unavailable);
  const empty = new Response(null, { status: 500 });
  assert.equal((await apiErrorFromResponse(empty)).message, MESSAGES.server);
  assert.equal(apiErrorFromPayload(400, null).message, MESSAGES.invalid);
  assert.equal(apiErrorFromPayload(409, "not an object").isConflict, true);
});

test("network failures, timeouts and unknown values are normalized", () => {
  const network = toApiError(new TypeError("Failed to fetch"));
  assert.equal(network.isNetwork, true);
  assert.equal(network.message, MESSAGES.network);
  const timeout = toApiError(Object.assign(new Error("aborted"), { name: "AbortError" }));
  assert.equal(timeout.code, "TIMEOUT");
  assert.equal(timeout.isNetwork, true);
  assert.equal(toApiError("boom").message, MESSAGES.unexpected);
  assert.equal(toApiError(new Error("Cannot read properties of undefined (reading 'x')")).message, MESSAGES.unexpected);
  assert.equal(toApiError(new Error("Montant ou taux de change invalide.")).message, "Montant ou taux de change invalide.");
  const original = new ApiError({ status: 409, title: "T", message: "M" });
  assert.equal(toApiError(original), original);
});

test("expense creation failures keep their own status, code and meaning", async () => {
  const unauthorized = toApiError(apiErrorFromPayload(401, { message: "Authentication required" }));
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.title, "Session expirée");
  assert.doesNotMatch(unauthorized.message, /déjà été enregistrée/);

  const replayed = toApiError(apiErrorFromPayload(409, { message: "Cette opération a déjà été enregistrée." }));
  assert.equal(replayed.status, 409);
  assert.equal(replayed.isConflict, true);
  assert.notEqual(replayed.title, "Session expirée");

  const duplicateId = apiErrorFromPayload(409, { error: "DUPLICATE_EXPENSE_ID", message: "Un identifiant de dépense identique vient d'être attribué. Rien n'a été enregistré : réessayez." });
  assert.equal(duplicateId.code, "DUPLICATE_EXPENSE_ID");
  assert.match(duplicateId.message, /Rien n'a été enregistré/);

  const misconfigured = apiErrorFromPayload(500, { error: "EXPENSE_INDEX_MISCONFIGURED" });
  assert.equal(misconfigured.status, 500);
  assert.equal(misconfigured.code, "EXPENSE_INDEX_MISCONFIGURED");
  assert.equal(misconfigured.message, MESSAGES.server);

  // The legacy server string no longer masquerades as an already-recorded operation.
  assert.equal(apiErrorFromPayload(400, { error: "Expense ID already exists" }).message, MESSAGES.invalid);
});
