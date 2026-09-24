// Pure helpers for the sale correction dialog. They mirror the
// server's rules (server/routes/sales.js) so the dialog shows what will be
// accepted; the server re-validates everything and remains the authority.
import {
  DISCOUNT_QUANTITY_THRESHOLD,
  getItemFcUnitPrice,
  getItemOriginalCurrency,
  getItemOriginalUnitPrice,
  getItemUsdUnitPrice,
  isDiscountedPrice,
  normalPriceSnapshot,
  productReferencePrice,
  referencePriceSnapshot,
  totalCartQuantity,
  type PriceSnapshot,
  type ProductPricing,
  type ReferencePrice,
  type SaleCurrency,
} from "./salePricing.ts";

export interface CorrectionLine {
  _id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  enteredPrice?: number;
  enteredCurrency?: SaleCurrency;
  priceUSD?: number;
  priceFC?: number;
  exchangeRate?: number;
  unitSellingPrice?: number;
  referenceUnitSellingPrice?: number;
  referenceUnitSellingPriceFC?: number;
  discountApplied?: boolean;
  discountPerUnit?: number;
}

/** The line's current price as an entry snapshot (legacy lines included). */
export function correctionLinePrice(line: CorrectionLine): PriceSnapshot {
  return {
    enteredPrice: getItemOriginalUnitPrice(line),
    enteredCurrency: getItemOriginalCurrency(line),
    priceUSD: line.priceUSD ?? line.price,
    priceFC: line.priceFC,
    exchangeRate: line.exchangeRate,
  };
}

/**
 * Normal price of a line: its saved reference, else (a legacy line) its own
 * original price in the sale being corrected — never today's product price,
 * so an old custom price is not reinterpreted as a new discount.
 */
export function correctionLineReference(
  line: CorrectionLine,
  originalLines: CorrectionLine[] = [],
  saleRate?: number
): ReferencePrice | null {
  if (line.referenceUnitSellingPrice !== undefined) {
    return { priceUSD: line.referenceUnitSellingPrice, priceFC: line.referenceUnitSellingPriceFC };
  }
  const original = originalLines.find((candidate) =>
    candidate._id === line._id && String(candidate.productId) === String(line.productId));
  return original
    ? { priceUSD: getItemUsdUnitPrice(original), priceFC: getItemFcUnitPrice(original, saleRate) }
    : null;
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
    priceUSD: price.priceUSD,
    priceFC: price.priceFC,
    exchangeRate: price.exchangeRate,
    price: price.priceUSD,
    // The server recomputes the cent-rounded accounting price.
    unitSellingPrice: undefined,
    total: price.priceUSD * line.quantity,
    discountApplied: reference ? isDiscountedPrice(price, reference) : false,
  };
}

/**
 * A corrected cart under 5 pieces cannot keep a discount: each discounted
 * line returns to its normal price in its own entered currency (exact FC
 * reference for an FC line). `restored` lets the dialog say so.
 */
export function restoreCorrectionDiscounts<T extends CorrectionLine>(
  lines: T[],
  originalLines: CorrectionLine[] = [],
  saleRate?: number
): { lines: T[]; restored: number } {
  if (totalCartQuantity(lines) >= DISCOUNT_QUANTITY_THRESHOLD) return { lines, restored: 0 };
  let restored = 0;
  const next = lines.map((line) => {
    const reference = correctionLineReference(line, originalLines, saleRate);
    if (!isCorrectionLineDiscounted(line, reference) || !reference) return line;
    const normal = referencePriceSnapshot(reference, getItemOriginalCurrency(line), line.exchangeRate ?? saleRate);
    if (!normal) return line;
    restored += 1;
    return withCorrectionPrice(line, normal, reference);
  });
  return { lines: restored ? next : lines, restored };
}

/**
 * A line (re)assigned to a product starts at that product's normal price at
 * the sale's own historical rate — exactly what the server validates against.
 */
export function productCorrectionLine(
  product: ProductPricing & { _id: string; name: string },
  base: { _id: string; quantity: number },
  saleRate?: number
): CorrectionLine | null {
  const price = normalPriceSnapshot(product, saleRate);
  if (!price) return null;
  const reference = productReferencePrice(product, saleRate);
  return {
    ...base,
    productId: product._id,
    name: product.name,
    ...price,
    price: price.priceUSD,
    total: price.priceUSD * base.quantity,
    referenceUnitSellingPrice: reference.priceUSD,
    referenceUnitSellingPriceFC: reference.priceFC,
    discountApplied: false,
    discountPerUnit: 0,
  };
}
