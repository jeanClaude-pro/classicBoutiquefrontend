import test from "node:test";
import assert from "node:assert/strict";
import {
  createPriceSnapshot,
  getItemFcTotal,
  getItemFcUnitPrice,
  getSaleFcTotal,
  isDiscountedPrice,
  normalPriceSnapshot,
  productReferencePrice,
} from "../src/utils/salePricing.ts";
import {
  addCartLine,
  cartSaleItems,
  isDiscountEligible,
  isLineDiscounted,
  rebaseCartToRate,
  removeCartLine,
  repriceCartLine,
  type SaleCartLine,
} from "../src/utils/saleCart.ts";
import {
  correctionLineReference,
  productCorrectionLine,
  restoreCorrectionDiscounts,
  withCorrectionPrice,
  type CorrectionLine,
} from "../src/utils/saleCorrection.ts";

const RATE = 2850;
// A product whose selling price was defined as 20,000 FC at 2,850.
const fcProduct = { _id: "p-fc", name: "Robe", price: 20000 / RATE, priceFC: 20000, priceEnteredCurrency: "FC" as const, priceExchangeRate: RATE };
const usdProduct = { _id: "p-usd", name: "Chemise", price: 50 };

function line(cart: SaleCartLine[], product: typeof fcProduct | typeof usdProduct, quantity: number, lineId: string, price = normalPriceSnapshot(product, RATE)!) {
  return addCartLine(cart, { lineId, productId: product._id, name: product.name, quantity, reference: productReferencePrice(product, RATE), price });
}

test("the normal price of an FC-priced product is its exact FC amount at any rate", () => {
  assert.deepEqual(productReferencePrice(fcProduct, RATE), { currency: "FC", priceUSD: 20000 / RATE, priceFC: 20000 });
  assert.equal(normalPriceSnapshot(fcProduct, RATE)?.enteredCurrency, "FC");
  assert.equal(normalPriceSnapshot(fcProduct, RATE)?.enteredPrice, 20000);
  // At another rate the FC amount stays exact; only its USD value follows.
  assert.deepEqual(productReferencePrice(fcProduct, 2900), { currency: "FC", priceUSD: 20000 / 2900, priceFC: 20000 });
  assert.equal(normalPriceSnapshot(usdProduct, RATE)?.enteredCurrency, "USD");
});

test("eligibility counts every physical piece in the cart", () => {
  assert.equal(isDiscountEligible([{ quantity: 4 }]), false);
  assert.equal(isDiscountEligible([{ quantity: 5 }]), true);
  assert.equal(isDiscountEligible([{ quantity: 3 }, { quantity: 2 }]), true);
  assert.equal(isDiscountEligible([1, 1, 1, 1, 1].map((quantity) => ({ quantity }))), true);
});

test("a discount changes ONE unit price; the line total is quantity x that price (8 x $45 = $360)", () => {
  let cart = line([], usdProduct, 8, "a");
  cart = repriceCartLine(cart, "a", 45, "USD", RATE);
  assert.equal(cart[0].enteredPrice, 45);
  assert.equal(cart[0].total, 360);
  assert.equal(cart[0].lineId, "a", "the line keeps its identity");
  assert.equal(isLineDiscounted(cart[0]), true);
});

test("each line is priced independently and lines of different prices are never merged", () => {
  let cart = line([], fcProduct, 3, "a");
  cart = line(cart, usdProduct, 2, "b");
  cart = repriceCartLine(cart, "a", 18000, "FC", RATE);
  assert.deepEqual([cart[0].enteredPrice, cart[0].priceFC, cart[0].enteredCurrency], [18000, 18000, "FC"]);
  assert.equal(cart[1].enteredPrice, 50, "the other line is untouched");
  cart = line(cart, fcProduct, 1, "c");
  assert.equal(cart.length, 3, "same product at the normal price is a separate line");
  cart = line(cart, fcProduct, 1, "d");
  assert.deepEqual(cart.map((item) => [item.lineId, item.quantity]), [["a", 3], ["b", 2], ["c", 2]]);
});

test("an FC discount of 18,000 stays 18,000 FC and is compared in whole francs", () => {
  const price = createPriceSnapshot(18000, "FC", RATE);
  assert.equal(isDiscountedPrice(price, productReferencePrice(fcProduct, RATE)), true);
  assert.equal(isDiscountedPrice(createPriceSnapshot(20000, "FC", RATE), productReferencePrice(fcProduct, RATE)), false);
});

