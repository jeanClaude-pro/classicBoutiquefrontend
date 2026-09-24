import { currentLocale } from "../i18n/index.ts";

export type SaleCurrency = "USD" | "FC";

export interface PriceSnapshot {
  enteredPrice: number;
  enteredCurrency: SaleCurrency;
  priceUSD: number;
  priceFC?: number;
  exchangeRate?: number;
}

export interface AmountSnapshot {
  enteredAmount: number;
  enteredCurrency: SaleCurrency;
  amountUSD: number;
  amountFC?: number;
  exchangeRate?: number;
}

export interface StoredSaleItemPrice {
  price?: number;
  unitPrice?: number;
  quantity: number;
  total: number;
  enteredPrice?: number;
  enteredCurrency?: SaleCurrency;
  priceUSD?: number;
  priceFC?: number;
  exchangeRate?: number;
  unitSellingPrice?: number;
}

export function createPriceSnapshot(
  enteredPrice: number,
  enteredCurrency: SaleCurrency,
  exchangeRate?: number
): PriceSnapshot {
  if (!Number.isFinite(enteredPrice) || enteredPrice <= 0) {
    throw new Error("The entered price must be greater than zero");
  }

  if (enteredCurrency === "FC") {
    if (!exchangeRate || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new Error("A valid exchange rate is required for an FC price");
    }

    return {
      enteredPrice,
      enteredCurrency,
      priceUSD: enteredPrice / exchangeRate,
      priceFC: enteredPrice,
      exchangeRate,
    };
  }

  const validRate =
    exchangeRate && Number.isFinite(exchangeRate) && exchangeRate > 0
      ? exchangeRate
      : undefined;

  return {
    enteredPrice,
    enteredCurrency,
    priceUSD: enteredPrice,
    priceFC: validRate ? Math.round(enteredPrice * validRate) : undefined,
    exchangeRate: validRate,
  };
}

export function createAmountSnapshot(
  enteredAmount: number,
  enteredCurrency: SaleCurrency,
  exchangeRate?: number
): AmountSnapshot {
  const price = createPriceSnapshot(enteredAmount, enteredCurrency, exchangeRate);
  return {
    enteredAmount: price.enteredPrice,
    enteredCurrency: price.enteredCurrency,
    amountUSD: price.priceUSD,
    amountFC: price.priceFC,
    exchangeRate: price.exchangeRate,
  };
}

export function getItemUsdUnitPrice(item: StoredSaleItemPrice): number {
  return item.unitSellingPrice ?? item.priceUSD ?? item.price ?? item.unitPrice ?? 0;
}

export function getItemUsdTotal(item: StoredSaleItemPrice): number {
  return getItemUsdUnitPrice(item) * item.quantity;
}

export function getItemOriginalUnitPrice(item: StoredSaleItemPrice): number {
  return item.enteredPrice ?? item.price ?? item.unitPrice ?? 0;
}

export function getItemOriginalTotal(item: StoredSaleItemPrice): number {
  return getItemOriginalUnitPrice(item) * item.quantity;
}

export function getItemOriginalCurrency(
  item: StoredSaleItemPrice
): SaleCurrency {
  return item.enteredCurrency ?? "USD";
}

export function getItemFcUnitPrice(item: StoredSaleItemPrice, saleRate?: number): number | undefined {
  if (item.enteredCurrency === "FC" && item.enteredPrice !== undefined) return item.enteredPrice;
  if (item.priceFC !== undefined) return item.priceFC;
  const rate = item.exchangeRate ?? saleRate;
  return rate ? Math.round(getItemUsdUnitPrice(item) * rate) : undefined;
}

export function getItemFcTotal(item: StoredSaleItemPrice, saleRate?: number): number | undefined {
  const unit = getItemFcUnitPrice(item, saleRate);
  return unit === undefined ? undefined : unit * item.quantity;
}

export function getSaleFcTotal(totalUSD: number, items: StoredSaleItemPrice[], saleRate?: number): number | undefined {
  const itemTotals = items.map((item) => getItemFcTotal(item, saleRate));
  if (itemTotals.length && itemTotals.every((value) => value !== undefined)) {
    return itemTotals.reduce((sum, value) => sum + (value ?? 0), 0);
  }
  return saleRate ? Math.round(totalUSD * saleRate) : undefined;
}

export function formatFC(amount: number | undefined | null): string {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  return `${new Intl.NumberFormat(currentLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))} FC`;
}

