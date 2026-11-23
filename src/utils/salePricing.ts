import { currentLocale } from "../i18n/index.ts";

// The shop works in Congolese francs (FC) only. There is no second currency
// and no exchange rate: every amount the interface shows or sends is FC. The
// server presents records made before the FC-only cutover through their own
// historical FC snapshot, so the interface never converts anything itself.
export const CURRENCY = "FC" as const;
export type SaleCurrency = typeof CURRENCY;

export interface PriceSnapshot {
  enteredPrice: number;
  enteredCurrency: SaleCurrency;
  priceFC: number;
}

export interface AmountSnapshot {
  enteredAmount: number;
  enteredCurrency: SaleCurrency;
  amountFC: number;
}

export interface StoredSaleItemPrice {
  price?: number;
  unitPrice?: number;
  quantity: number;
  total?: number;
  enteredPrice?: number;
  enteredCurrency?: string;
  priceFC?: number;
  unitSellingPrice?: number;
}

const isPositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export function createPriceSnapshot(enteredPrice: number): PriceSnapshot {
  if (!isPositive(enteredPrice)) {
    throw new Error("The entered price must be greater than zero");
  }
  return { enteredPrice, enteredCurrency: CURRENCY, priceFC: enteredPrice };
}

export function createAmountSnapshot(enteredAmount: number): AmountSnapshot {
  const price = createPriceSnapshot(enteredAmount);
  return { enteredAmount: price.enteredPrice, enteredCurrency: CURRENCY, amountFC: price.priceFC };
}

const firstFinite = (...values: Array<number | undefined | null>): number | undefined =>
  values.find((value): value is number => typeof value === "number" && Number.isFinite(value));

/** The FC unit price a line was sold at; undefined when the record has none. */
export function findItemUnitPrice(item: StoredSaleItemPrice): number | undefined {
  return firstFinite(item.enteredPrice, item.priceFC, item.unitSellingPrice, item.price, item.unitPrice);
}

/** The FC unit price a line was sold at (0 when unknown). */
export function getItemUnitPrice(item: StoredSaleItemPrice): number {
  return findItemUnitPrice(item) ?? 0;
}

/** The FC total of a line: what it was sold at, times its quantity. */
export function getItemTotal(item: StoredSaleItemPrice): number {
  return getItemUnitPrice(item) * (Number(item.quantity) || 0);
}

/** The FC total of a list of lines. */
export function getItemsTotal(items: StoredSaleItemPrice[]): number {
  return items.reduce((sum, item) => sum + getItemTotal(item), 0);
}

export function formatFC(amount: number | undefined | null): string {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  return `${new Intl.NumberFormat(currentLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))} FC`;
}

// Discount eligibility is the physical quantity of the whole cart, never the
// number of distinct products. The server applies the same rule and is the
// authority; the protected price floor is only ever known server-side.
export const DISCOUNT_QUANTITY_THRESHOLD = 5;

export function totalCartQuantity(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Selling-price fields of a Product as returned by GET /api/products (FC). */
export interface ProductPricing {
  price?: number;
  priceFC?: number;
}

/** A normal (reference) unit price, in FC. */
export interface ReferencePrice {
  priceFC?: number;
}

/** The product's normal unit selling price for a new transaction. */
export function productReferencePrice(product: ProductPricing): ReferencePrice {
  return { priceFC: firstFinite(product.priceFC, product.price) };
}

/** The reference price as an entered-price snapshot. */
export function referencePriceSnapshot(reference: ReferencePrice): PriceSnapshot | null {
  return isPositive(reference.priceFC) ? createPriceSnapshot(reference.priceFC) : null;
}

/** The product's normal price as an entry, or null when it has none. */
export function normalPriceSnapshot(product: ProductPricing): PriceSnapshot | null {
  return referencePriceSnapshot(productReferencePrice(product));
}

/** True when an entry is exactly the normal price (whole francs). */
export function isAtReferencePrice(price: PriceSnapshot, reference: ReferencePrice): boolean {
  return reference.priceFC !== undefined && Math.round(price.enteredPrice) === Math.round(reference.priceFC);
}

// Same comparison as the server, in whole francs.
export function isDiscountedPrice(price: PriceSnapshot, reference: ReferencePrice): boolean {
  return reference.priceFC !== undefined && Math.round(price.enteredPrice) < Math.round(reference.priceFC);
}

export function canAddCartQuantity(
  backendStock: number,
  quantityAlreadyInCart: number,
  quantityToAdd: number
): boolean {
  return backendStock - quantityAlreadyInCart >= quantityToAdd;
}
