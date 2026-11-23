// Point-of-sale cart and sale-correction rules. The shop works in Congolese
// francs only: every price is an FC amount and no exchange rate exists.
import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCY,
  createPriceSnapshot,
  getItemTotal,
  getItemUnitPrice,
  getItemsTotal,
  isAtReferencePrice,
  isDiscountedPrice,
  normalPriceSnapshot,
  productReferencePrice,
} from "../src/utils/salePricing.ts";
import {
  addCartLine,
  cartSaleItems,
  cartTotal,
  isDiscountEligible,
  isLineDiscounted,
  removeCartLine,
  repriceCartLine,
  restoreIneligibleDiscounts,
  type SaleCartLine,
} from "../src/utils/saleCart.ts";
import {
  correctionLineReference,
  productCorrectionLine,
  restoreCorrectionDiscounts,
  withCorrectionPrice,
  type CorrectionLine,
} from "../src/utils/saleCorrection.ts";

// Products as GET /api/products returns them: price and unitCost in FC.
const robe = { _id: "p-robe", name: "Robe", currency: "FC" as const, price: 20000, priceFC: 20000 };
const chemise = { _id: "p-chemise", name: "Chemise", currency: "FC" as const, price: 50000, priceFC: 50000 };

function line(cart: SaleCartLine[], product: typeof robe, quantity: number, lineId: string, price = normalPriceSnapshot(product)!) {
  return addCartLine(cart, { lineId, productId: product._id, name: product.name, quantity, reference: productReferencePrice(product), price });
}

test("a product's normal price is its exact FC price", () => {
  assert.deepEqual(productReferencePrice(robe), { priceFC: 20000 });
  assert.deepEqual(normalPriceSnapshot(robe), { enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000 });
  assert.equal(normalPriceSnapshot({ price: 0 }), null, "no price, no entry");
  assert.throws(() => createPriceSnapshot(0), /greater than zero/);
});

test("eligibility counts every physical piece in the cart", () => {
  assert.equal(isDiscountEligible([{ quantity: 4 }]), false);
  assert.equal(isDiscountEligible([{ quantity: 5 }]), true);
  assert.equal(isDiscountEligible([{ quantity: 3 }, { quantity: 2 }]), true);
  assert.equal(isDiscountEligible([1, 1, 1, 1, 1].map((quantity) => ({ quantity }))), true);
});

test("a discount changes ONE unit price; the line total is quantity x that price (8 x 45,000 FC)", () => {
  let cart = line([], chemise, 8, "a");
  cart = repriceCartLine(cart, "a", 45000);
  assert.equal(cart[0].enteredPrice, 45000);
  assert.equal(cart[0].total, 360000);
  assert.equal(cart[0].lineId, "a", "the line keeps its identity");
  assert.equal(isLineDiscounted(cart[0]), true);
});

test("each line is priced independently and lines of different prices are never merged", () => {
  let cart = line([], robe, 3, "a");
  cart = line(cart, chemise, 2, "b");
  cart = repriceCartLine(cart, "a", 18000);
  assert.deepEqual([cart[0].enteredPrice, cart[0].priceFC, cart[0].enteredCurrency], [18000, 18000, "FC"]);
  assert.equal(cart[1].enteredPrice, 50000, "the other line is untouched");
  cart = line(cart, robe, 1, "c");
  assert.equal(cart.length, 3, "same product at the normal price is a separate line");
  cart = line(cart, robe, 1, "d");
  assert.deepEqual(cart.map((item) => [item.lineId, item.quantity]), [["a", 3], ["b", 2], ["c", 2]]);
  assert.equal(cartTotal(cart), 3 * 18000 + 2 * 50000 + 2 * 20000);
});

test("discounts are compared in whole francs", () => {
  const reference = productReferencePrice(robe);
  assert.equal(isDiscountedPrice(createPriceSnapshot(18000), reference), true);
  assert.equal(isDiscountedPrice(createPriceSnapshot(20000), reference), false);
  assert.equal(isAtReferencePrice(createPriceSnapshot(20000), reference), true);
});