export function formatUSD(amount: number | undefined | null): string {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// Discount eligibility is the physical quantity of the whole cart, never the
// number of distinct products. The server applies the same rule and is the
// authority; the protected price floor is only ever known server-side.
export const DISCOUNT_QUANTITY_THRESHOLD = 5;

export function totalCartQuantity(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Selling-price fields of a Product as returned by GET /api/products. */
export interface ProductPricing {
  price?: number;
  priceFC?: number;
  priceEnteredAmount?: number;
  priceEnteredCurrency?: SaleCurrency;
  priceExchangeRate?: number;
}

export interface ReferencePrice {
  priceUSD: number;
  priceFC?: number;
  /** Currency in which a catalogue normal price is authoritative. */
  currency?: SaleCurrency;
}

/**
 * The amount and currency in which the Product's normal selling price was
 * defined. A product saved before priceEnteredCurrency existed only ever had
 * the USD price, so it is USD-authoritative. Mirrors productPriceAuthority in
 * server/utils/salePricing.js.
 */
export function productPriceAuthority(product: ProductPricing): { currency: SaleCurrency; amount: number } {
  if (product.priceEnteredCurrency === "FC") {
    const fc = product.priceEnteredAmount ?? product.priceFC;
    if (typeof fc === "number" && Number.isFinite(fc) && fc > 0) return { currency: "FC", amount: fc };
  }
  const usd = product.priceEnteredCurrency === "USD" ? product.priceEnteredAmount ?? product.price : product.price;
  return { currency: "USD", amount: usd ?? 0 };
}

// The product's normal unit price for a NEW transaction at `rate`. The
// authoritative amount is kept exactly and only the other currency follows
// the rate: 20,000 FC stays 20,000 FC at any rate (USD = 20,000 / rate) and
// $20 stays $20 (FC = 20 x rate). The FC amount is never rebuilt from a USD
// value saved at an older rate. Mirrors productNormalPrice on the server.
// Recorded sales never use this: they keep their own snapshots.
export function productReferencePrice(product: ProductPricing, rate?: number): ReferencePrice {
  const { currency, amount } = productPriceAuthority(product);
  const validRate = rate !== undefined && Number.isFinite(rate) && rate > 0 ? rate : undefined;
  if (currency === "FC") {
    return { currency, priceUSD: validRate ? amount / validRate : product.price ?? 0, priceFC: amount };
  }
  return validRate ? { currency, priceUSD: amount, priceFC: Math.round(amount * validRate) } : { currency, priceUSD: amount };
}

/** The reference price expressed as an entered-price snapshot in `currency`. */
export function referencePriceSnapshot(
  reference: ReferencePrice,
  currency: SaleCurrency,
  rate?: number
): PriceSnapshot | null {
  const amount = currency === "FC" ? reference.priceFC : reference.priceUSD;
  if (amount === undefined || !(amount > 0)) return null;
  try {
    return createPriceSnapshot(amount, currency, rate);
  } catch {
    return null;
  }
}

/**
 * The product's normal price as an entry in its authoritative currency: the
 * exact FC amount of an FC-defined price, the exact USD amount otherwise.
 * An FC price needs a rate to be recorded, so there is none without one.
 */
export function normalPriceSnapshot(product: ProductPricing, rate?: number): PriceSnapshot | null {
  const reference = productReferencePrice(product, rate);
  return referencePriceSnapshot(reference, reference.currency ?? "USD", rate);
}

/** True when an entry is exactly the normal price, compared in its own currency. */
export function isAtReferencePrice(price: PriceSnapshot, reference: ReferencePrice): boolean {
  if (price.enteredCurrency === "FC") return reference.priceFC !== undefined && price.enteredPrice === reference.priceFC;
  return Math.round(price.priceUSD * 100) === Math.round(reference.priceUSD * 100);
}

// Same comparison as the server: an FC entry against the FC reference in
// whole francs, a USD entry in cents.
export function isDiscountedPrice(price: PriceSnapshot, reference: ReferencePrice): boolean {
  if (price.enteredCurrency === "FC" && reference.priceFC !== undefined) {
    return price.enteredPrice < reference.priceFC;
  }
  return Math.round(price.priceUSD * 100) < Math.round(reference.priceUSD * 100);
}

export function canAddCartQuantity(
  backendStock: number,
  quantityAlreadyInCart: number,
  quantityToAdd: number
): boolean {
  return backendStock - quantityAlreadyInCart >= quantityToAdd;
}
