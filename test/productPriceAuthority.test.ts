// The currency in which a Product's normal selling price was defined is
// authoritative. A rate change converts the OTHER currency for new
// transactions; it never changes the authoritative amount, and recorded
// sales keep their own snapshots.
import test from "node:test";
import assert from "node:assert/strict";
import {
  createPriceSnapshot,
  getItemFcUnitPrice,
  getItemOriginalUnitPrice,
  getItemUsdUnitPrice,
  isDiscountedPrice,
  normalPriceSnapshot,
  productPriceAuthority,
  productReferencePrice,
} from "../src/utils/salePricing.ts";
import { addCartLine, rebaseCartToRate, repriceCartLine, restoreIneligibleDiscounts, type SaleCartLine } from "../src/utils/saleCart.ts";
import { productCorrectionLine } from "../src/utils/saleCorrection.ts";

// 20,000 FC defined at 2,850: `price` is only its USD value at that rate.
const fcProduct = { _id: "p-fc", name: "Robe", price: 20000 / 2850, priceEnteredAmount: 20000, priceFC: 20000, priceEnteredCurrency: "FC" as const, priceExchangeRate: 2850 };
// $20 defined at 2,850: priceFC is only its FC value at that rate.
const usdProduct = { _id: "p-usd", name: "Chemise", price: 20, priceEnteredAmount: 20, priceFC: 57000, priceEnteredCurrency: "USD" as const, priceExchangeRate: 2850 };
// Saved before entered-currency fields existed: only a USD price.
const legacyProduct = { _id: "p-old", name: "Veste", price: 30 };

const cartLine = (product: typeof fcProduct | typeof usdProduct, quantity: number, rate: number, lineId = "a"): SaleCartLine[] =>
  addCartLine([], { lineId, productId: product._id, name: product.name, quantity, reference: productReferencePrice(product, rate), price: normalPriceSnapshot(product, rate)! });

test("1-5. an FC product stays exactly 20,000 FC after the rate moves to 2,900; only USD follows", () => {
  const atOld = productReferencePrice(fcProduct, 2850);
  const atNew = productReferencePrice(fcProduct, 2900);
  assert.equal(atOld.priceFC, 20000);
  assert.equal(atNew.priceFC, 20000, "never 20,351 FC");
  assert.notEqual(atNew.priceFC, Math.round(fcProduct.price * 2900));
  assert.equal(atNew.priceUSD, 20000 / 2900);
  const entry = normalPriceSnapshot(fcProduct, 2900)!;
  assert.deepEqual([entry.enteredPrice, entry.enteredCurrency, entry.priceFC, entry.exchangeRate], [20000, "FC", 20000, 2900]);
  assert.equal(entry.priceUSD, 20000 / 2900);
});

test("6-9. a USD product stays exactly $20; its FC equivalent follows the rate (58,000 then 59,000)", () => {
  const at2900 = normalPriceSnapshot(usdProduct, 2900)!;
  assert.deepEqual([at2900.enteredPrice, at2900.enteredCurrency, at2900.priceUSD, at2900.priceFC], [20, "USD", 20, 58000]);
  const at2950 = normalPriceSnapshot(usdProduct, 2950)!;
  assert.deepEqual([at2950.priceUSD, at2950.priceFC], [20, 59000]);
  assert.notEqual(productReferencePrice(usdProduct, 2900).priceFC, usdProduct.priceFC, "the saved FC value is not authoritative");
});

test("legacy products without a price currency are USD-authoritative", () => {
  assert.deepEqual(productPriceAuthority(legacyProduct), { currency: "USD", amount: 30 });
  assert.deepEqual(productReferencePrice(legacyProduct, 2900), { currency: "USD", priceUSD: 30, priceFC: 87000 });
  // An FC record missing its FC amount falls back to its USD price.
  assert.deepEqual(productPriceAuthority({ price: 7, priceEnteredCurrency: "FC" }), { currency: "USD", amount: 7 });
});

test("12-14. an edited Product price (or a switched currency) is what future transactions use", () => {
  const raised = { ...fcProduct, priceEnteredAmount: 22000, priceFC: 22000, price: 22000 / 2900, priceExchangeRate: 2900 };
  assert.equal(normalPriceSnapshot(raised, 2900)?.enteredPrice, 22000);
  const nowUSD = { ...fcProduct, priceEnteredCurrency: "USD" as const, priceEnteredAmount: 7, price: 7, priceFC: 20300 };
  assert.deepEqual(productReferencePrice(nowUSD, 2950), { currency: "USD", priceUSD: 7, priceFC: 20650 });
  const nowFC = { ...usdProduct, priceEnteredCurrency: "FC" as const, priceEnteredAmount: 60000, priceFC: 60000, price: 60000 / 2900 };
  assert.deepEqual(productReferencePrice(nowFC, 3000), { currency: "FC", priceUSD: 20, priceFC: 60000 });
});

