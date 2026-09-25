/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { currentLocale, t as translate } from "../i18n";
import { apiErrorFromPayload, toApiError } from "../lib/apiError";
import { MODULES } from "../config/modules";
import { notifySuccess } from "../lib/notify";
import { formatNowGMT2, formatDateGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { DollarSign, RefreshCw, Calculator, Search } from "lucide-react";
import { serverUrl } from "../utils/constants";
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
  type ProductPricing,
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

// One key per checkout: a retry after a lost response replays the recorded
// sale instead of creating a second one (see POST /api/sales requestKey).
const newRequestKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface Product extends ProductPricing {
  _id: string;
  name: string;
  sku?: string;
  stock: number;
}

type CartItem = SaleCartLine;

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
    shopNumber: "+243 975 085 799",
    shopRegistration: "LSH/RCCM/22-A-01266",
    receiptFooter: translate("pos.defaultFooter"),
  });
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

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
          shopNumber: data.shopNumber || "",
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
      } else {
        console.warn('Failed to load exchange rate');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
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
        if (!cancelled) setProducts(list);
      } catch (e: any) {
        if (!cancelled) setError(toApiError(e).message);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const discountEligible = cartQuantity >= DISCOUNT_QUANTITY_THRESHOLD;
  const canEditSelectedPrice = canEditPrice || prospectiveCartQuantity >= DISCOUNT_QUANTITY_THRESHOLD;
  const cartOriginalTotals = cartEnteredTotals(cart);
  // Cart unit prices are edited in the currency the cashier works in.
  const editCurrency: SaleCurrency = form.currencyMode === "fc" && exchangeRate ? "FC" : "USD";

  const isFormValid =
    cart.length > 0 &&
    (form.isWalkIn ||
      (form.customerName.trim() !== "" && form.customerPhone.trim() !== ""));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleWalkIn() {
    setForm((f) => ({
      ...f,
      isWalkIn: !f.isWalkIn,
      customerName: "",
      customerPhone: "",
    }));
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
    if (isDiscountedPrice(currentPrice, reference) && prospectiveCartQuantity < DISCOUNT_QUANTITY_THRESHOLD) {
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

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
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
      const body = {
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
        exchangeRate: exchangeRate?.rate,
        requestKey: requestKey.current,
      };

      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw apiErrorFromPayload(res.status, data);
      }

      // Get the sale ID from the API response
      const saleId = data.saleId || data._id;
      
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
        exchangeRate: data.exchangeRate ?? body.exchangeRate,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || t("pos.agent"),
        date: formatNowGMT2(),
        receiptNumber: saleId, // Use actual sale ID from API
        stubNumber: saleId, // Use actual sale ID from API for stub as well
      });

      setReceiptData(newReceiptData);
      requestKey.current = newRequestKey();

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

      setMessage(
        t("pos.saleDonePrinting")
      );
      notifySuccess(t("pos.saleRecorded"));
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full min-w-0 sm:w-auto sm:min-w-[280px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{t("pos.todayRate")}</span>
                </div>
                {loadingRate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : exchangeRate ? (
                  <div className="text-right">
                    <div className="font-bold text-blue-800 text-lg">
                      1 USD = {new Intl.NumberFormat(currentLocale()).format(exchangeRate.rate)} FC
                    </div>
                    <div className="text-xs text-blue-600">
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

        <div className="pos-workspace">
        <div className="pos-catalog-panel bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
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
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
                  {discountEligible
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

        <div className="pos-checkout-panel bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">{t("pos.customerInfo")}</h3>

          <label className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isWalkIn}
              onChange={toggleWalkIn}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              {t("pos.walkInOption")}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                disabled={form.isWalkIn}
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
                disabled={form.isWalkIn}
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
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
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
