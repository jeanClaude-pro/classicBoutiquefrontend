// Predefined cash-receipt sources and categories. The value (French) is what
// is stored on the entry and sent to the API; only the label shown to the
// user follows the interface language. Free-text values from older records
// are displayed unchanged.
import i18n from "../i18n/index.ts";

const SOURCES: Record<string, string> = {
  "Paiement Client": "customerPayment",
  "Dépôt Bancaire": "bankDeposit",
  "Reçu d'Espèces": "cashReceipt",
  "Remboursement Prêt": "loanRepayment",
  "Investissement": "investment",
  "Revenue Divers": "miscRevenue",
  "Transfert Mobile": "mobileTransfer",
  "Autre Source": "other",
};

const CATEGORIES: Record<string, string> = {
  "Revenue Ventes": "salesRevenue",
  "Dépôt Espèces": "cashDeposit",
  "Remboursement": "repayment",
  "Prêt": "loan",
  "Investissement": "investment",
  "Revenue Divers": "miscRevenue",
  "Autre Catégorie": "other",
};

/** Stored values, in display order. */
export const ENTRY_SOURCES = Object.keys(SOURCES);
export const ENTRY_CATEGORIES = Object.keys(CATEGORIES);

export const entrySourceLabel = (value: string | null | undefined): string =>
  value && SOURCES[value] ? i18n.t(`entryOptions.sources.${SOURCES[value]}`) : value || "";

export const entryCategoryLabel = (value: string | null | undefined): string =>
  value && CATEGORIES[value] ? i18n.t(`entryOptions.categories.${CATEGORIES[value]}`) : value || "";
