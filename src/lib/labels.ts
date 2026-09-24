// French labels for the enum values stored by the server. Pages display
// these instead of raw values such as "completed" or "mpesa".
// Values follow server/models (Sale.js, Entry.js, Expense.js, Product.js).

const PAYMENT_METHOD: Record<string, string> = {
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  bank: "Banque",
  mpesa: "M-Pesa",
  other: "Autre",
};

const SALE_STATUS: Record<string, string> = {
  completed: "Terminée",
  pending: "En attente",
  voided: "Annulée",
  refunded: "Remboursée",
  corrected: "Corrigée",
  expense: "Sortie historique",
};

const SALE_TYPE: Record<string, string> = {
  sale: "Vente",
  reservation: "Réservation",
  expense: "Sortie historique",
};

const EXPENSE_STATUS: Record<string, string> = {
  pending: "En attente",
  validated: "Validé",
  rejected: "Rejeté",
};

const ENTRY_STATUS: Record<string, string> = {
  active: "Active",
  deleted: "Supprimée",
};

const PRODUCT_STATUS: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
};

const pick = (map: Record<string, string>, value: unknown): string => {
  if (typeof value !== "string" || !value) return "—";
  return map[value] ?? map[value.toLowerCase()] ?? value;
};

export const paymentMethodLabel = (value: unknown) => pick(PAYMENT_METHOD, value);
export const saleStatusLabel = (value: unknown) => pick(SALE_STATUS, value);
export const saleTypeLabel = (value: unknown) => pick(SALE_TYPE, value);
export const expenseStatusLabel = (value: unknown) => pick(EXPENSE_STATUS, value);
export const entryStatusLabel = (value: unknown) => pick(ENTRY_STATUS, value);
export const productStatusLabel = (value: unknown) => pick(PRODUCT_STATUS, value);
