// Cart lines of the point of sale. Every function is pure and returns a new
// cart, so React state is never mutated and each line keeps its identity
// (lineId) across price/quantity changes. Every amount is FC.
import {
  CURRENCY,
  DISCOUNT_QUANTITY_THRESHOLD,
  createPriceSnapshot,
  isDiscountedPrice,
  referencePriceSnapshot,
  totalCartQuantity,
  type PriceSnapshot,
  type ReferencePrice,
} from "./salePricing.ts";

export interface SaleCartLine extends PriceSnapshot {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  /** FC unit price, sent to the API and printed on receipts. */
  unitPrice: number;
  /** FC line total. */
  total: number;
  /** Normal unit price of the product. */
  reference: ReferencePrice;
}

function withPrice(line: SaleCartLine, price: PriceSnapshot): SaleCartLine {
  return {
    ...line,
    enteredPrice: price.enteredPrice,
    enteredCurrency: price.enteredCurrency,
    priceFC: price.priceFC,
    unitPrice: price.enteredPrice,
    total: price.enteredPrice * line.quantity,
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
    item.productId === identity.productId && item.enteredPrice === price.enteredPrice
  );
  if (existing) {
    return cart.map((item) => item.lineId === existing.lineId
      ? { ...item, quantity: item.quantity + identity.quantity, total: item.enteredPrice * (item.quantity + identity.quantity) }
      : item);
  }
  return [...cart, withPrice({ ...identity, unitPrice: 0, total: 0, ...price }, price)];
}

/**
 * Sets the FC unit price of ONE line. The quantity only multiplies the
 * accepted unit price afterwards; the discount is never computed on the line
 * or cart total. Throws when the amount is not a valid price.
 */
export function repriceCartLine(cart: SaleCartLine[], lineId: string, enteredPrice: number): SaleCartLine[] {
  return cart.map((line) => line.lineId === lineId ? withPrice(line, createPriceSnapshot(enteredPrice)) : line);
}

/**
 * When the cart is no longer eligible, every discounted line returns to its
 * normal price. `restored` lets the page tell the cashier it happened.
 */
export function restoreIneligibleDiscounts(cart: SaleCartLine[]): { cart: SaleCartLine[]; restored: number } {
  if (isDiscountEligible(cart)) return { cart, restored: 0 };
  let restored = 0;
  const next = cart.map((line) => {
    if (!isLineDiscounted(line)) return line;
    const reference = referencePriceSnapshot(line.reference);
    if (!reference) return line;
    restored += 1;
    return withPrice(line, reference);
  });
  return { cart: restored ? next : cart, restored };
}

export function removeCartLine(cart: SaleCartLine[], lineId: string): { cart: SaleCartLine[]; restored: number } {
  return restoreIneligibleDiscounts(cart.filter((line) => line.lineId !== lineId));
}

/** Cart total in FC: exactly what the cashier typed, times quantity. */
export function cartTotal(cart: SaleCartLine[]): number {
  return cart.reduce((total, line) => total + line.enteredPrice * line.quantity, 0);
}

/** The sale payload lines. Protected financial values are computed server-side only. */
export function cartSaleItems(cart: SaleCartLine[]) {
  return cart.map((line) => ({
    productId: line.productId,
    name: line.name,
    quantity: line.quantity,
    price: line.enteredPrice,
    enteredPrice: line.enteredPrice,
    enteredCurrency: CURRENCY,
  }));
}