test("dropping under 5 pieces restores the exact normal price of each discounted line", () => {
  let cart = line([], robe, 4, "a");
  cart = line(cart, chemise, 1, "b");
  cart = repriceCartLine(cart, "a", 18000);
  cart = repriceCartLine(cart, "b", 45000);
  const { cart: after, restored } = removeCartLine(cart, "b");
  assert.equal(restored, 1);
  assert.deepEqual([after[0].enteredPrice, after[0].priceFC, after[0].enteredCurrency, after[0].total], [20000, 20000, "FC", 80000]);
  assert.equal(removeCartLine(line([], chemise, 6, "x"), "none").restored, 0);
  assert.equal(restoreIneligibleDiscounts(line([], chemise, 6, "x")).restored, 0);
});

test("the sale payload carries FC entries only, never a rate, cost or margin", () => {
  const items = cartSaleItems(repriceCartLine(line([], robe, 5, "a"), "a", 18000));
  assert.deepEqual(Object.keys(items[0]).sort(), ["enteredCurrency", "enteredPrice", "name", "price", "productId", "quantity"]);
  assert.deepEqual([items[0].price, items[0].enteredPrice, items[0].enteredCurrency], [18000, 18000, CURRENCY]);
});

test("history and receipts show the stored FC amounts", () => {
  // A line as the server returns it (pre-cutover sales are presented in FC).
  const stored = { enteredPrice: 20000, enteredCurrency: "FC", priceFC: 20000, unitSellingPrice: 20000, quantity: 3, total: 60000 };
  assert.equal(getItemUnitPrice(stored), 20000);
  assert.equal(getItemTotal(stored), 60000);
  assert.equal(getItemsTotal([stored, { ...stored, quantity: 1 }]), 80000);
  assert.equal(getItemUnitPrice({ price: 7500, quantity: 1 }), 7500);
});

const correctionLine = (overrides: Partial<CorrectionLine> = {}): CorrectionLine => ({
  _id: "l1", productId: "p-robe", name: "Robe", quantity: 5, price: 18000, total: 90000,
  enteredPrice: 18000, enteredCurrency: "FC", priceFC: 18000,
  referenceUnitSellingPrice: 20000, discountApplied: true, ...overrides,
});

test("a correction under 5 pieces restores the saved FC reference exactly", () => {
  const lines = [{ ...correctionLine(), quantity: 4 }];
  const { lines: after, restored } = restoreCorrectionDiscounts(lines, []);
  assert.equal(restored, 1);
  assert.deepEqual([after[0].enteredPrice, after[0].priceFC, after[0].enteredCurrency, after[0].discountApplied, after[0].total], [20000, 20000, "FC", false, 80000]);
  assert.equal(after[0].unitSellingPrice, undefined, "the server recomputes the accounting price");
  assert.equal(restoreCorrectionDiscounts([correctionLine()], []).restored, 0, "5 pieces keep the discount");
});

test("a legacy line's reference is its own original price, never today's product price", () => {
  const legacy: CorrectionLine = { _id: "old", productId: "p-chemise", name: "Chemise", quantity: 1, price: 34200, total: 34200 };
  assert.deepEqual(correctionLineReference({ ...legacy, price: 30000 }, [legacy]), { priceFC: 34200 });
  const repriced = withCorrectionPrice(legacy, createPriceSnapshot(34200), correctionLineReference(legacy, [legacy]));
  assert.equal(repriced.discountApplied, false);
});

test("a product added during a correction starts at its FC price", () => {
  const added = productCorrectionLine(robe, { _id: "tmp", quantity: 2 });
  assert.deepEqual([added?.enteredPrice, added?.enteredCurrency, added?.referenceUnitSellingPrice, added?.total], [20000, "FC", 20000, 40000]);
  assert.equal(productCorrectionLine({ _id: "x", name: "Sans prix" }, { _id: "tmp", quantity: 1 }), null);
});
