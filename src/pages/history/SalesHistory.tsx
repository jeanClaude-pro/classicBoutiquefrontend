"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { describeTimeframeFr, formatDateTimeGMT2, formatMonthNameGMT2 } from "../../utils/dateUtils";
import { paymentMethodLabel, saleStatusLabel, saleTypeLabel } from "../../lib/labels";
import { serverUrl } from "../../utils/constants";
import {
  Search,
  FileText,
  Eye,
  Download,
  User,
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Printer,
  Calendar,
  History,
  Filter,
  ChevronDown,
  Shield,
} from "lucide-react";
import jsPDF from "jspdf";
import { apiErrorFromResponse, requestJson, toApiError } from "../../lib/apiError";
import { notifySuccess } from "../../lib/notify";
import { voidSaleCopy } from "../../lib/confirmationCopy";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { MODULES } from "../../config/modules";
import { useTranslation } from "react-i18next";
import { t as translate } from "../../i18n";
import UnitPriceInput from "../../components/UnitPriceInput";
import {
  buildSaleReceipt,
  formatReceiptFC,
  openReceiptPrintWindow,
  renderSaleReceiptHtml,
} from "../../lib/saleReceipt";
import {
  DISCOUNT_QUANTITY_THRESHOLD,
  createPriceSnapshot,
  formatFC,
  formatUSD,
  getItemOriginalCurrency,
  getItemOriginalTotal,
  getItemOriginalUnitPrice,
  getItemFcTotal,
  getSaleFcTotal,
  getItemUsdTotal,
  isDiscountedPrice,
  productPriceAuthority,
  totalCartQuantity,
  type PriceSnapshot,
  type ProductPricing,
  type ReferencePrice,
  type SaleCurrency,
} from "../../utils/salePricing";
import {
  correctionLineReference,
  productCorrectionLine,
  restoreCorrectionDiscounts,
  withCorrectionPrice,
} from "../../utils/saleCorrection";

interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
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

// Shapes returned by GET /api/sales (see server/routes/sales.js).
interface SalesSummary {
  totalRecords: number;
  revenue: number;
  revenueFC?: number;
  expenses: number;
  net: number;
  netFC?: number;
  salesCount: number;
  expensesCount: number;
  [key: string]: unknown;
}
type AppliedFilters = Record<string, string | undefined>;

// Stored edit history is free-form; legacy entries may hold plain values or null.
type EditChange = { from: unknown; to: unknown };
const asChange = (value: unknown): EditChange =>
  value !== null && typeof value === "object" && ("from" in value || "to" in value)
    ? { from: (value as EditChange).from, to: (value as EditChange).to }
    : { from: undefined, to: value };
const changeEntries = (changes: Record<string, unknown> | null | undefined) =>
  Object.entries(changes || {}).map(([field, value]) => [field, asChange(value)] as const);

interface EditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: Record<string, unknown> | null;
  reason: string;
  _id?: string;
}

interface Sale {
  _id: string;
  saleId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  salesPerson?: string;
  editedBy?: string;
  editedAt?: string;
  editHistory?: EditHistoryEntry[];
  type?: string;
  isWalkIn?: boolean;
  exchangeRate?: number;
}

interface Product extends ProductPricing {
  _id: string;
  name: string;
  stock: number;
  price: number;
  sku?: string;
}

// User interface for role checking — matches what the server returns
interface User {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
  permissions?: string[];
  actionPermissions?: string[];
}

// Timeframe metadata interface
interface TimeframeMetadata {
  description: string;
  start: string;
  end: string;
  query: {
    from: string | null;
    to: string | null;
    date: string | null;
    year: string | null;
    month: string | null;
  };
}

