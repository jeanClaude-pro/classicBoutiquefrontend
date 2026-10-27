/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { setActivityHold } from "../lib/idleTimeout";
import { useTranslation } from "react-i18next";
import { currentLocale, t as translate } from "../i18n";
import { apiErrorFromPayload, fetchWithTimeout, toApiError } from "../lib/apiError";
import { MODULES } from "../config/modules";
import { notifySuccess } from "../lib/notify";
import { formatNowGMT2, formatDateGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { DollarSign, RefreshCw, Calculator, Search } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { COMPANY_PHONE } from "../config/company";
import UnitPriceInput from "../components/UnitPriceInput";
import {
  DISCOUNT_QUANTITY_THRESHOLD,
  canAddCartQuantity,
  createPriceSnapshot,
  formatFC,
  formatUSD,
  getItemFcUnitPrice,
  isDiscountedPrice,
  productReferencePrice,
  totalCartQuantity,
  type PriceSnapshot,
  type SaleCurrency,
} from "../utils/salePricing";
import {
  addCartLine,
  cartEnteredTotals,
  cartSaleItems,
  isLineDiscounted,
  rebaseCartToRate,
  removeCartLine,
  repriceCartLine,
  restoreIneligibleDiscounts,
  type SaleCartLine,
} from "../utils/saleCart";
import { PrintService } from "../services/printService";
import {
  buildSaleReceipt,
  escPosReceiptData,
  openReceiptPrintWindow,
  renderSaleReceiptHtml,
  type SaleReceiptDocument,
} from "../lib/saleReceipt";
import type { Product as DomainProduct } from "../types";
import { scopeForUser } from "../offline/db";
import { cacheProducts, getCachedProducts, getProductCacheTime } from "../offline/repositories/products";
import { cacheExchangeRate, getCachedExchangeRate } from "../offline/repositories/exchangeRates";
import { pendingQuantityByProduct } from "../offline/repositories/sales";
import { checkApiReachability } from "../offline/connectivity";
import { submitNewSale, type SubmitOutcome } from "../offline/syncManager";
import type { LocalSale, OfflineSalePayload } from "../offline/types";

// One key per checkout: a retry after a lost response replays the recorded
// sale instead of creating a second one (see POST /api/sales requestKey).
const newRequestKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type Product = DomainProduct & { sku?: string };

type CartItem = SaleCartLine;
// A client registered as a family member in the Clients module. The server
// re-checks the status at checkout; this is only the selection.
type FamilyMember = { _id: string; name: string; phone?: string; email?: string; isFamilyMember: true };

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

type UiPayment = "cash" | "mpesa" | "card" | "bank" | "other";
type ModelPayment = "cash" | "card" | "transfer" | "other";

function uiToModelPayment(pm: UiPayment): ModelPayment {
  if (pm === "cash") return "cash";
  if (pm === "card") return "card";
  if (pm === "mpesa" || pm === "bank") return "transfer";
  return "other";
}

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

export default function NewSale() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Synchronous guard: a second click can arrive before `submitting` re-renders.
  const submitLock = useRef(false);
  const requestKey = useRef(newRequestKey());
  const nextCartLineId = useRef(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  // A sale in progress defers the idle sign-out (lib/idleTimeout.ts).
  useEffect(() => {
    setActivityHold("new-sale-cart", cart.length > 0);
    return () => setActivityHold("new-sale-cart", false);
  }, [cart.length]);
  // Server refusals attached to a cart line (lineId -> message).
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<SaleReceiptDocument | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS DOUBLE M CLASSIC BOUTIQUE",
    shopAddress: "780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",
    shopNumber: COMPANY_PHONE,
    shopRegistration: "LSH/RCCM/22-A-01266",
    receiptFooter: translate("pos.defaultFooter"),
  });
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get the current user from your auth context
  const { user: currentUser, token } = useAuth();
  const scopeKey = currentUser ? scopeForUser(currentUser) : "anonymous";
  const [familyMode, setFamilyMode] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familySearch, setFamilySearch] = useState("");
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Can this user override product prices?
  const canEditPrice =
    currentUser?.role === "superadmin" ||
    currentUser?.role === "manager" ||
    (currentUser?.actionPermissions ?? []).includes("edit_receipts");

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    priceInFC: "",
    customerName: "",
    customerPhone: "",
    isWalkIn: false,
    paymentMethod: "cash" as UiPayment,
    currencyMode: "fc" as "usd" | "fc",
    priceSource: "USD" as SaleCurrency,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = currentUser?.role === "superadmin";

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load shop settings for receipts
  const loadShopSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShopSettings({
          shopName: data.shopName || "ETS DOUBLE M CLASSIC BOUTIQUE",
          shopAddress: data.shopAddress || "",
          shopNumber: COMPANY_PHONE,
          shopRegistration: data.shopRegistration || "",
          receiptFooter: data.receiptFooter || "",
        });
      }
    } catch (err) {
      console.warn("Could not load shop settings, using defaults:", err);
    }
  };

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
        try { await cacheExchangeRate(scopeKey, data); } catch (cacheError) { console.warn("Exchange-rate cache unavailable:", cacheError); }
      } else {
        const cached = await getCachedExchangeRate(scopeKey).catch(() => undefined);
        if (cached) { setExchangeRate(cached); setNotice(t("offline.cachedRate")); }
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      const cached = await getCachedExchangeRate(scopeKey).catch(() => undefined);
      if (cached) { setExchangeRate(cached); setNotice(t("offline.cachedRate")); }
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    async function loadInitialData() {
      setLoadingProducts(true);
      setError(null);
      
      try {
        // Load products, exchange rate and shop settings concurrently
        await Promise.all([
          loadProducts(),
          loadExchangeRate(),
          loadShopSettings(),
        ]);
      } catch (e: any) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    async function loadProducts() {
      try {
        const res = await fetch(`${API_BASE}/products`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const data = await readJsonSafe(res);
        if (!res.ok) {
          throw apiErrorFromPayload(res.status, data);
        }
        const list: Product[] = Array.isArray((data as any)?.products)
          ? (data as any).products
          : Array.isArray(data) && !(data as any).__nonJson
          ? (data as any)
          : [];
        try { await cacheProducts(scopeKey, list); } catch (cacheError) { console.warn("Product cache unavailable:", cacheError); }
        const pending = await pendingQuantityByProduct().catch(() => new Map<string, number>());
        if (!cancelled) setProducts(list.map((product) => ({ ...product, stock: Math.max(0, product.stock - (pending.get(product._id) || 0)) })));
      } catch (e: any) {
        // Offline stock = last authoritative snapshot minus what this device
        // sold since (queued sales and sales synced after the snapshot).
        const cached = await getCachedProducts(scopeKey).catch(() => []) as Product[];
        const snapshotAt = await getProductCacheTime(scopeKey).catch(() => undefined);
        const pending = await pendingQuantityByProduct(snapshotAt).catch(() => new Map<string, number>());
        if (!cancelled && cached.length) {
          setProducts(cached.map((product) => ({ ...product, stock: Math.max(0, product.stock - (pending.get(product._id) || 0)) })));
          setNotice(t("offline.cachedProducts"));
        } else if (!cancelled) setError(toApiError(e).message);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [scopeKey, currentUser?.id, t]);

  const product = useMemo(
    () => products.find((p) => p._id === form.productId),
    [products, form.productId]
  );

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const quantity = parseInt(form.quantity) || 0;
  const enteredPrice =
    parseFloat(form.priceSource === "FC" ? form.priceInFC : form.unitPrice) || 0;
  const currentPrice = useMemo<PriceSnapshot | null>(() => {
    if (enteredPrice <= 0) return null;

    try {
      return createPriceSnapshot(
        enteredPrice,
        form.priceSource,
        exchangeRate?.rate
      );
    } catch {
      return null;
    }
  }, [enteredPrice, exchangeRate?.rate, form.priceSource]);
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartQuantity = totalCartQuantity(cart);
  const prospectiveCartQuantity = cartQuantity + quantity;
  const discountEligible = familyMode || cartQuantity >= DISCOUNT_QUANTITY_THRESHOLD;
  const canEditSelectedPrice = canEditPrice || prospectiveCartQuantity >= DISCOUNT_QUANTITY_THRESHOLD;
  const cartOriginalTotals = cartEnteredTotals(cart);
  // Cart unit prices are edited in the currency the cashier works in.
  const editCurrency: SaleCurrency = form.currencyMode === "fc" && exchangeRate ? "FC" : "USD";

  const isFormValid =
    cart.length > 0 &&
    exchangeRate !== null &&
    (!familyMode || selectedFamilyMember !== null) &&
    (familyMode || form.isWalkIn ||
      (form.customerName.trim() !== "" && form.customerPhone.trim() !== ""));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleWalkIn() {
    if (familyMode) return;
    setForm((f) => ({
      ...f,
      isWalkIn: !f.isWalkIn,
      customerName: "",
      customerPhone: "",
    }));
  }

  // Family Sale is an online-only, superadmin-only checkout mode. Leaving it
  // puts every discount the normal quantity rule no longer allows back to its
  // normal price, exactly as removing a line from an ineligible cart does.
  async function toggleFamilyMode() {
    if (!isAdmin) return;
    setSelectedFamilyMember(null);
    setFamilySearch("");
    setFamilyMembers([]);
    setFamilyError(null);
    if (familyMode) {
      setFamilyMode(false);
      setForm((current) => ({ ...current, customerName: "", customerPhone: "" }));
      const { cart: next, restored } = restoreIneligibleDiscounts(cart);
      setCart(next);
      setNotice(restored ? t("pos.discountsRestored") : null);
      return;
    }
    if (!(await checkApiReachability(true))) {
      setError(t("familySale.onlineRequired"));
      return;
    }
    setError(null);
    setFamilyMode(true);
    setForm((current) => ({ ...current, isWalkIn: false, customerName: "", customerPhone: "" }));
  }

  // Registered family members are searched on the server (name or phone), so
  // the list is never limited to a first page of clients.
  useEffect(() => {
    if (!familyMode || selectedFamilyMember) return;
    const query = familySearch.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingFamilyMembers(true);
      try {
        const params = new URLSearchParams({ familyOnly: "true", limit: "20" });
        if (query) params.set("search", query);
        const response = await fetch(`${API_BASE}/customers?${params}`, {
          headers: { Authorization: `Bearer ${token || ""}` },
          signal: controller.signal,
        });
        const data = await readJsonSafe(response);
        if (!response.ok) throw apiErrorFromPayload(response.status, data);
        const found: FamilyMember[] = Array.isArray(data.customers) ? data.customers : [];
        setFamilyMembers(found.filter((member) => member.isFamilyMember === true));
        setFamilyError(null);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setFamilyMembers([]);
        setFamilyError(toApiError(caught).message);
      } finally {
        if (!controller.signal.aborted) setLoadingFamilyMembers(false);
      }
    }, query ? 250 : 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [familyMode, familySearch, selectedFamilyMember, token]);

  function selectFamilyMember(member: FamilyMember) {
    setSelectedFamilyMember(member);
    setFamilySearch(member.phone ? `${member.name} · ${member.phone}` : member.name);
    setForm((current) => ({ ...current, isWalkIn: false, customerName: member.name, customerPhone: member.phone || "" }));
  }

  // Normal price fields for a product, entered in its authoritative currency:
  // a price defined as 20,000 FC is recorded as 20,000 FC at whatever rate is
  // in force (only its USD value follows the rate); a $20 price stays $20.
  // Without a rate yet, an FC price leaves the USD field empty; it is filled
  // from the exact FC amount when the rate arrives.
  const normalPriceFields = (selected: Product) => {
    const rate = exchangeRate?.rate;
    const reference = productReferencePrice(selected, rate);
    const fcSource = reference.currency === "FC" && reference.priceFC !== undefined;
    return {
      unitPrice: fcSource
        ? rate ? (reference.priceFC! / rate).toString() : ""
        : reference.priceUSD ? reference.priceUSD.toString() : "",
      priceInFC: reference.priceFC !== undefined ? reference.priceFC.toString() : "",
      priceSource: (fcSource ? "FC" : "USD") as SaleCurrency,
    };
  };

  // Handle product selection from search
  const handleProductSelect = (selectedProduct: Product) => {
    setForm(prev => ({
      ...prev,
      productId: selectedProduct._id,
      ...normalPriceFields(selectedProduct),
    }));
    setSearchTerm(selectedProduct.name);
    setShowSearchResults(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
    if (!e.target.value) {
      setForm(prev => ({ ...prev, productId: "" }));
    }
  };

  // Check if adding to cart would result in negative stock
  const checkStockAfterAdd = (productId: string, quantityToAdd: number): boolean => {
    const productToCheck = products.find(p => p._id === productId);
    if (!productToCheck) return false;

    // Calculate current stock minus what's already in cart
    const currentCartQuantity = cart
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    return canAddCartQuantity(
      productToCheck.stock,
      currentCartQuantity,
      quantityToAdd
    );
  };

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
    }));
  };

  const handleUsdPriceChange = (value: string) => {
    const usdPrice = parseFloat(value);
    setForm((prev) => ({
      ...prev,
      unitPrice: value,
      priceInFC:
        exchangeRate && Number.isFinite(usdPrice)
          ? Math.round(usdPrice * exchangeRate.rate).toString()
          : "",
      priceSource: "USD",
    }));
  };

  const handleFcPriceChange = (value: string) => {
    const fcPrice = parseFloat(value);
    setForm((prev) => ({
      ...prev,
      priceInFC: value,
      unitPrice:
        exchangeRate && Number.isFinite(fcPrice)
          ? (fcPrice / exchangeRate.rate).toString()
          : "",
      priceSource: "FC",
    }));
  };

  // Populate a missing equivalent when the rate arrives without changing
  // which manually entered currency owns the price.
  useEffect(() => {
    if (!exchangeRate) return;

    setForm((prev) => {
      if (prev.priceSource === "USD" && prev.unitPrice && !prev.priceInFC) {
        return {
          ...prev,
          priceInFC: Math.round(
            parseFloat(prev.unitPrice) * exchangeRate.rate
          ).toString(),
        };
      }

      if (prev.priceSource === "FC" && prev.priceInFC && !prev.unitPrice) {
        return {
          ...prev,
          unitPrice: (
            parseFloat(prev.priceInFC) / exchangeRate.rate
          ).toString(),
        };
      }

      return prev;
    });
  }, [exchangeRate]);

  // Function to display stock information based on user role
  const renderStockInfo = (product: Product) => {
    if (isAdmin) {
      // Admin sees exact stock numbers
      return t("pos.stockCount", { count: product.stock });
    } else {
      // Staff sees stock status instead of exact numbers
      if (product.stock === 0) {
        return t("pos.outOfStockShort");
      } else if (product.stock <= 5) { // You can adjust this threshold
        return t("pos.lowStockShort");
      } else {
        return t("pos.inStockShort");
      }
    }
  };

  // Function to display available stock message based on user role
  const renderAvailableStockMessage = (product: Product, quantity: number) => {
    const canAddToCart = product && quantity > 0 && checkStockAfterAdd(product._id, quantity);
    
    if (isAdmin) {
      // Admin sees exact numbers
      const currentCartQuantity = cart
        .filter(item => item.productId === product._id)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const availableStock = product.stock - currentCartQuantity;
      
      return (
        <p className="text-sm text-gray-600 mb-4">
          {t("pos.availableStock")} <strong>{product.stock}</strong>
          {currentCartQuantity > 0 && (
            <span className="ml-2 text-blue-600">
              {t("pos.alreadyInCart", { count: currentCartQuantity })}
            </span>
          )}
          {quantity > 0 && (
            <span className={`ml-4 ${canAddToCart ? 'text-green-600' : 'text-red-600'}`}>
              {t("pos.remainingAfterSale")}{" "}
              {availableStock - quantity >= 0
                ? availableStock - quantity
                : t("pos.notEnoughStock")}
            </span>
          )}
        </p>
      );
    } else {
      // Staff sees status messages
      if (product.stock === 0) {
        return (
          <p className="text-sm text-red-600 mb-4">
            <strong>{t("pos.outOfStock")}</strong>
          </p>
        );
      } else if (product.stock <= 5) {
        return (
          <p className="text-sm text-orange-600 mb-4">
            <strong>{t("pos.lowStock")}</strong>
          </p>
        );
      } else if (quantity > 0 && !canAddToCart) {
        return (
          <p className="text-sm text-red-600 mb-4">
            <strong>{t("pos.quantityUnavailable")}</strong>
          </p>
        );
      } else if (quantity > 0) {
        return (
          <p className="text-sm text-green-600 mb-4">
            <strong>{t("pos.stockSufficient")}</strong>
          </p>
        );
      } else {
        return (
          <p className="text-sm text-green-600 mb-4">
            <strong>{t("pos.inStock")}</strong>
          </p>
        );
      }
    }
  };

  function handleAddToCart() {
    // Comprehensive validation
    if (!product) {
      setError(t("pos.selectProduct"));
      return;
    }

    if (quantity <= 0) {
      setError(t("pos.quantityPositive"));
      return;
    }

    if (!currentPrice) {
      setError(t("pos.pricePositive"));
      return;
    }

    const reference = productReferencePrice(product, exchangeRate?.rate);
    if (!familyMode && isDiscountedPrice(currentPrice, reference) && prospectiveCartQuantity < DISCOUNT_QUANTITY_THRESHOLD) {
      setError(t("pos.discountQuantityRequired"));
      return;
    }

    // Check if adding this quantity would result in negative stock
    if (!checkStockAfterAdd(product._id, quantity)) {
      setError(t("pos.insufficientStock"));
      return;
    }

    // Clear any previous errors
    setError(null);
    setNotice(null);

    // A line with the same product AND same price is merged; any other price
    // becomes its own line with its own stable lineId.
    setCart(addCartLine(cart, {
      lineId: `cart-${++nextCartLineId.current}`,
      productId: product._id,
      name: product.name,
      quantity,
      reference,
      price: currentPrice,
    }));

    // Reset form fields
    setForm((f) => ({
      ...f,
      quantity: "",
      ...normalPriceFields(product),
    }));
    setSearchTerm("");
  }

  const clearLineError = (lineId: string) =>
    setLineErrors((current) => {
      if (!(lineId in current)) return current;
      const next = { ...current };
      delete next[lineId];
      return next;
    });

  function removeFromCart(lineId: string) {
    if (familyMode) {
      setCart(cart.filter((line) => line.lineId !== lineId));
      clearLineError(lineId);
      return;
    }
    const { cart: next, restored } = removeCartLine(cart, lineId);
    setCart(next);
    clearLineError(lineId);
    setNotice(restored ? t("pos.discountsRestored") : null);
  }

  // Sets the unit price of ONE line; its total is quantity x that unit price.
  function updateCartUnitPrice(lineId: string, amount: number) {
    try {
      setCart(repriceCartLine(cart, lineId, amount, editCurrency, exchangeRate?.rate));
      clearLineError(lineId);
      setError(null);
    } catch {
      setLineErrors((current) => ({ ...current, [lineId]: t("pos.pricePositive") }));
    }
  }

  // Browser printing (fallback when the thermal printer is unavailable):
  // the same FC-only receipt and stub as the thermal printer.
  const printReceiptOnly = (doc: SaleReceiptDocument) =>
    openReceiptPrintWindow(renderSaleReceiptHtml(doc, "receipt"));

  const printStubOnly = (doc: SaleReceiptDocument) =>
    openReceiptPrintWindow(renderSaleReceiptHtml(doc, "stub"));

  // Sequential printing function
  const printSequentially = (doc: SaleReceiptDocument) => {
    // Print receipt first
    printReceiptOnly(doc);

    // Wait 2 seconds then print stub
    setTimeout(() => {
      printStubOnly(doc);
    }, 2000);
  };

  // ESC/POS printing function
  const printWithESCPOS = async (doc: SaleReceiptDocument) => {
    try {
      console.log("Attempting ESC/POS printing...");
      const payload = escPosReceiptData(doc);
      // Print receipt
      await PrintService.printReceipt(payload, "sale");
      // Print stub
      await PrintService.printStub(payload, "sale");
      console.log("ESC/POS printing successful");
      return true;
    } catch (error: any) {
      console.error(
        "ESC/POS printing failed, falling back to browser printing:",
        error
      );
      // Fallback to sequential browser printing
      printSequentially(doc);
      return false;
    }
  };

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(async () => {
        try {
          // Try ESC/POS printing first, fallback to sequential browser printing
          await printWithESCPOS(receiptData);
        } catch (error) {
          console.error("Printing failed:", error);
          // Last resort: try sequential browser printing directly
          printSequentially(receiptData);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  async function handleSale(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting || submitLock.current) return;

    submitLock.current = true;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    setNotice(null);
    setLineErrors({});
    // The server reports a refused line by its index in this exact cart.
    const submittedCart = cart;

    try {
      if (!currentUser || !exchangeRate) throw new Error(t("offline.dataUnavailable"));
      const occurredAt = new Date().toISOString();
      const clientSaleId = requestKey.current;
      const receiptNumber = `POS-${clientSaleId}`;
      const body: OfflineSalePayload = {
        customer: form.isWalkIn
          ? undefined
          : {
              name: form.customerName,
              phone: form.customerPhone,
              email: "",
            },
        isWalkIn: form.isWalkIn,
        items: cartSaleItems(submittedCart),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: uiToModelPayment(form.paymentMethod),
        salesPerson: currentUser?.username || "unknown",
        // The rate the cart was priced at; the server refuses it if stale.
        exchangeRate: exchangeRate.rate,
        requestKey: clientSaleId,
        clientSaleId,
        receiptNumber,
        occurredAt,
        offline: !familyMode,
        isFamilySale: familyMode,
        familyMemberId: familyMode ? selectedFamilyMember?._id : undefined,
      };

      const now = new Date().toISOString();
      const localSale: LocalSale = {
        clientSaleId, idempotencyKey: clientSaleId, receiptNumber,
        ownerUserId: currentUser.id, ownerName: currentUser.username, scopeKey,
        occurredAt, queuedAt: now, updatedAt: now, syncStatus: "PENDING", retryCount: 0, payload: body,
      };
      let data: Record<string, unknown> = {};
      let synced = false;
      let outcome: SubmitOutcome | null = null;
      if (familyMode) {
        // Never queued in IndexedDB and never retried offline: the server must
        // verify the role and the family status before anything is recorded.
        // A refusal throws to the error handling below with the cart intact.
        if (!(await checkApiReachability(true))) throw new Error(t("familySale.onlineRequired"));
        const response = await fetchWithTimeout(`${API_BASE}/sales`, {
          method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body),
        });
        data = await readJsonSafe(response);
        if (!response.ok) throw apiErrorFromPayload(response.status, data);
        synced = true;
      } else try {
        outcome = await submitNewSale(localSale, token);
      } catch (storageError) {
        // IndexedDB can be disabled by browser policy/private mode. Preserve
        // the established online path, but never pretend an offline sale was
        // saved when durable local storage is unavailable.
        console.warn("Offline storage unavailable; using online submission:", storageError);
        const response = await fetchWithTimeout(`${API_BASE}/sales`, {
          method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body),
        });
        data = await readJsonSafe(response);
        if (!response.ok) throw apiErrorFromPayload(response.status, data);
        synced = true;
      }
      // A refusal at the till (stock, rate, discount floor) keeps the cart and
      // goes through the established error handling below: nothing was sold.
      if (outcome?.kind === "rejected") throw outcome.error;
      if (outcome) {
        data = outcome.sale.serverSale || {};
        synced = outcome.kind === "synced";
      }

      // Get the sale ID from the API response
      const saleId = receiptNumber;
      
      // Receipt of the recorded sale: the server's stored items carry the FC
      // snapshots printed on the receipt and stub.
      const newReceiptData = buildSaleReceipt({
        shopName: shopSettings.shopName,
        shopAddress: shopSettings.shopAddress,
        shopNumber: shopSettings.shopNumber,
        shopRegistration: shopSettings.shopRegistration,
        receiptFooter: shopSettings.receiptFooter,
        customerName: form.isWalkIn ? t("pos.walkIn") : form.customerName,
        customerPhone: form.isWalkIn ? "" : form.customerPhone,
        items: Array.isArray(data.items) ? data.items : cart,
        exchangeRate: typeof data.exchangeRate === "number" ? data.exchangeRate : body.exchangeRate,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || t("pos.agent"),
        date: formatNowGMT2(),
        receiptNumber: saleId, // Use actual sale ID from API
        stubNumber: saleId, // Use actual sale ID from API for stub as well
      });

      setReceiptData(newReceiptData);
      requestKey.current = newRequestKey();
      const soldByProduct = new Map<string, number>();
      submittedCart.forEach((item) => soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + item.quantity));
      setProducts((current) => current.map((product) => ({ ...product, stock: Math.max(0, product.stock - (soldByProduct.get(product._id) || 0)) })));

      // Reset form and cart
      setForm({
        productId: "",
        quantity: "",
        unitPrice: "",
        priceInFC: "",
        customerName: "",
        customerPhone: "",
        isWalkIn: false,
        paymentMethod: form.paymentMethod,
        currencyMode: "fc",
        priceSource: "USD",
      });
      setCart([]);
      setSearchTerm("");
      setFamilyMode(false);
      setSelectedFamilyMember(null);
      setFamilySearch("");

      setMessage(synced ? t("pos.saleDonePrinting") : t("offline.saleQueued"));
      notifySuccess(synced ? t("pos.saleRecorded") : t("offline.saleQueued"));
      window.dispatchEvent(new Event("offline-sales:changed"));
    } catch (e: any) {
      const failure = toApiError(e);
      // After a network failure the sale may have been recorded: the retry
      // keeps the same key so the server replays it instead of duplicating.
      if (!failure.isNetwork) requestKey.current = newRequestKey();
      setError(failure.message);

      const itemIndex = failure.details?.itemIndex;
      const refusedLine = typeof itemIndex === "number" ? submittedCart[itemIndex] : undefined;
      if (refusedLine) setLineErrors({ [refusedLine.lineId]: failure.message });

      const serverRate = failure.details?.exchangeRate;
      if (failure.code === "EXCHANGE_RATE_CHANGED" && typeof serverRate === "number") {
        // Each line keeps the amount typed in its currency; the other currency
        // and the normal prices are recomputed at the rate now in force.
        setCart((current) => rebaseCartToRate(current, serverRate, (productId) => {
          const source = products.find((candidate) => candidate._id === productId);
          return source ? productReferencePrice(source, serverRate) : undefined;
        }));
        setExchangeRate((current) => current ? { ...current, rate: serverRate } : current);
        void loadExchangeRate();
      }
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  // Check if the product can be added to cart (comprehensive validation)
  const canAddToCart =
    product &&
    quantity > 0 &&
    currentPrice !== null &&
    checkStockAfterAdd(product._id, quantity);

  return (
    <div className="pos-page flex-1 p-6 overflow-auto">
      <div className="pos-shell max-w-7xl mx-auto">
        {/* Header with Exchange Rate */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{MODULES.pos.label}</h2>
              <p className="text-gray-600 mt-1">{MODULES.pos.description}</p>
            </div>
            
            {/* Exchange Rate Display */}
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 w-full min-w-0 sm:w-auto sm:min-w-[280px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span className="font-medium text-gray-700 whitespace-nowrap">{t("pos.todayRate")}</span>
                </div>
                {loadingRate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                ) : exchangeRate ? (
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg tabular-nums whitespace-nowrap">
                      1 USD = {new Intl.NumberFormat(currentLocale()).format(exchangeRate.rate)} FC
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("pos.effectiveSince", { date: formatDateGMT2(exchangeRate.effectiveFrom) })}
                    </div>
                  </div>
                ) : (
                  <span className="text-red-600 text-sm">{t("pos.rateUnavailable")}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {notice && (
          <div role="status" className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded">{notice}</div>
        )}

        {isAdmin && (
          <section aria-labelledby="family-sale-title" className={`mb-4 rounded-lg border px-4 py-3 ${familyMode ? "border-fuchsia-300 bg-fuchsia-50" : "border-gray-200 bg-white"}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 id="family-sale-title" className="font-semibold text-gray-900">
                  {t("familySale.title")}
                  {familyMode && <span className="ml-2 rounded border border-fuchsia-300 bg-white px-2 py-0.5 text-xs font-medium text-fuchsia-800">{t("familySale.active")}</span>}
                </h3>
                <p className="text-sm text-gray-600">{familyMode ? t("familySale.activeDescription") : t("familySale.description")}</p>
              </div>
              <button type="button" onClick={() => void toggleFamilyMode()} aria-pressed={familyMode} className="min-h-11 shrink-0 rounded-lg border border-fuchsia-700 px-4 py-2 font-medium text-fuchsia-800 hover:bg-fuchsia-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                {familyMode ? t("familySale.useNormalSale") : t("familySale.start")}
              </button>
            </div>
          </section>
        )}

        <div className="pos-workspace">
        <div className="pos-catalog-panel bg-white rounded-xl p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">{t("pos.addItems")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative" ref={searchRef}>
              <label htmlFor="new-sale-articles" className="block mb-2 font-medium text-gray-700">{t("pos.items")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="new-sale-articles"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder={t("pos.searchPlaceholder")}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingProducts || products.length === 0}
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600 flex justify-between">
                        <span>{product.sku && t("pos.sku", { sku: product.sku })}</span>
                        <span className={product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-orange-600" : "text-green-600"}>
                          {renderStockInfo(product)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showSearchResults && searchTerm && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg p-4 text-center text-gray-500">
                  {t("pos.noItemFound")}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="new-sale-quantity" className="block mb-2 font-medium text-gray-700">{t("pos.quantity")}</label>
              <input
                id="new-sale-quantity"
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder={t("pos.quantityPlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={1}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="new-sale-unit-price" className="block font-medium text-gray-700">{t("pos.unitPrice")}</label>
                <button
                  type="button"
                  onClick={toggleCurrencyMode}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  {form.currencyMode === 'usd' ? 'USD → FC' : 'FC → USD'}
                </button>
              </div>
              
              {!canEditSelectedPrice && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2">
                  {t("pos.discountLocked")}
                </p>
              )}
              {form.currencyMode === 'usd' ? (
                <input
                  id="new-sale-unit-price"
                  type="number"
                  step="0.01"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={(e) => canEditSelectedPrice && handleUsdPriceChange(e.target.value)}
                  readOnly={!canEditSelectedPrice}
                  placeholder={product?.price ? t("pos.priceExample", { price: product.price }) : t("pos.priceUsdPlaceholder")}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditSelectedPrice ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500" : "border-gray-300"}`}
                  min={0.01}
                />
              ) : (
                <input
                  id="new-sale-unit-price"
                  type="number"
                  name="priceInFC"
                  value={form.priceInFC}
                  onChange={(e) => canEditSelectedPrice && handleFcPriceChange(e.target.value)}
                  readOnly={!canEditSelectedPrice}
                  placeholder={t("pos.priceFcPlaceholder")}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditSelectedPrice ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500" : "border-gray-300"}`}
                  min={1}
                />
              )}
              
              {/* Conversion Display */}
              {form.unitPrice && form.currencyMode === 'usd' && exchangeRate && (
                <p className="text-xs text-green-600 mt-1">
                  ≈ {formatFC(parseFloat(form.unitPrice) * exchangeRate.rate)}
                </p>
              )}
              {form.priceInFC && form.currencyMode === 'fc' && exchangeRate && (
                <p className="text-xs text-green-600 mt-1">
                  ≈ {formatUSD(parseFloat(form.priceInFC) / exchangeRate.rate)}
                </p>
              )}
            </div>
          </div>

          {product && renderAvailableStockMessage(product, quantity)}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
              canAddToCart
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            } transition-colors`}
          >
            <RefreshCw className="w-4 h-4" />
            {t("pos.addToCart")}
          </button>

          {cart.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{t("pos.cartItems")}</h3>
              <div className={`mb-3 rounded-lg border px-3 py-2 text-sm ${discountEligible ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                <p>
                  {familyMode
                    ? t("familySale.discountAvailable")
                    : discountEligible
                    ? t("pos.discountAvailable")
                    : t("pos.discountProgress", { count: cartQuantity })}
                </p>
                {discountEligible && <p className="mt-1 text-xs">{t("pos.unitPriceHint")}</p>}
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t("pos.columns.items")}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("pos.columns.pieces")}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t("pos.columns.unitPrice")}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t("pos.columns.total")}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cart.map((item) => {
                      const discounted = isLineDiscounted(item);
                      const lineError = lineErrors[item.lineId];
                      const fcUnit = getItemFcUnitPrice(item);
                      const editorCurrency: SaleCurrency = editCurrency === "FC" && fcUnit !== undefined ? "FC" : "USD";
                      return (
                      <tr key={item.lineId} className={lineError ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          <span className="pos-cell-label">{t("pos.unitPriceIn", { currency: discountEligible ? editorCurrency : item.enteredCurrency })}</span>
                          {discountEligible ? (
                            <UnitPriceInput
                              id={`pos-unit-price-${item.lineId}`}
                              value={editorCurrency === "FC" ? fcUnit ?? item.enteredPrice : item.priceUSD}
                              currency={editorCurrency}
                              ariaLabel={t("pos.editUnitPriceNamed", { name: item.name })}
                              error={lineError}
                              onCommit={(amount) => updateCartUnitPrice(item.lineId, amount)}
                            />
                          ) : (
                            <>
                              {item.enteredCurrency === "FC"
                                ? formatFC(item.enteredPrice)
                                : formatUSD(item.enteredPrice)}
                              {lineError && <p role="alert" className="mt-1 text-xs text-red-600">{lineError}</p>}
                            </>
                          )}
                          {item.enteredCurrency === "FC" ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatUSD(item.priceUSD)}
                            </div>
                          ) : item.priceFC !== undefined ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatFC(item.priceFC)}
                            </div>
                          ) : null}
                          {discounted && (
                            <div className="text-xs text-emerald-700">
                              {t("pos.normalPrice", {
                                price: item.enteredCurrency === "FC" && item.reference.priceFC !== undefined
                                  ? formatFC(item.reference.priceFC)
                                  : formatUSD(item.reference.priceUSD),
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          <span className="pos-cell-label">{t("pos.columns.total")}</span>
                          {item.enteredCurrency === "FC"
                            ? formatFC(item.enteredPrice * item.quantity)
                            : formatUSD(item.enteredPrice * item.quantity)}
                          {item.enteredCurrency === "FC" ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatUSD(item.total)}
                            </div>
                          ) : item.priceFC !== undefined ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatFC(item.priceFC * item.quantity)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeFromCart(item.lineId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            aria-label={t("pos.removeNamed", { name: item.name })}
                          >
                            {t("pos.remove")}
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {t("pos.totalLabel")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {cartOriginalTotals.USD > 0 && (
                          <div>{formatUSD(cartOriginalTotals.USD)}</div>
                        )}
                        {cartOriginalTotals.FC > 0 && (
                          <div>{formatFC(cartOriginalTotals.FC)}</div>
                        )}
                        {cartOriginalTotals.FC > 0 && (
                          <div className="text-xs text-gray-500">
                            {t("pos.totalReceived", { amount: formatUSD(cartTotal) })}
                          </div>
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="pos-checkout-panel bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">{t("pos.customerInfo")}</h3>

          {familyMode && (
            <div className="mb-5 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4">
              <label htmlFor="family-member-search" className="mb-2 block font-medium text-gray-800">{t("familySale.selectMember")}</label>
              <input
                id="family-member-search"
                type="search"
                value={familySearch}
                onChange={(event) => { setFamilySearch(event.target.value); setSelectedFamilyMember(null); }}
                placeholder={t("familySale.searchPlaceholder")}
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                autoComplete="off"
                aria-describedby="family-member-help"
                aria-controls="family-member-results"
              />
              {selectedFamilyMember ? (
                <p role="status" className="mt-2 rounded-lg border border-fuchsia-300 bg-white px-3 py-2 text-sm text-fuchsia-900">
                  {t("familySale.selected", { name: selectedFamilyMember.name })}
                </p>
              ) : loadingFamilyMembers ? (
                <p role="status" className="mt-2 text-sm text-gray-600">{t("common.loading")}</p>
              ) : familyError ? (
                <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{familyError}</p>
              ) : (
                <div id="family-member-results" className="mt-2 max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white" role="listbox" aria-label={t("familySale.results")}>
                  {familyMembers.map((member) => (
                    <button key={member._id} type="button" role="option" aria-selected={false} onClick={() => selectFamilyMember(member)} className="block min-h-11 w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-fuchsia-50 focus:bg-fuchsia-50 focus:outline-none">
                      <span className="block font-medium text-gray-900">{member.name}</span>
                      {member.phone && <span className="block text-sm text-gray-600">{member.phone}</span>}
                    </button>
                  ))}
                  {!familyMembers.length && <p className="px-3 py-3 text-sm text-gray-600">{t("familySale.noMembers")}</p>}
                </div>
              )}
              <p id="family-member-help" className="mt-2 text-xs text-fuchsia-800">{t("familySale.onlineOnly")}</p>
            </div>
          )}

          {!familyMode && <label className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isWalkIn}
              onChange={toggleWalkIn}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              {t("pos.walkInOption")}
            </span>
          </label>}

          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label htmlFor="new-sale-customer-name" className="block mb-2 font-medium text-gray-700">
                {t("pos.customerName")} {!form.isWalkIn && "*"}
              </label>
              <input
                id="new-sale-customer-name"
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder={form.isWalkIn ? t("pos.walkIn") : t("pos.customerNamePlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                disabled={form.isWalkIn || familyMode}
                required={!form.isWalkIn}
              />
            </div>

            <div>
              <label htmlFor="new-sale-customer-phone" className="block mb-2 font-medium text-gray-700">
                {t("pos.customerPhone")} {!form.isWalkIn && "*"}
              </label>
              <input
                id="new-sale-customer-phone"
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder={form.isWalkIn ? "—" : t("pos.customerPhonePlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                disabled={form.isWalkIn || familyMode}
              />
            </div>

            <div>
              <label htmlFor="new-sale-payment-method" className="block mb-2 font-medium text-gray-700">
                {t("pos.paymentMethod")}
              </label>
              <select
                id="new-sale-payment-method"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cash">{t("pos.payment.cash")}</option>
                <option value="mpesa">{t("pos.payment.mpesa")}</option>
                <option value="bank">{t("pos.payment.bank")}</option>
                <option value="card">{t("pos.payment.card")}</option>
                <option value="other">{t("pos.payment.other")}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSale}
            disabled={!isFormValid || submitting}
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-base sm:text-lg ${
              isFormValid && !submitting
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            } transition-colors`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("pos.saving")}
              </span>
            ) : (
              t("pos.save")
            )}
          </button>
        </div>
        </div>

        {/* Hidden receipt container (keep as fallback) */}
        <div ref={receiptRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
