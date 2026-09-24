// Display labels for the enum values stored by the server. Pages display
// these instead of raw values such as "completed" or "mpesa"; the stored
// value itself never changes with the interface language.
// Values follow server/models (Sale.js, Entry.js, Expense.js, Product.js).
import i18n from "../i18n/index.ts";

const label = (group: string) => (value: unknown): string => {
  if (typeof value !== "string" || !value) return "—";
  for (const candidate of [value, value.toLowerCase()]) {
    const key = `${group}.${candidate}`;
    if (i18n.exists(key)) return i18n.t(key);
  }
  return value;
};

export const paymentMethodLabel = label("enums.paymentMethod");
export const saleStatusLabel = label("enums.saleStatus");
export const saleTypeLabel = label("enums.saleType");
export const expenseStatusLabel = label("enums.expenseStatus");
export const entryStatusLabel = label("enums.entryStatus");
export const productStatusLabel = label("enums.productStatus");
