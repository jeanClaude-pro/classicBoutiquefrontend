// Pure helpers for the sale correction dialog. They mirror the
// server's rules (server/routes/sales.js) so the dialog shows what will be
// accepted; the server re-validates everything and remains the authority.
// Every amount is FC: the server presents a sale recorded before the FC-only
// cutover through its own historical FC snapshot.
import {
  DISCOUNT_QUANTITY_THRESHOLD,
  getItemUnitPrice,
  isDiscountedPrice,
  normalPriceSnapshot,
  productReferencePrice,
  referencePriceSnapshot,
  totalCartQuantity,
  type PriceSnapshot,
  type ProductPricing,
  type ReferencePrice,
} from "./salePricing.ts";

export interface CorrectionLine {
  _id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  enteredPrice?: number;
  enteredCurrency?: string;
  priceFC?: number;
  unitSellingPrice?: number;
  referenceUnitSellingPrice?: number;
  discountApplied?: boolean;
  discountPerUnit?: number;
}

/** The line's current FC price as an entry snapshot. */
export function correctionLinePrice(line: CorrectionLine): PriceSnapshot {
  const price = getItemUnitPrice(line);
  return { enteredPrice: price, enteredCurrency: "FC", priceFC: price };
}

/**
 * Normal price of a line: its saved reference, else (a legacy line) its own
 * original price in the sale being corrected — never today's product price,
 * so an old custom price is not reinterpreted as a new discount.
 */
export function correctionLineReference(line: CorrectionLine, originalLines: CorrectionLine[] = []): ReferencePrice | null {
  if (line.referenceUnitSellingPrice !== undefined && line.referenceUnitSellingPrice !== null) {
    return { priceFC: line.referenceUnitSellingPrice };
  }
  const original = originalLines.find((candidate) =>
    candidate._id === line._id && String(candidate.productId) === String(line.productId));
  return original ? { priceFC: getItemUnitPrice(original) } : null;
}

export function isCorrectionLineDiscounted(line: CorrectionLine, reference: ReferencePrice | null): boolean {
  return reference ? isDiscountedPrice(correctionLinePrice(line), reference) : false;
}

/** Applies a unit price to ONE line; its total is quantity x that unit price. */
export function withCorrectionPrice<T extends CorrectionLine>(line: T, price: PriceSnapshot, reference: ReferencePrice | null): T {
  return {
    ...line,
    enteredPrice: price.enteredPrice,
    enteredCurrency: price.enteredCurrency,
    priceFC: price.priceFC,
    price: price.enteredPrice,
    // The server recomputes the rounded accounting price.
    unitSellingPrice: undefined,
    total: price.enteredPrice * line.quantity,
    discountApplied: reference ? isDiscountedPrice(price, reference) : false,
  };
}

/**
 * A corrected cart under 5 pieces cannot keep a discount: each discounted
 * line returns to its normal price. `restored` lets the dialog say so.
 */
export function restoreCorrectionDiscounts<T extends CorrectionLine>(
  lines: T[],
  originalLines: CorrectionLine[] = []
): { lines: T[]; restored: number } {
  if (totalCartQuantity(lines) >= DISCOUNT_QUANTITY_THRESHOLD) return { lines, restored: 0 };
  let restored = 0;
  const next = lines.map((line) => {
    const reference = correctionLineReference(line, originalLines);
    if (!isCorrectionLineDiscounted(line, reference) || !reference) return line;
    const normal = referencePriceSnapshot(reference);
    if (!normal) return line;
    restored += 1;
    return withCorrectionPrice(line, normal, reference);
  });
  return { lines: restored ? next : lines, restored };
}

/**
 * A line (re)assigned to a product starts at that product's normal FC price —
 * exactly what the server validates against.
 */
export function productCorrectionLine(
  product: ProductPricing & { _id: string; name: string },
  base: { _id: string; quantity: number }
): CorrectionLine | null {
  const price = normalPriceSnapshot(product);
  if (!price) return null;
  const reference = productReferencePrice(product);
  return {
    ...base,
    productId: product._id,
    name: product.name,
    ...price,
    price: price.enteredPrice,
    total: price.enteredPrice * base.quantity,
    referenceUnitSellingPrice: reference.priceFC,
    discountApplied: false,
    discountPerUnit: 0,
  };
}