test("15-16. the discount reference is the authoritative normal price at the transaction rate", () => {
  // FC product at 2,900: 20,000 FC is not a discount, 19,999 FC is.
  const fcRef = productReferencePrice(fcProduct, 2900);
  assert.equal(isDiscountedPrice(createPriceSnapshot(20000, "FC", 2900), fcRef), false);
  assert.equal(isDiscountedPrice(createPriceSnapshot(19999, "FC", 2900), fcRef), true);
  // Before the fix 20,000 FC looked like a discount against a 20,351 FC reference.
  assert.equal(isDiscountedPrice(createPriceSnapshot(20000, "FC", 2900), { priceUSD: fcProduct.price, priceFC: 20351 }), true);
  // USD product: $20 (or its exact FC equivalent) is the normal price.
  const usdRef = productReferencePrice(usdProduct, 2900);
  assert.equal(isDiscountedPrice(createPriceSnapshot(20, "USD", 2900), usdRef), false);
  assert.equal(isDiscountedPrice(createPriceSnapshot(58000, "FC", 2900), usdRef), false);
  assert.equal(isDiscountedPrice(createPriceSnapshot(19.5, "USD", 2900), usdRef), true);
});

test("an FC discount restored under 5 pieces returns to the exact 20,000 FC at the new rate", () => {
  const cart = repriceCartLine(cartLine(fcProduct, 4, 2900), "a", 18000, "FC", 2900);
  const { cart: restored } = restoreIneligibleDiscounts(cart);
  assert.deepEqual([restored[0].enteredPrice, restored[0].enteredCurrency, restored[0].priceUSD], [20000, "FC", 20000 / 2900]);
});

test("19. EXCHANGE_RATE_CHANGED: an FC line keeps 20,000 FC; only its USD value is recomputed", () => {
  const cart = cartLine(fcProduct, 2, 2850);
  const rebased = rebaseCartToRate(cart, 2900, () => productReferencePrice(fcProduct, 2900));
  assert.deepEqual([rebased[0].enteredPrice, rebased[0].enteredCurrency, rebased[0].priceFC, rebased[0].exchangeRate], [20000, "FC", 20000, 2900]);
  assert.equal(rebased[0].priceUSD, 20000 / 2900);
  assert.deepEqual(rebased[0].reference, { currency: "FC", priceUSD: 20000 / 2900, priceFC: 20000 });
  assert.equal(rebased[0].lineId, "a");
});

test("20. EXCHANGE_RATE_CHANGED: a USD line keeps $20; 57,000 FC becomes 58,000 FC", () => {
  const cart = cartLine(usdProduct, 2, 2850);
  assert.equal(cart[0].priceFC, 57000);
  const rebased = rebaseCartToRate(cart, 2900, () => productReferencePrice(usdProduct, 2900));
  assert.deepEqual([rebased[0].enteredPrice, rebased[0].enteredCurrency, rebased[0].priceUSD, rebased[0].priceFC], [20, "USD", 20, 58000]);
});

test("rate change: a normal price typed in the other currency follows the authoritative price, a typed discount is kept", () => {
  // The cashier typed the $20 product's normal price in FC (57,000 FC).
  let cart = repriceCartLine(cartLine(usdProduct, 5, 2850), "a", 57000, "FC", 2850);
  cart = [...cart, ...repriceCartLine(cartLine(fcProduct, 5, 2850, "b"), "b", 18000, "FC", 2850)];
  const rebased = rebaseCartToRate(cart, 2900, (id) => productReferencePrice(id === "p-usd" ? usdProduct : fcProduct, 2900));
  assert.deepEqual([rebased[0].enteredPrice, rebased[0].enteredCurrency, rebased[0].priceFC], [20, "USD", 58000], "not a 1,000 FC discount");
  assert.deepEqual([rebased[1].enteredPrice, rebased[1].enteredCurrency, rebased[1].priceUSD], [18000, "FC", 18000 / 2900], "the typed discount is preserved");
});

test("10-11. recorded sale lines keep their snapshots whatever the product or rate now is", () => {
  const fcLine = { enteredPrice: 20000, enteredCurrency: "FC" as const, priceUSD: 20000 / 2850, priceFC: 20000, exchangeRate: 2850, unitSellingPrice: 7.02, quantity: 1, total: 7.02 };
  const usdLine = { enteredPrice: 20, enteredCurrency: "USD" as const, priceUSD: 20, priceFC: 57000, exchangeRate: 2850, unitSellingPrice: 20, quantity: 1, total: 20 };
  // Today's rate (2,900) is passed as the fallback: the snapshots win.
  assert.deepEqual([getItemFcUnitPrice(fcLine, 2900), getItemOriginalUnitPrice(fcLine), getItemUsdUnitPrice(fcLine)], [20000, 20000, 7.02]);
  assert.deepEqual([getItemFcUnitPrice(usdLine, 2900), getItemOriginalUnitPrice(usdLine), getItemUsdUnitPrice(usdLine)], [57000, 20, 20]);
});

test("a product added during a correction uses its authoritative price at the sale's own rate", () => {
  const added = productCorrectionLine(usdProduct, { _id: "tmp", quantity: 1 }, 2800);
  assert.deepEqual([added?.enteredPrice, added?.enteredCurrency, added?.priceFC, added?.referenceUnitSellingPriceFC], [20, "USD", 56000, 56000]);
  const addedFC = productCorrectionLine(fcProduct, { _id: "tmp", quantity: 1 }, 3000);
  assert.deepEqual([addedFC?.enteredPrice, addedFC?.enteredCurrency, addedFC?.referenceUnitSellingPriceFC], [20000, "FC", 20000]);
});
