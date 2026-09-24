import test from "node:test";
import assert from "node:assert/strict";
import {
  completeReservationCopy, deleteEntryCopy, deleteProductCopy, deleteSaleCopy, deleteUserCopy,
  exchangeRateCopy, expenseCreationCopy, expenseDeletionCopy, expenseRejectionCopy, expenseReversalCopy,
  expenseValidationCopy, revertReservationCopy, toggleUserStatusCopy, voidSaleCopy,
} from "../src/lib/confirmationCopy.ts";

const all = (copy: { title: string; message: string; consequences: string[] }) => [copy.title, copy.message, ...copy.consequences].join(" ");

test("company expense validation names the affected category", () => {
  const clothes = expenseValidationCopy({ expenseType: "COMPANY_EXPENSE", category: "CLOTHES", amount: 50 });
  assert.equal(clothes.title, "Valider cette dépense ?");
  assert.match(clothes.message, /dépense de l'entreprise et affectera le résultat de la catégorie VÊTEMENTS/);
  const shoes = expenseValidationCopy({ expenseType: "COMPANY_EXPENSE", category: "SHOES", amount: 50 });
  assert.match(shoes.message, /CHAUSSURES/);
  assert.match(shoes.message, /avant le partage du bénéfice entre les deux actionnaires/);
  assert.equal(clothes.successMessage, "Dépense validée avec succès.");
});

test("goods purchase validation follows each category's funding rule", () => {
  const shoes = expenseValidationCopy({ expenseType: "GOODS_PURCHASE", category: "SHOES", amount: 700 });
  assert.equal(shoes.title, "Valider cet achat de marchandises ?");
  assert.match(shoes.message, /fonds de réapprovisionnement CHAUSSURES disponibles\. Le bénéfice des actionnaires ne sera pas utilisé\./);
  const clothes = expenseValidationCopy({ expenseType: "GOODS_PURCHASE", category: "CLOTHES", amount: 700 });
  assert.match(clothes.message, /d'abord sur le capital récupéré, puis, si nécessaire, sur le bénéfice disponible/);
  for (const copy of [shoes, clothes]) {
    assert.match(all(copy), /Le stock n'est pas modifié/, "purchases never change stock");
    assert.match(all(copy), /refusée et rien n'est enregistré/);
    assert.equal(copy.successMessage, "Achat de marchandises validé avec succès.");
    assert.deepEqual(copy.details.find((detail) => detail.label === "Montant")?.value, "700,00 $");
  }
});

test("repayment validation names the creditor; legacy records cannot be validated", () => {
  const repayment = expenseValidationCopy({ expenseType: "REPAYMENT", amount: 120, creditorSnapshot: { name: "Banque Test" } });
  assert.match(repayment.message, /La dette envers Banque Test sera réduite de 120,00 \$/);
  for (const type of ["LEGACY_UNCLASSIFIED", "normal", undefined]) {
    assert.ok(expenseValidationCopy({ expenseType: type, amount: 1 }).blockedReason, String(type));
  }
});

test("rejection keeps the record; deletion is permanent and refused once validated", () => {
  const reject = expenseRejectionCopy({ expenseType: "GOODS_PURCHASE", category: "SHOES", amount: 1 });
  assert.match(reject.message, /restera visible dans l'historique avec le statut « Rejeté »/);
  assert.equal(reject.variant, "danger");
  assert.match(all(expenseDeletionCopy({ status: "pending", amount: 1 })), /irréversible/);
  assert.ok(expenseDeletionCopy({ status: "validated", amount: 1 }).blockedReason);
  assert.equal(expenseDeletionCopy({ status: "rejected", amount: 1 }).blockedReason, undefined);
});

test("reversal and creation texts describe the real accounting effect", () => {
  assert.match(expenseReversalCopy({ expenseType: "GOODS_PURCHASE", category: "SHOES", amount: 600 }).message, /reviennent dans les fonds de réapprovisionnement CHAUSSURES/);
  assert.match(expenseReversalCopy({ expenseType: "COMPANY_EXPENSE", category: "CLOTHES", amount: 200 }).message, /ne réduira plus le résultat de la catégorie VÊTEMENTS/);
  const pending = expenseCreationCopy({ expenseType: "GOODS_PURCHASE", category: "SHOES", amount: 10, autoValidate: false });
  assert.equal(pending.title, "Soumettre ce décaissement ?");
  assert.match(pending.message, /aucun effet tant qu'un responsable ne l'a pas validé/);
  const direct = expenseCreationCopy({ expenseType: "GOODS_PURCHASE", category: "SHOES", amount: 10, autoValidate: true });
  assert.equal(direct.confirmLabel, "Enregistrer et valider");
  assert.match(direct.message, /Le bénéfice des actionnaires ne sera pas utilisé/);
});

test("voiding explains stock and revenue effects only when they apply", () => {
  const sale = voidSaleCopy({ saleId: "S-1", type: "sale", status: "completed", total: 100, items: [{ quantity: 2 }, { quantity: 1 }] });
  assert.match(all(sale), /Les 3 pièce\(s\) seront remises en stock/);
  assert.match(all(sale), /ne comptera plus dans le chiffre d'affaires/);
  assert.match(sale.message, /restera dans l'historique avec le statut « Annulée »/);
  const pendingReservation = voidSaleCopy({ type: "reservation", status: "pending", items: [{ quantity: 1 }] });
  assert.doesNotMatch(all(pendingReservation), /chiffre d'affaires/, "a pending reservation was never recognized");
  assert.equal(pendingReservation.title, "Annuler cette réservation ?");
});

test("reservation transitions describe accounting and stock accurately", () => {
  const complete = completeReservationCopy({ saleId: "R-1", items: [{ quantity: 1 }] });
  assert.match(all(complete), /comptabilisée aujourd'hui/);
  assert.match(all(complete), /Le stock ne change pas/);
  const revert = revertReservationCopy({ saleId: "R-1" });
  assert.doesNotMatch(all(revert), /irréversible|ne pourra pas être annulée/, "reverting can be undone by completing again");
  assert.match(all(revert), /Le stock reste réservé/);
  assert.ok(deleteSaleCopy({ type: "reservation", status: "completed" }).blockedReason);
  assert.match(all(deleteSaleCopy({ type: "reservation", status: "pending", items: [{ quantity: 2 }] })), /Les 2 pièce\(s\) seront remises en stock/);
  assert.doesNotMatch(all(deleteSaleCopy({ type: "sale", status: "voided", items: [{ quantity: 2 }] })), /remises en stock/, "voided stock was already returned");
});

test("other modules: soft-deleted entries, permanent products and users, rate scope", () => {
  assert.match(deleteEntryCopy({ entryId: "E-1", amount: 20 }).message, /marquée comme supprimée/);
  assert.match(deleteProductCopy({ name: "Chemise", stock: 4 }).message, /« Chemise » sera retiré du catalogue avec son stock de 4 pièce\(s\)/);
  assert.match(all(deleteUserCopy({ username: "awa" })), /irréversible/);
  assert.equal(toggleUserStatusCopy({ username: "awa", isActive: true }).title, "Désactiver ce compte ?");
  assert.equal(toggleUserStatusCopy({ username: "awa", isActive: false }).title, "Réactiver ce compte ?");
  assert.match(all(exchangeRateCopy(2900, 2850)), /Les opérations déjà enregistrées gardent le taux/);
});

test("no confirmation relies on a generic question", () => {
  const copies = [
    expenseValidationCopy({ expenseType: "COMPANY_EXPENSE", category: "CLOTHES" }), expenseRejectionCopy({}), expenseDeletionCopy({}),
    voidSaleCopy({}), completeReservationCopy({}), revertReservationCopy({}), deleteSaleCopy({}), deleteEntryCopy({}),
    deleteProductCopy({}), deleteUserCopy({}), toggleUserStatusCopy({}), exchangeRateCopy(1),
  ];
  for (const copy of copies) {
    assert.doesNotMatch(all(copy), /êtes-vous sûr/i);
    assert.ok(copy.message.length > 20, copy.title);
    assert.notEqual(copy.confirmLabel, "OK");
  }
});