test("dropping under 5 pieces restores the exact normal price of each discounted line", () => {
  let cart = line([], fcProduct, 4, "a");
  cart = line(cart, usdProduct, 1, "b");
  cart = repriceCartLine(cart, "a", 18000, "FC", RATE);
  cart = repriceCartLine(cart, "b", 45, "USD", RATE);
  const { cart: after, restored } = removeCartLine(cart, "b");
  assert.equal(restored, 1);
  assert.deepEqual([after[0].enteredPrice, after[0].priceFC, after[0].enteredCurrency, after[0].total], [20000, 20000, "FC", (20000 / RATE) * 4]);
  assert.equal(removeCartLine(line([], usdProduct, 6, "x"), "none").restored, 0);
});

test("a new server rate keeps each entered amount and recomputes only the other currency", () => {
  let cart = repriceCartLine(line([], fcProduct, 5, "a"), "a", 18000, "FC", RATE);
  cart = line(cart, usdProduct, 1, "b");
  const rebased = rebaseCartToRate(cart, 2900, (id) => productReferencePrice(id === "p-fc" ? fcProduct : usdProduct, 2900));
  assert.deepEqual([rebased[0].enteredPrice, rebased[0].priceFC, rebased[0].exchangeRate], [18000, 18000, 2900]);
  assert.equal(rebased[0].priceUSD, 18000 / 2900);
  assert.deepEqual([rebased[1].enteredPrice, rebased[1].priceFC], [50, 145000]);
});

test("the sale payload carries entry snapshots only, never cost or margin", () => {
  const items = cartSaleItems(repriceCartLine(line([], fcProduct, 5, "a"), "a", 18000, "FC", RATE));
  assert.deepEqual(Object.keys(items[0]).sort(), ["enteredCurrency", "enteredPrice", "exchangeRate", "name", "price", "priceFC", "priceUSD", "productId", "quantity"]);
  assert.equal(items[0].enteredPrice, 18000);
});

test("history and receipts show a stored 20,000 FC, never 7.02 x 2,850 = 20,007", () => {
  // Shape of a line returned by the server: cent-rounded USD accounting price.
  const stored = { enteredPrice: 20000, enteredCurrency: "FC" as const, priceUSD: 20000 / RATE, priceFC: 20000, exchangeRate: RATE, unitSellingPrice: 7.02, quantity: 3, total: 21.06 };
  assert.equal(getItemFcUnitPrice(stored, 2900), 20000);
  assert.equal(getItemFcTotal(stored, 2900), 60000);
  assert.equal(getSaleFcTotal(21.06, [stored], 2900), 60000);
});

const correctionLine = (overrides: Partial<CorrectionLine> = {}): CorrectionLine => ({
  _id: "l1", productId: "p-fc", name: "Robe", quantity: 5, price: 18000 / RATE, total: (18000 / RATE) * 5,
  enteredPrice: 18000, enteredCurrency: "FC", priceUSD: 18000 / RATE, priceFC: 18000, exchangeRate: RATE,
  referenceUnitSellingPrice: 7.02, referenceUnitSellingPriceFC: 20000, discountApplied: true, ...overrides,
});

test("a correction under 5 pieces restores the saved FC reference exactly", () => {
  const lines = [{ ...correctionLine(), quantity: 4 }];
  const { lines: after, restored } = restoreCorrectionDiscounts(lines, [], RATE);
  assert.equal(restored, 1);
  assert.deepEqual([after[0].enteredPrice, after[0].priceFC, after[0].enteredCurrency, after[0].discountApplied], [20000, 20000, "FC", false]);
  assert.equal(after[0].unitSellingPrice, undefined, "the server recomputes the accounting price");
  assert.equal(restoreCorrectionDiscounts([correctionLine()], [], RATE).restored, 0, "5 pieces keep the discount");
});

test("a legacy line's reference is its own original price, never today's product price", () => {
  const legacy: CorrectionLine = { _id: "old", productId: "p-usd", name: "Chemise", quantity: 1, price: 12, total: 12 };
  assert.deepEqual(correctionLineReference({ ...legacy, price: 10 }, [legacy], RATE), { priceUSD: 12, priceFC: 34200 });
  const repriced = withCorrectionPrice(legacy, createPriceSnapshot(12, "USD", RATE), correctionLineReference(legacy, [legacy], RATE));
  assert.equal(repriced.discountApplied, false);
});

test("a product added during a correction uses the sale's historical rate", () => {
  const added = productCorrectionLine(fcProduct, { _id: "tmp", quantity: 2 }, RATE);
  assert.deepEqual([added?.enteredPrice, added?.enteredCurrency, added?.referenceUnitSellingPriceFC, added?.exchangeRate], [20000, "FC", 20000, RATE]);
});