// Response interface for timeframe API
interface SalesResponse {
  success: boolean;
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timeframe: TimeframeMetadata;
  summary: {
    totalRecords: number;
    revenue: number;
    revenueFC?: number;
    expenses: number;
    net: number;
    netFC?: number;
    salesCount: number;
    expensesCount: number;
  };
  filtersApplied: {
    customerPhone: string;
    status: string;
    type: string;
  };
  performanceNote: string | null;
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to get current year
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export default function SalesHistory() {
  const { t } = useTranslation();
  const { token: authToken } = useAuth();

  // Always prefer the React auth context token; fall back to localStorage
  const getToken = useCallback(
    () => authToken || localStorage.getItem("token") || "",
    [authToken]
  );

  // Ref always points to the latest fetchSales — prevents stale closure in event listener
  const fetchSalesRef = useRef<() => void>(() => {});

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS DOUBLE M CLASSIC BOUTIQUE",
    shopAddress: "780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",
    shopNumber: "+243 975 085 799",
    shopRegistration: "LSH/RCCM/22-A-01266",
    // Empty: the receipt then uses its own thank-you line in the interface language.
    receiptFooter: "",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState({
    customer: { name: "", phone: "", email: "" },
    items: [] as SaleItem[],
    paymentMethod: "cash",
    reason: "",
    isWalkIn: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Correction modal: refusals per line (_id -> message) and discount notices.
  const [editLineErrors, setEditLineErrors] = useState<Record<string, string>>({});
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // User state for role checking
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Reprinting an existing receipt is available to every authenticated user.
  // This flag is intentionally independent from all edit/void/override rights.
  const canReprint = Boolean(currentUser);
  const confirmAction = useConfirmAction();

  // Timeframe state - Updated to match backend query parameters
  const [timeframeType, setTimeframeType] = useState<
    "custom" | "day" | "month" | "year" | "today"
  >("today");
  
  // Query parameters for timeframe
  const [queryParams, setQueryParams] = useState({
    from: "",
    to: "",
    date: getTodayDate(),
    year: getCurrentYear().toString(),
    month: getCurrentMonth().split('-')[1],
    type: "",
    status: "",
    customerPhone: "",
    category: ""
  });

  // NEW: Edited sales filter state
  const [showEditedSales, setShowEditedSales] = useState(false);
  const [editedSales, setEditedSales] = useState<Sale[]>([]);
  const [selectedEditedSale, setSelectedEditedSale] = useState<Sale | null>(null);
  const [showEditedDetailsModal, setShowEditedDetailsModal] = useState(false);

  // Timeframe metadata
  const [timeframeMetadata, setTimeframeMetadata] = useState<TimeframeMetadata | null>(null);
  const [summaryStats, setSummaryStats] = useState<SalesSummary | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SalesResponse["pagination"] | null>(null);

  // Historical FC totals are never reconstructed with the current rate.
  // Period FC summaries come from saved transaction snapshots.

  // Fetch current user on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchSales();
    fetchProducts();
    fetch(`${serverUrl}/settings/receipt`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setShopSettings({
            shopName: data.shopName || "ETS DOUBLE M CLASSIC BOUTIQUE",
            shopAddress: data.shopAddress || "",
            shopNumber: data.shopNumber || "",
            shopRegistration: data.shopRegistration || "",
            receiptFooter: data.receiptFooter || "",
          });
        }
      })
      .catch(() => {});
    const handleSalesUpdate = () => {
      fetchSalesRef.current();
    };

    window.addEventListener("salesUpdated", handleSalesUpdate);

    return () => {
      window.removeEventListener("salesUpdated", handleSalesUpdate);
    };
  }, []);

  // Fetch sales when query params change
  useEffect(() => {
    if (Object.keys(queryParams).length > 0) {
      fetchSales();
    }
  }, [queryParams, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryParams, searchTerm]);

  // Fetch current user from localStorage (with API fallback)
  const fetchCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAdmin(userData.role === "superadmin");
        return;
      }

      // Fallback: /users/me is the correct endpoint
      const res = await fetch(`${serverUrl}/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
        setIsAdmin(userData.role === "superadmin");
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsAdmin(false);
    }
  };

  // Keep normal sales visible while excluding expense records.
  const filterValidSales = (sales: Sale[]): Sale[] => {
    return sales.filter((sale: Sale) => {
      const nonSaleStatuses = ['expense', 'depense'];
      const isValidStatus = !nonSaleStatuses.includes(sale.status?.toLowerCase());
      
      const isSaleStructure = Boolean(sale.saleId) && Array.isArray(sale.items);
      
      return isValidStatus && isSaleStructure;
    }).map((sale) => (sale.customer
      ? sale
      // Sales recorded by earlier versions may have no customer object;
      // they stay visible instead of silently disappearing from the history.
      : { ...sale, customer: { name: translate("salesHistory.customerMissing"), phone: "", email: "" } }));
  };

  // Build query string from queryParams
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", "50");
    params.set("type", "sale");
    
    // Add timeframe parameters based on timeframeType
    switch(timeframeType) {
      case "custom":
        if (queryParams.from) params.append("from", queryParams.from);
        if (queryParams.to) params.append("to", queryParams.to);
        break;
      case "day":
        if (queryParams.date) params.append("date", queryParams.date);
        break;
      case "month":
        if (queryParams.year) params.append("year", queryParams.year);
        if (queryParams.month) params.append("month", queryParams.month);
        break;
      case "year":
        if (queryParams.year) params.append("year", queryParams.year);
        break;
      case "today":
        // No parameters needed - backend defaults to today
        break;
    }
    
    // Add additional filters
    if (queryParams.status) params.append("status", queryParams.status);
    if (queryParams.customerPhone) params.append("customerPhone", queryParams.customerPhone);
    if (isAdmin && queryParams.category) params.append("category", queryParams.category);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    
    return params.toString();
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const url = `${serverUrl}/sales${queryString ? `?${queryString}` : ''}`;
      
      console.log("Fetching sales from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const data: SalesResponse = await res.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const fetchedSales = data.data;
          
          console.log(`Fetched ${fetchedSales.length} sales from API`);
          console.log("Timeframe metadata:", data.timeframe);
          console.log("Summary stats:", data.summary);
          
          // Filter out expenses and invalid sales
          const validSales = filterValidSales(fetchedSales);
          console.log(`After filtering: ${validSales.length} valid sales`);
          
          // Update sales state
          setSales(validSales);
          setPagination(data.pagination || null);
          
          // Update metadata
          setTimeframeMetadata(data.timeframe);
          setSummaryStats(data.summary);
          setAppliedFilters(data.filtersApplied);
          
          // Update edited sales
          updateEditedSales(validSales);
        } else {
          console.warn("Unexpected sales data structure:", data);
          setError(t("salesHistory.unexpectedResponse"));
        }
      } else {
        setError(t("salesHistory.loadFailed", { message: (await apiErrorFromResponse(res)).message }));
      }
    } catch (error) {
      setError(t("salesHistory.loadFailed", { message: toApiError(error).message }));
    } finally {
      setLoading(false);
    }
  };

  // Keep ref pointing to latest fetchSales so event listeners never use a stale closure
  fetchSalesRef.current = fetchSales;

  // Update edited sales when sales change
  const updateEditedSales = (salesList: Sale[]) => {
    // Filter sales that have editHistory or editedBy field
    const edited = salesList.filter(sale => 
      (sale.editHistory && sale.editHistory.length > 0) || sale.editedBy
    );

    // Sort by edit date (newest first)
    const sortedEditedSales = edited.sort((a, b) => {
      const dateA = a.editedAt ? new Date(a.editedAt).getTime() : new Date(a.updatedAt).getTime();
      const dateB = b.editedAt ? new Date(b.editedAt).getTime() : new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    setEditedSales(sortedEditedSales);
  };

  // Handle timeframe type change
  const handleTimeframeTypeChange = (type: "custom" | "day" | "month" | "year" | "today") => {
    setTimeframeType(type);
    
    // Reset specific query params based on type
    const newParams = { ...queryParams };
    
    switch(type) {
      case "today":
        // Reset all specific date params
        newParams.date = getTodayDate();
        newParams.from = "";
        newParams.to = "";
        newParams.year = getCurrentYear().toString();
        newParams.month = getCurrentMonth().split('-')[1];
        break;
      case "day":
        newParams.date = getTodayDate();
        newParams.from = "";
        newParams.to = "";
        break;
      case "month":
        newParams.year = getCurrentYear().toString();
        newParams.month = getCurrentMonth().split('-')[1];
        newParams.date = "";
        newParams.from = "";
        newParams.to = "";
        break;
      case "year":
        newParams.year = getCurrentYear().toString();
        newParams.month = "";
        newParams.date = "";
        newParams.from = "";
        newParams.to = "";
        break;
      case "custom":
        // Keep existing values or set defaults
        if (!newParams.from) {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          newParams.from = firstDay.toISOString().split('T')[0];
        }
        if (!newParams.to) {
          newParams.to = new Date().toISOString().split('T')[0];
        }
        newParams.date = "";
        newParams.year = "";
        newParams.month = "";
        break;
    }
    
    setQueryParams(newParams);
  };

  // Handle query parameter changes
  const handleQueryParamChange = (key: keyof typeof queryParams, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setQueryParams({
      from: "",
      to: "",
      date: getTodayDate(),
      year: getCurrentYear().toString(),
      month: getCurrentMonth().split('-')[1],
      type: "",
      status: "",
      customerPhone: "",
      category: ""
    });
    setTimeframeType("today");
    setShowEditedSales(false);
    setSearchTerm("");
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${serverUrl}/products?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        let productsArray: Product[] = [];

        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (data && typeof data === "object") {
          productsArray = [data];
        }

        console.log("Processed products:", productsArray.length);
        setProducts(productsArray);
      } else {
        console.error("Products API Error:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredSales = showEditedSales 
    ? editedSales.filter(sale =>
        sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.phone.includes(searchTerm) ||
        (sale.salesPerson && sale.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sales.filter(sale =>
        sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.phone.includes(searchTerm) ||
        (sale.salesPerson && sale.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatCurrency = formatUSD;
  const formatFc = formatFC;
  // Catalogue price in the currency it was defined in (never a sale snapshot).
  const formatProductPrice = (product: ProductPricing) => {
    const { currency, amount } = productPriceAuthority(product);
    return currency === "FC" ? formatFc(amount) : formatCurrency(amount);
  };

  const formatOriginalItemUnitPrice = (item: SaleItem) =>
    getItemOriginalCurrency(item) === "FC"
      ? formatFc(getItemOriginalUnitPrice(item))
      : formatCurrency(getItemOriginalUnitPrice(item));

  const formatOriginalItemTotal = (item: SaleItem) =>
    getItemOriginalCurrency(item) === "FC"
      ? formatFc(getItemOriginalTotal(item))
      : formatCurrency(getItemOriginalTotal(item));

  // Get human-readable timeframe description
  const getTimeframeDescription = () => {
    if (timeframeMetadata) {
      return describeTimeframeFr(timeframeMetadata.description);
    }

    switch(timeframeType) {
      case "day":
        return queryParams.date ? describeTimeframeFr(`Day: ${queryParams.date}`) : t("dates.today");
      case "month":
        return queryParams.year && queryParams.month
          ? describeTimeframeFr(`Month: ${queryParams.year}-${queryParams.month.padStart(2, '0')}`)
          : t("salesHistory.thisMonth");
      case "year":
        return queryParams.year ? describeTimeframeFr(`Year: ${queryParams.year}`) : t("salesHistory.thisYear");
      case "custom":
        return describeTimeframeFr(`Custom range: ${queryParams.from || "Beginning"} to ${queryParams.to || "Now"}`);
      default:
        return t("dates.today");
    }
  };

  // NEW: Function to view edited sale details
  const viewEditedSaleDetails = (sale: Sale) => {
    setSelectedEditedSale(sale);
    setShowEditedDetailsModal(true);
  };

  // NEW: Function to render change comparison
  const renderChangeComparison = (sale: Sale) => {
    if (!sale.editHistory || sale.editHistory.length === 0) return null;

    const latestEdit = sale.editHistory[sale.editHistory.length - 1];
    const changes = latestEdit.changes;

    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <History className="w-4 h-4" />
          {t("salesHistory.lastEdit")}
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("salesHistory.editedBy")}:</span>
            <span className="font-medium">{latestEdit.editedBy || sale.editedBy || t("salesHistory.notProvided")}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("salesHistory.editDate")}:</span>
            <span className="font-medium">{formatDate(latestEdit.editedAt || sale.editedAt || sale.updatedAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("salesHistory.reason")}:</span>
            <span className="font-medium text-right">{latestEdit.reason}</span>
          </div>

          {changes && Object.keys(changes).length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2">{t("salesHistory.changes")}:</h5>
              {changeEntries(changes).map(([field, changeData]) => (
                <div key={field} className="mb-2 last:mb-0">
                  <div className="font-medium text-yellow-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-600 font-medium">{t("salesHistory.before")}:</div>
                      <div className="truncate">{JSON.stringify(changeData.from)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-600 font-medium">{t("salesHistory.after")}:</div>
                      <div className="truncate">{JSON.stringify(changeData.to)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Customer receipt of a stored sale (reprint and PDF), in the interface
  // language. Every amount is FC from the sale's own snapshots, so an old
  // sale reprints with the francs it was sold for, whatever today's rate.
  const saleReceiptDocument = (sale: Sale) => buildSaleReceipt({
    ...shopSettings,
    receiptNumber: sale.saleId,
    date: formatDate(sale.createdAt),
    customerName: sale.isWalkIn ? translate("pos.walkIn") : sale.customer?.name || "",
    customerPhone: sale.customer?.phone || "",
    customerEmail: sale.customer?.email || "",
    items: sale.items,
    exchangeRate: sale.exchangeRate,
    paymentMethod: sale.paymentMethod,
    salesPerson: sale.salesPerson || translate("salesHistory.notSpecified"),
  });

  // Reprint in the 80mm browser print dialog (same template as a new sale).
  const printESC_POSReceipt = async (sale: Sale) => {
    openReceiptPrintWindow(renderSaleReceiptHtml(saleReceiptDocument(sale), "receipt"));
  };

  const generateReceiptPDF = async (sale: Sale) => {
    const receipt = saleReceiptDocument(sale);
    const { labels } = receipt;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text(receipt.shopName, 105, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text(labels.tagline.replace(/_/g, ""), 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(receipt.shopRegistration, 105, 20, { align: "center" });
    doc.text(`${labels.tel}: ${receipt.shopNumber}`, 105, 25, { align: "center" });
    doc.text(receipt.shopAddress, 105, 30, { align: "center" });

    doc.setFontSize(16);
    doc.text(labels.title, 105, 37, { align: "center" });

    // Sale Info
    doc.setFontSize(10);
    doc.text(`${labels.dateShort}: ${receipt.date}`, 20, 47);
    doc.text(`${labels.receiptNoShort}: ${receipt.receiptNumber}`, 20, 53);
    doc.text(`${labels.payment}: ${receipt.paymentLabel}`, 20, 59);
    doc.text(`${translate("saleReceipt.status")}: ${saleStatusLabel(sale.status).toUpperCase()}`, 20, 65);
    doc.text(`${labels.agent}: ${receipt.salesPerson}`, 20, 71);

    // Customer Info
    doc.text(`${labels.customer}: ${receipt.customerName}`, 20, 81);
    let yPos = 87;
    if (receipt.customerPhone) {
      doc.text(`${labels.phone}: ${receipt.customerPhone}`, 20, yPos);
      yPos += 6;
    }
    if (receipt.customerEmail) {
      doc.text(`${labels.email}: ${receipt.customerEmail}`, 20, yPos);
      yPos += 6;
    }

    // Items: ARTICLE | PU | QTE | TOTAL, FC only
    const columns = { article: 20, unit: 138, qty: 152, total: 190 };
    const tableHeader = (y: number) => {
      doc.setFont("helvetica", "bold");
      doc.text(labels.item, columns.article, y);
      doc.text(labels.unitPrice, columns.unit, y, { align: "right" });
      doc.text(labels.qty, columns.qty, y, { align: "center" });
      doc.text(labels.total, columns.total, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.line(20, y + 2, 190, y + 2);
      return y + 7;
    };
    yPos = tableHeader(yPos + 6);

    receipt.lines.forEach((line) => {
      const nameRows: string[] = doc.splitTextToSize(line.name, 88);
      if (yPos + nameRows.length * 5 > 270) {
        doc.addPage();
        yPos = tableHeader(20);
      }
      doc.text(nameRows, columns.article, yPos);
      doc.text(formatReceiptFC(line.unitFC), columns.unit, yPos, { align: "right" });
      doc.text(String(line.quantity), columns.qty, yPos, { align: "center" });
      doc.text(formatReceiptFC(line.totalFC), columns.total, yPos, { align: "right" });
      yPos += nameRows.length * 5 + 2;
    });

    // Totals
    doc.line(20, yPos - 2, 190, yPos - 2);
    yPos += 4;
    doc.text(`${labels.subtotal}:`, 20, yPos);
    doc.text(formatReceiptFC(receipt.subtotalFC), columns.total, yPos, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`${labels.total}:`, 20, yPos + 6);
    doc.text(formatReceiptFC(receipt.totalFC), columns.total, yPos + 6, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Footer
    doc.text(receipt.receiptFooter || labels.thanks, 105, yPos + 20, { align: "center" });
    doc.text(`${labels.noExchange} - ${labels.noRefund}`, 105, yPos + 28, { align: "center" });

    doc.save(`receipt-${sale.saleId}.pdf`);
  };

  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (sale: Sale) => {
    if (sale.status === "voided" || sale.status === "corrected") {
      setError(t("salesHistory.notEditable"));
      return;
    }

    setEditingSale(sale);
    setEditForm({
      customer: { ...sale.customer },
      items: sale.items.map((item) => ({ ...item })),
      paymentMethod: sale.paymentMethod,
      reason: "",
      isWalkIn: Boolean(sale.isWalkIn),
    });
    setEditLineErrors({});
    setEditNotice(null);
    setShowEditModal(true);
    setError(null);

    // Ensure products are loaded
    if (products.length === 0) {
      await fetchProducts();
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSale(null);
    setEditForm({
      customer: { name: "", phone: "", email: "" },
      items: [],
      paymentMethod: "cash",
      reason: "",
      isWalkIn: false,
    });
    setEditLineErrors({});
    setEditNotice(null);
    setError(null);
  };

  const toggleEditWalkIn = () => {
    setEditForm((prev) => ({
      ...prev,
      isWalkIn: !prev.isWalkIn,
      customer: prev.isWalkIn
        ? prev.customer
        : { name: "", phone: "", email: "" },
    }));
  };

  // Normal price of a correction line, mirroring the server.
  const lineReference = (item: SaleItem): ReferencePrice | null =>
    correctionLineReference(item, editingSale?.items, editingSale?.exchangeRate);

  // A corrected cart under 5 pieces cannot keep a discount: every discounted
  // line returns to its normal price in its own currency, and the user is told.
  const withEligibleDiscounts = (items: SaleItem[]): SaleItem[] => {
    const { lines, restored } = restoreCorrectionDiscounts(items, editingSale?.items, editingSale?.exchangeRate);
    setEditNotice(restored ? translate("pos.discountsRestored") : null);
    return lines;
  };

  const clearEditLineError = (itemId: string) =>
    setEditLineErrors((current) => {
      if (!(itemId in current)) return current;
      const next = { ...current };
      delete next[itemId];
      return next;
    });

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const current = editForm.items[index];
    const product = products.find((p) => p._id === current.productId);

    if (product && newQuantity > product.stock + current.quantity) {
      setError(t("salesHistory.insufficientStock", { stock: product.stock }));
      return;
    }

    const updatedItems = withEligibleDiscounts(editForm.items.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity, total: newQuantity * (item.priceUSD ?? item.price) } : item
    ));

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  // Commits the unit price of ONE line in the currency it was entered in, so
  // an FC line stays an exact FC amount.
  const updateItemPrice = (index: number, newPrice: number) => {
    const current = editForm.items[index];
    const itemRate = current.exchangeRate ?? editingSale?.exchangeRate;
    let snapshot: PriceSnapshot;
    try {
      snapshot = createPriceSnapshot(newPrice, getItemOriginalCurrency(current), itemRate);
    } catch {
      setEditLineErrors((errors) => ({ ...errors, [current._id]: translate("pos.pricePositive") }));
      return;
    }
    const reference = lineReference(current);
    if (reference && isDiscountedPrice(snapshot, reference) && totalCartQuantity(editForm.items) < DISCOUNT_QUANTITY_THRESHOLD) {
      setEditLineErrors((errors) => ({ ...errors, [current._id]: translate("pos.discountQuantityRequired") }));
      return;
    }
    clearEditLineError(current._id);
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? withCorrectionPrice(item, snapshot, reference) : item)),
    }));
  };

  const removeItem = (index: number) => {
    const removed = editForm.items[index];
    const updatedItems = withEligibleDiscounts(editForm.items.filter((_, i) => i !== index));
    if (removed) clearEditLineError(removed._id);
    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const productLine = (product: Product, base: Pick<SaleItem, "_id" | "quantity">): SaleItem | null =>
    productCorrectionLine(product, base, editingSale?.exchangeRate);

  const addNewItem = () => {
    if (products.length === 0) {
      setError(t("salesHistory.noProductsAvailable"));
      return;
    }

    const newItem = productLine(products[0], {
      _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quantity: 1,
    });
    if (!newItem) return;

    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      setError(t("salesHistory.productNotFound"));
      return;
    }

    const current = editForm.items[index];
    const replacement = productLine(product, { _id: current._id, quantity: current.quantity });
    if (!replacement) return;
    clearEditLineError(current._id);
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? replacement : item)),
    }));
    setError(null);
  };

  const calculateTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, total: subtotal };
  };

  const requestVoid = (sale: Sale) => {
    if (sale.status === "voided") return;
    confirmAction.request({
      ...voidSaleCopy(sale),
      reason: { label: t("salesHistory.voidReasonLabel"), placeholder: t("salesHistory.voidReasonPlaceholder") },
      action: (reason) => requestJson(`${serverUrl}/sales/${sale._id}/void`, { method: "PATCH", body: { reason: reason || "Vente annulée" } }),
      onSuccess: async () => {
        setShowModal(false);
        await fetchSales();
        window.dispatchEvent(new Event("salesUpdated"));
      },
      onError: async (error) => { if (error.isConflict || error.status === 404) await fetchSales(); },
    });
  };

  const handleEditSale = async () => {
    if (!editingSale) return;

    if (editForm.items.length === 0) {
      setError(t("salesHistory.needsItem"));
      return;
    }

    if (!editForm.isWalkIn && (!editForm.customer.name || !editForm.customer.phone)) {
      setError(t("salesHistory.customerRequired"));
      return;
    }

    if (!editForm.reason) {
      setError(t("salesHistory.reasonRequired"));
      return;
    }

    try {
      setLoading(true);

      // Calculate totals properly
      const { subtotal, total } = calculateTotals();

      // Make sure we're sending the correct data structure
      const updateData = {
        customer: editForm.isWalkIn
          ? { name: "Client de passage", phone: "", email: "" }
          : editForm.customer,
        isWalkIn: editForm.isWalkIn,
        items: editForm.items.map((item) => ({
          _id: item._id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          enteredPrice: item.enteredPrice,
          enteredCurrency: item.enteredCurrency,
          priceUSD: item.priceUSD,
          priceFC: item.priceFC,
          exchangeRate: item.exchangeRate,
        })),
        subtotal: subtotal,
        total: total,
        exchangeRate: editingSale.exchangeRate,
        paymentMethod: editForm.paymentMethod,
        reason: editForm.reason,
        // Include the original sale ID to ensure update, not create
        _id: editingSale._id,
        saleId: editingSale.saleId, // Keep the same sale ID
      };

      const response = await fetch(
        `${serverUrl}/sales/${editingSale._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        await response.json();
        setMessage(`✅ ${t("salesHistory.editSaved")}`);
        notifySuccess(t("salesHistory.editSaved"));

        // Refresh the sales list immediately
        await fetchSales();

        // Also refresh customers to update their statistics
        setTimeout(() => {
          window.dispatchEvent(new Event("salesUpdated"));
        }, 1000);

        closeEditModal();
      } else {
        const failure = await apiErrorFromResponse(response);
        setError(failure.message);
        const itemIndex = failure.details?.itemIndex;
        const refused = typeof itemIndex === "number" ? editForm.items[itemIndex] : undefined;
        if (refused) setEditLineErrors({ [refused._id]: failure.message });
        if (failure.isConflict) await fetchSales();
      }
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {MODULES.sales.label}
          </h1>
          <p className="text-gray-600">
            {MODULES.sales.description}
          </p>
        </div>
        <div className="flex gap-3">
          {/* NEW: Edited Sales Filter Button */}
          <button
            onClick={() => setShowEditedSales(!showEditedSales)}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
              showEditedSales
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {showEditedSales ? t("salesHistory.allSales") : t("salesHistory.editedSales")}
            {showEditedSales && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {editedSales.length}
              </span>
            )}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("salesHistory.searchPlaceholder")}
              aria-label={t("salesHistory.searchLabel")}
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats - ONLY VISIBLE TO ADMINS */}
      {isAdmin && summaryStats && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t("salesHistory.summary.title")}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.records")}</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.totalRecords}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.revenue")}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summaryStats.revenueFC !== undefined ? formatFc(summaryStats.revenueFC) : "—"}
                  </p>
                  <p className="text-xs text-gray-500">{formatCurrency(summaryStats.revenue)}</p>
                </div>
                <Download className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.legacyExpenses")}</p>
                  <p className="text-[11px] text-gray-500">{t("salesHistory.summary.legacyExpensesHint")}</p>
                  <p className="text-2xl font-bold text-red-600">—</p>
                  <p className="text-xs text-gray-500">{formatCurrency(summaryStats.expenses)}</p>
                </div>
                <Minus className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.net")}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summaryStats.netFC !== undefined ? formatFc(summaryStats.netFC) : "—"}
                  </p>
                  <p className="text-xs text-gray-500">{formatCurrency(summaryStats.net)}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
          
          {/* Additional stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.salesCount")}</p>
                  <p className="text-xl font-bold text-green-700">{summaryStats.salesCount}</p>
                </div>
                <FileText className="w-6 h-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("salesHistory.summary.legacyExpensesCount")}</p>
                  <p className="text-xl font-bold text-red-700">{summaryStats.expensesCount}</p>
                </div>
                <Minus className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Filter Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            {showEditedSales ? t("salesHistory.editedSales") : t("salesHistory.allSales")} - {getTimeframeDescription()}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? t("salesHistory.filters.hide") : t("salesHistory.filters.show")}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t("salesHistory.filters.reset")}
            </button>
          </div>
        </div>

        {/* Timeframe Selection */}
        {showFilters && (
          <div className="space-y-4">
            <div>
              <span id="sales-history-timeframe-type" className="block text-sm font-medium text-gray-700 mb-2">
                {t("salesHistory.filters.period")}
              </span>
              <div role="group" aria-labelledby="sales-history-timeframe-type" className="flex flex-wrap gap-2">
                {(["today", "day", "month", "year", "custom"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTimeframeTypeChange(type)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      timeframeType === type
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {t(`salesHistory.filters.timeframes.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific timeframe inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {timeframeType === "day" && (
                <div>
                  <label htmlFor="sales-history-date" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("common.date")}
                  </label>
                  <input
                    id="sales-history-date"
                    type="date"
                    value={queryParams.date}
                    onChange={(e) => handleQueryParamChange("date", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {timeframeType === "month" && (
                <>
                  <div>
                    <label htmlFor="sales-history-month-year" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.year")}
                    </label>
                    <input
                      id="sales-history-month-year"
                      type="number"
                      value={queryParams.year}
                      onChange={(e) => handleQueryParamChange("year", e.target.value)}
                      min="2000"
                      max="2100"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="sales-history-month" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.month")}
                    </label>
                    <select
                      id="sales-history-month"
                      value={queryParams.month}
                      onChange={(e) => handleQueryParamChange("month", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthNum = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={monthNum} value={monthNum}>
                            {formatMonthNameGMT2(i)} ({monthNum})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              {timeframeType === "year" && (
                <div>
                  <label htmlFor="sales-history-year" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("salesHistory.filters.year")}
                  </label>
                  <input
                    id="sales-history-year"
                    type="number"
                    value={queryParams.year}
                    onChange={(e) => handleQueryParamChange("year", e.target.value)}
                    min="2000"
                    max="2100"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {timeframeType === "custom" && (
                <>
                  <div>
                    <label htmlFor="sales-history-from-date" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.from")}
                    </label>
                    <input
                      id="sales-history-from-date"
                      type="date"
                      value={queryParams.from}
                      onChange={(e) => handleQueryParamChange("from", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="sales-history-to-date" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.to")}
                    </label>
                    <input
                      id="sales-history-to-date"
                      type="date"
                      value={queryParams.to}
                      onChange={(e) => handleQueryParamChange("to", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Advanced Filters */}
            <div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showAdvancedFilters ? t("salesHistory.filters.hideAdvanced") : t("salesHistory.filters.advanced")}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  {isAdmin && (
                    <div>
                      <label htmlFor="sales-history-categorie" className="block text-sm font-medium text-gray-700 mb-1">{t("salesHistory.filters.category")}</label>
                      <select
                        id="sales-history-categorie"
                        value={queryParams.category}
                        onChange={(e) => handleQueryParamChange("category", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">{t("salesHistory.filters.all")}</option>
                        <option value="CLOTHES">{t("confirm.categories.CLOTHES")}</option>
                        <option value="SHOES">{t("confirm.categories.SHOES")}</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor="sales-history-sale-type" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.operationType")}
                    </label>
                    <select
                      id="sales-history-sale-type"
                      value={queryParams.type}
                      onChange={(e) => handleQueryParamChange("type", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t("salesHistory.filters.allTypes")}</option>
                      {(["sale", "reservation", "expense"] as const).map((value) => (
                        <option key={value} value={value}>{saleTypeLabel(value)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sales-history-status" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.status")}
                    </label>
                    <select
                      id="sales-history-status"
                      value={queryParams.status}
                      onChange={(e) => handleQueryParamChange("status", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t("salesHistory.filters.allStatuses")}</option>
                      {(["completed", "pending", "voided"] as const).map((value) => (
                        <option key={value} value={value}>{saleStatusLabel(value)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sales-history-customer-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.filters.customerPhone")}
                    </label>
                    <input
                      id="sales-history-customer-phone"
                      type="text"
                      value={queryParams.customerPhone}
                      onChange={(e) => handleQueryParamChange("customerPhone", e.target.value)}
                      placeholder={t("salesHistory.filters.phonePlaceholder")}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applied Filters Summary */}
        {appliedFilters && (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">{t("salesHistory.filters.applied")}</span>
            <span className="ml-2">
              {t("salesHistory.filters.appliedStatus", { value: appliedFilters.status && appliedFilters.status !== "all" ? saleStatusLabel(appliedFilters.status) : t("salesHistory.filters.any") })}, {t("salesHistory.filters.appliedType", { value: appliedFilters.type && appliedFilters.type !== "all" ? saleTypeLabel(appliedFilters.type) : t("salesHistory.filters.any") })}
              {appliedFilters.customerPhone && appliedFilters.customerPhone !== 'none' && `, ${t("salesHistory.filters.appliedPhone", { value: appliedFilters.customerPhone })}`}
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {showEditedSales ? t("salesHistory.editedSales") : t("salesHistory.transactions")} ({filteredSales.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">{t("salesHistory.loading")}</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {showEditedSales 
                  ? t("salesHistory.noEditedSales") 
                  : t("salesHistory.noSales")
                }
              </p>
              <p className="text-sm">{t("salesHistory.forPeriod")}</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.saleId")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.customer")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.agent")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.items")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.total")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.payment")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.cols.editedBy")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.saleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-2">
                          {sale.isWalkIn ? t("pos.walkIn") : sale.customer.name}
                          {sale.isWalkIn && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {t("salesHistory.walkInBadge")}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.salesPerson || t("salesHistory.notSpecified")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t("salesHistory.itemCount", { count: sale.items.length })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatFc(getSaleFcTotal(sale.total, sale.items, sale.exchangeRate) ?? 0)}
                        <div className="text-xs font-normal text-gray-500">≈ {formatCurrency(sale.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {paymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            sale.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : sale.status === "voided"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {saleStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const modifier =
                            (sale.editHistory && sale.editHistory.length > 0
                              ? sale.editHistory[sale.editHistory.length - 1].editedBy
                              : null) || sale.editedBy;
                          return modifier ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200">
                              ✏️ {modifier}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {showEditedSales ? (
                            <button
                              onClick={() => viewEditedSaleDetails(sale)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title={t("salesHistory.actions.viewEdits")}
                            >
                              <History className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => viewSaleDetails(sale)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title={t("salesHistory.actions.view")}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!showEditedSales && (
                            <>
                              <button
                                onClick={() => openEditModal(sale)}
                                disabled={
                                  sale.status === "voided" ||
                                  sale.status === "corrected"
                                }
                                className={`p-1 rounded ${
                                  sale.status === "voided" ||
                                  sale.status === "corrected"
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-yellow-600 hover:text-yellow-900"
                                }`}
                                title={t("salesHistory.actions.correct")}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {canReprint && (
                                <>
                                  <button
                                    onClick={() => generateReceiptPDF(sale)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                    title={t("salesHistory.actions.downloadPdf")}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => printESC_POSReceipt(sale)}
                                    className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                    title={t("salesHistory.actions.reprint")}
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {isAdmin && <button
                                onClick={() => requestVoid(sale)}
                                disabled={sale.status === "voided" || confirmAction.busy}
                                className={`p-1 rounded ${
                                  sale.status === "voided"
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-900"
                                }`}
                                title={t("salesHistory.actions.void")}
                                aria-label={t("salesHistory.actions.voidSale", { id: sale.saleId })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <span className="text-sm text-gray-600">
            {t("salesHistory.pagination", { page: pagination.page, pages: pagination.totalPages, count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t("salesHistory.previous")}
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t("salesHistory.next")}
            </button>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("salesHistory.details.title")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("salesHistory.cols.saleId")}
                  </span>
                  <p className="text-sm text-gray-900">{selectedSale.saleId}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("common.date")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("salesHistory.details.paymentMethod")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {paymentMethodLabel(selectedSale.paymentMethod)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("salesHistory.cols.status")}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedSale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : selectedSale.status === "voided"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {saleStatusLabel(selectedSale.status)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("salesHistory.cols.agent")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedSale.salesPerson || t("salesHistory.notSpecified")}
                  </p>
                </div>
                {selectedSale.editedBy && (
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.lastEdit")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedSale.editedAt
                        ? t("salesHistory.details.editedByOn", { user: selectedSale.editedBy, date: formatDate(selectedSale.editedAt) })
                        : t("salesHistory.details.editedByOnly", { user: selectedSale.editedBy })}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("salesHistory.details.customerInfo")}
                  {selectedSale.isWalkIn && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {t("pos.walkIn")}
                    </span>
                  )}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("salesHistory.details.name")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedSale.isWalkIn ? t("pos.walkIn") : selectedSale.customer.name}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("common.phone")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedSale.customer.phone}
                      </p>
                    </div>
                    {selectedSale.customer.email && (
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.email")}
                        </span>
                        <p className="text-sm text-gray-900">
                          {selectedSale.customer.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("salesHistory.details.items", { count: selectedSale.items.length })}
                </h4>
                <div className="space-y-3">
                  {selectedSale.items.map((item, index) => (
                    <div key={item._id ?? index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {item.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {t("salesHistory.details.pieces", { count: item.quantity })} ×{" "}
                            {formatOriginalItemUnitPrice(item)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatOriginalItemTotal(item)}
                            {item.enteredCurrency === "FC" ? (
                              <span className="block text-xs font-normal text-gray-500">
                                {t("salesHistory.details.received")}: {formatCurrency(getItemUsdTotal(item))}
                              </span>
                            ) : (
                              (() => {
                                const fc = getItemFcTotal(item, selectedSale.exchangeRate);
                                return fc !== undefined ? (
                                  <span className="block text-xs font-normal text-gray-500">
                                    ≈ {formatFc(fc)}
                                  </span>
                                ) : null;
                              })()
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show edit history if available */}
              {selectedSale.editHistory && selectedSale.editHistory.length > 0 && (
                renderChangeComparison(selectedSale)
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t("salesHistory.details.subtotal")}:</span>
                  <span className="text-sm text-gray-900 text-right">
                    <span className="block">
                      {formatFc(getSaleFcTotal(selectedSale.subtotal, selectedSale.items, selectedSale.exchangeRate) ?? 0)}
                    </span>
                    <span className="block text-xs text-gray-500">≈ {formatCurrency(selectedSale.subtotal)}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">{t("salesHistory.details.total")}:</span>
                  <span className="text-gray-900 text-right">
                    <span className="block">
                      {formatFc(getSaleFcTotal(selectedSale.total, selectedSale.items, selectedSale.exchangeRate) ?? 0)}
                    </span>
                    <span className="block text-xs font-normal text-gray-500">≈ {formatCurrency(selectedSale.total)}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                {canReprint && <button
                  onClick={() => generateReceiptPDF(selectedSale)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("salesHistory.actions.downloadPdfShort")}
                </button>}
                {canReprint && <button
                  onClick={() => printESC_POSReceipt(selectedSale)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {t("salesHistory.actions.printReceipt")}
                </button>}
                <button
                  onClick={() => openEditModal(selectedSale)}
                  disabled={
                    selectedSale.status === "voided" ||
                    selectedSale.status === "corrected"
                  }
                  className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    selectedSale.status === "voided" ||
                    selectedSale.status === "corrected"
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {t("salesHistory.actions.edit")}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Edited Sale Details Modal */}
      {showEditedDetailsModal && selectedEditedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("salesHistory.edits.title", { id: selectedEditedSale.saleId })}
              </h3>
              <button
                onClick={() => setShowEditedDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Sale Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg">
                  {t("salesHistory.edits.currentState")}
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.cols.customer")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedEditedSale.isWalkIn ? t("pos.walkIn") : selectedEditedSale.customer.name} ({selectedEditedSale.customer.phone})
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.edits.currentTotal")}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatFc(getSaleFcTotal(selectedEditedSale.total, selectedEditedSale.items, selectedEditedSale.exchangeRate) ?? 0)}
                      <span className="block text-xs font-normal text-gray-500">≈ {formatCurrency(selectedEditedSale.total)}</span>
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.details.paymentMethod")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {paymentMethodLabel(selectedEditedSale.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.cols.items")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {t("salesHistory.itemCount", { count: selectedEditedSale.items.length })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit History */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("salesHistory.edits.history")}
                </h4>
                <div className="space-y-4">
                  {selectedEditedSale.editHistory && selectedEditedSale.editHistory.length > 0 ? (
                    selectedEditedSale.editHistory.map((edit, index) => (
                      <div key={edit._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {t("salesHistory.edits.number", { number: selectedEditedSale.editHistory!.length - index })}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {formatDate(edit.editedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {t("salesHistory.edits.by")}: {edit.editedBy}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t("salesHistory.reason")}: {edit.reason}
                            </p>
                          </div>
                        </div>

                        {edit.changes && Object.keys(edit.changes).length > 0 && (
                          <div className="space-y-3">
                            <h6 className="font-medium text-gray-700 text-sm">{t("salesHistory.edits.detailedChanges")}:</h6>
                            {changeEntries(edit.changes).map(([field, changeData]) => (
                              <div key={field} className="border-l-4 border-blue-500 pl-3">
                                <div className="font-medium text-gray-700 text-sm capitalize mb-2">
                                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="bg-red-50 p-3 rounded border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">{t("salesHistory.before")}:</div>
                                    <div className="text-red-600 break-words">
                                      {typeof changeData.from === 'object' 
                                        ? JSON.stringify(changeData.from, null, 2)
                                        : String(changeData.from || t("common.notAvailable"))
                                      }
                                    </div>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">{t("salesHistory.after")}:</div>
                                    <div className="text-green-600 break-words">
                                      {typeof changeData.to === 'object' 
                                        ? JSON.stringify(changeData.to, null, 2)
                                        : String(changeData.to || t("common.notAvailable"))
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t("salesHistory.edits.none")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditedDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("salesHistory.correction.title", { id: editingSale.saleId })}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              {editNotice && (
                <div role="status" className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                  {editNotice}
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("salesHistory.details.customerInfo")}
                </h4>

                <label className="flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={editForm.isWalkIn}
                    onChange={toggleEditWalkIn}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t("salesHistory.correction.walkIn")}
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="sales-edit-nom" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.details.name")}
                    </label>
                    <input
                      id="sales-edit-nom"
                      type="text"
                      value={editForm.customer.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={editForm.isWalkIn}
                      required={!editForm.isWalkIn}
                    />
                  </div>
                  <div>
                    <label htmlFor="sales-edit-telephone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.correction.phoneNumber")}
                    </label>
                    <input
                      id="sales-edit-telephone"
                      type="tel"
                      value={editForm.customer.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={editForm.isWalkIn}
                      required={!editForm.isWalkIn}
                    />
                  </div>
                  <div>
                    <label htmlFor="sales-edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("common.email")}
                    </label>
                    <input
                      id="sales-edit-email"
                      type="email"
                      value={editForm.customer.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={editForm.isWalkIn}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("salesHistory.details.paymentMethod")}
                </h4>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded"
                >
                  {(["cash", "card", "transfer", "other"] as const).map((value) => (
                    <option key={value} value={value}>{paymentMethodLabel(value)}</option>
                  ))}
                </select>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    {t("salesHistory.cols.items")}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchProducts}
                      disabled={loadingProducts}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          loadingProducts ? "animate-spin" : ""
                        }`}
                      />{" "}
                      {t("salesHistory.correction.refreshProducts")}
                    </button>
                    <button
                      onClick={addNewItem}
                      disabled={products.length === 0}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {t("salesHistory.correction.addItem")}
                    </button>
                  </div>
                </div>

                {products.length === 0 && !loadingProducts && (
                  <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4">
                    <p className="text-sm">
                      {t("salesHistory.correction.noProducts")}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {editForm.items.map((item, index) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label htmlFor={`sales-edit-item-${index}-article`} className="block text-sm font-medium text-gray-700 mb-1">
                            {t("salesHistory.correction.item")}
                          </label>
                          {loadingProducts ? (
                            <div className="p-2 border rounded bg-gray-200 text-gray-600 text-sm">
                              {t("salesHistory.correction.loadingProducts")}
                            </div>
                          ) : products.length === 0 ? (
                            <input
                              id={`sales-edit-item-${index}-article`}
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const name = e.target.value;
                                setEditForm((prev) => ({
                                  ...prev,
                                  items: prev.items.map((line, i) => (i === index ? { ...line, name } : line)),
                                }));
                              }}
                              placeholder={t("salesHistory.correction.itemName")}
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <select
                              id={`sales-edit-item-${index}-article`}
                              value={item.productId}
                              onChange={(e) =>
                                updateItemProduct(index, e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            >
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} -{" "}
                                  {formatProductPrice(product)} ({t("salesHistory.correction.stock", { count: product.stock })})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor={`sales-edit-item-${index}-price`} className="block text-sm font-medium text-gray-700 mb-1">
                            {translate("pos.unitPriceIn", { currency: getItemOriginalCurrency(item) })}
                          </label>
                          <UnitPriceInput
                            id={`sales-edit-item-${index}-price`}
                            value={getItemOriginalUnitPrice(item)}
                            currency={getItemOriginalCurrency(item)}
                            ariaLabel={translate("pos.editUnitPriceNamed", { name: item.name })}
                            error={editLineErrors[item._id]}
                            className="w-full"
                            onCommit={(amount) => updateItemPrice(index, amount)}
                          />
                          {item.discountApplied && (() => {
                            const reference = lineReference(item);
                            if (!reference) return null;
                            return (
                              <p className="mt-1 text-xs text-emerald-700">
                                {translate("pos.normalPrice", {
                                  price: getItemOriginalCurrency(item) === "FC" && reference.priceFC !== undefined
                                    ? formatFc(reference.priceFC)
                                    : formatCurrency(reference.priceUSD),
                                })}
                              </p>
                            );
                          })()}
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor={`sales-edit-item-${index}-quantity`} className="block text-sm font-medium text-gray-700 mb-1">
                            {t("salesHistory.correction.quantity")}{" "}
                          </label>
                          <div className="flex items-center border rounded">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className="p-2 hover:bg-gray-200"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              id={`sales-edit-item-${index}-quantity`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full p-2 text-center border-0"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                              className="p-2 hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <span className="block text-sm font-medium text-gray-700 mb-1">
                            {t("salesHistory.cols.total")}
                          </span>
                          <div className="p-2 bg-white border rounded font-medium">
                            {formatOriginalItemTotal(item)}
                            {getItemOriginalCurrency(item) === "FC" && (
                              <span className="block text-xs font-normal text-gray-500">≈ {formatCurrency(item.total)}</span>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> {t("salesHistory.correction.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t("salesHistory.details.subtotal")}:</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">{t("salesHistory.details.total")}:</span>
                  <span className="text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Edit Reason */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("salesHistory.correction.reason")}
                </h4>
                <textarea
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder={t("salesHistory.correction.reasonPlaceholder")}
                  className="w-full p-2 border rounded h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleEditSale}
                  disabled={loading || editForm.items.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {t("salesHistory.correction.saving")}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> {t("salesHistory.correction.save")}
                    </>
                  )}
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmAction.dialog}
    </div>
  );
}
