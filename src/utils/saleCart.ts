// Cart lines of the point of sale. Every function is pure and returns a new
// cart, so React state is never mutated and each line keeps its identity
// (lineId) across price/quantity changes.
import {
  DISCOUNT_QUANTITY_THRESHOLD,
  createPriceSnapshot,
  isAtReferencePrice,
  isDiscountedPrice,
  referencePriceSnapshot,
  totalCartQuantity,
  type PriceSnapshot,
  type ReferencePrice,
  type SaleCurrency,
} from "./salePricing.ts";

export interface SaleCartLine extends PriceSnapshot {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  /** USD unit price, kept for the API and receipts. */
  unitPrice: number;
  /** USD line total. */
  total: number;
  /** Normal unit price of the product for this transaction's rate. */
  reference: ReferencePrice;
}

function withPrice(line: SaleCartLine, price: PriceSnapshot): SaleCartLine {
  return {
    ...line,
    enteredPrice: price.enteredPrice,
    enteredCurrency: price.enteredCurrency,
    priceUSD: price.priceUSD,
    priceFC: price.priceFC,
    exchangeRate: price.exchangeRate,
    unitPrice: price.priceUSD,
    total: price.priceUSD * line.quantity,
  };
}

export const isLineDiscounted = (line: SaleCartLine): boolean => isDiscountedPrice(line, line.reference);

export function isDiscountEligible(items: Array<{ quantity: number }>): boolean {
  return totalCartQuantity(items) >= DISCOUNT_QUANTITY_THRESHOLD;
}

/** Adds a line, merging it into an existing line with the same product and exact same price. */
export function addCartLine(
  cart: SaleCartLine[],
  line: Omit<SaleCartLine, "unitPrice" | "total" | keyof PriceSnapshot> & { price: PriceSnapshot }
): SaleCartLine[] {
  const { price, ...identity } = line;
  const existing = cart.find((item) =>
    item.productId === identity.productId &&
    item.enteredCurrency === price.enteredCurrency &&
    item.enteredPrice === price.enteredPrice &&
    item.exchangeRate === price.exchangeRate
  );
  if (existing) {
    return cart.map((item) => item.lineId === existing.lineId
      ? { ...item, quantity: item.quantity + identity.quantity, total: item.priceUSD * (item.quantity + identity.quantity) }
      : item);
  }
  return [...cart, withPrice({ ...identity, unitPrice: 0, total: 0, ...price }, price)];
}

/**
 * Sets the unit price of ONE line in `currency`. The quantity only multiplies
 * the accepted unit price afterwards; the discount is never computed on the
 * line or cart total. Throws when the amount is not a valid price.
 */
export function repriceCartLine(
  cart: SaleCartLine[],
  lineId: string,
  enteredPrice: number,
  currency: SaleCurrency,
  rate?: number
): SaleCartLine[] {
  return cart.map((line) => line.lineId === lineId
    ? withPrice(line, createPriceSnapshot(enteredPrice, currency, line.exchangeRate ?? rate))
    : line);
}

/**
 * When the cart is no longer eligible, every discounted line returns to its
 * normal price in its own entered currency (an FC line gets its exact FC
 * reference back). `restored` lets the page tell the cashier it happened.
 */
export function restoreIneligibleDiscounts(cart: SaleCartLine[]): { cart: SaleCartLine[]; restored: number } {
  if (isDiscountEligible(cart)) return { cart, restored: 0 };
  let restored = 0;
  const next = cart.map((line) => {
    if (!isLineDiscounted(line)) return line;
    const reference = referencePriceSnapshot(line.reference, line.enteredCurrency, line.exchangeRate);
    if (!reference) return line;
    restored += 1;
    return withPrice(line, reference);
  });
  return { cart: restored ? next : cart, restored };
}

export function removeCartLine(cart: SaleCartLine[], lineId: string): { cart: SaleCartLine[]; restored: number } {
  return restoreIneligibleDiscounts(cart.filter((line) => line.lineId !== lineId));
}

/**
 * Re-prices the cart at a new server rate (after the server refused a stale
 * one). A line still at its normal price follows the product's normal price
 * in its authoritative currency (20,000 FC stays 20,000 FC; $20 stays $20 and
 * its FC equivalent is recomputed). Any other line — a discount the cashier
 * typed — keeps its entered amount in its entered currency; only the other
 * currency and the reference are recomputed.
 */
export function rebaseCartToRate(
  cart: SaleCartLine[],
  rate: number,
  referenceFor: (productId: string) => ReferencePrice | undefined
): SaleCartLine[] {
  return cart.map((line) => {
    const reference = referenceFor(line.productId) ?? line.reference;
    if (reference.currency && isAtReferencePrice(line, line.reference)) {
      const normal = referencePriceSnapshot(reference, reference.currency, rate);
      if (normal) return withPrice({ ...line, reference }, normal);
    }
    return withPrice({ ...line, reference }, createPriceSnapshot(line.enteredPrice, line.enteredCurrency, rate));
  });
}

/** Totals per entered currency: exactly what the cashier typed, times quantity. */
export function cartEnteredTotals(cart: SaleCartLine[]): Record<SaleCurrency, number> {
  return cart.reduce(
    (totals, line) => {
      totals[line.enteredCurrency] += line.enteredPrice * line.quantity;
      return totals;
    },
    { USD: 0, FC: 0 } as Record<SaleCurrency, number>
  );
}

/** The sale payload lines. Protected financial values are computed server-side only. */
export function cartSaleItems(cart: SaleCartLine[]) {
  return cart.map((line) => ({
    productId: line.productId,
    name: line.name,
    quantity: line.quantity,
    price: line.unitPrice,
    enteredPrice: line.enteredPrice,
    enteredCurrency: line.enteredCurrency,
    priceUSD: line.priceUSD,
    priceFC: line.priceFC,
    exchangeRate: line.exchangeRate,
  }));
}
