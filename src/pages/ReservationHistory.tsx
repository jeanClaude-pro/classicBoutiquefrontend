/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { currentLocale } from "../i18n";
import { apiErrorFromPayload, requestJson } from "../lib/apiError";
import { notifyInfo } from "../lib/notify";
import { completeReservationCopy, deleteSaleCopy, revertReservationCopy } from "../lib/confirmationCopy";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { MODULES } from "../config/modules";
import { paymentMethodLabel } from "../lib/labels";
import { formatDateGMT2, formatDateTimeGMT2, formatTimeGMT2, formatNowGMT2 } from "../utils/dateUtils";
import { serverUrl } from "../utils/constants";
import { formatUSD } from "../utils/salePricing";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Package, 
  Phone, 
  Mail, 
  RefreshCw, 
  Printer,
  Edit,
  Trash2,
  Plus,
  Minus
} from "lucide-react";

interface ReservationItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
  enteredPrice?: number;
  enteredCurrency?: "USD" | "FC";
  priceUSD?: number;
  priceFC?: number;
  exchangeRate?: number;
}

interface EditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: any;
  reason: string;
  _id?: string;
}

interface Reservation {
  _id: string;
  saleReference: string;
  saleId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: ReservationItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  type: string;
  reservationDate: string;
  reservationTime: string;
  createdAt: string;
  updatedAt: string;
  salesPerson?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  editedBy?: string;
  editedAt?: string;
  editHistory?: EditHistoryEntry[];
}

interface Product {
  _id: string;
  name: string;
  stock: number;
  price: number;
  sku?: string;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ReservationSummary {
  totalReservations: number;
  pending: number;
  completed: number;
  revenue: number;
  itemQuantity: number;
}

const API_BASE = serverUrl;

export default function ReservationManagement() {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const confirmAction = useConfirmAction();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [userRole, setUserRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [summary, setSummary] = useState<ReservationSummary | null>(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    customer: { name: "", phone: "", email: "" },
    items: [] as ReservationItem[],
    paymentMethod: "cash",
    reason: "",
    notes: "",
    reservationDate: "",
    reservationTime: ""
  });
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchProducts();
    // Get user role from localStorage or auth context
    const storedUser = localStorage.getItem("user");
    let role = "";
    try {
      role = storedUser ? JSON.parse(storedUser)?.role || "" : "";
    } catch {
      role = "";
    }
    console.log('🔑 User Role:', role);
    setUserRole(role);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchReservations(), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching reservations from API...');
      
      // Use the sales endpoint for reservations
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "50",
      });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (filterStatus !== "all") params.set("status", filterStatus);
      const response = await fetch(`${API_BASE}/sales/reservations/all?${params}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Reservations API Response:", data);
        
        if (data?.success && Array.isArray(data.data)) {
          console.log(`✅ Found ${data.length} reservations`);
          setReservations(data.data);
          setPagination(data.pagination || null);
          setSummary(data.summary || null);
        } else {
          console.warn("❌ Invalid data format from API");
          setError(t("reservationHistory.invalidFormat"));
          setReservations([]);
        }
      } else {
        console.error("❌ Reservations endpoint failed, status:", response.status);
        setError(t("reservationHistory.loadFailed"));
        setReservations([]);
      }
    } catch (error) {
      console.error("❌ Error loading reservations:", error);
      setError(t("reservationHistory.loadError"));
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${API_BASE}/products?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
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

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      reservation.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer.phone.includes(searchTerm) ||
      (reservation.customer.email && reservation.customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && reservation.status === 'pending') ||
      (filterStatus === 'completed' && reservation.status === 'completed');

    return matchesSearch && matchesStatus;
  });

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const completedReservations = reservations.filter(r => r.status === 'completed');

  const formatDate = (dateString: string) => {
    const result = formatDateGMT2(dateString);
    return result === '—' ? t("common.invalidDate") : result;
  };

  const formatDateTime = (dateString: string) => {
    const result = formatDateTimeGMT2(dateString);
    return result === '—' ? t("common.invalidDate") : result;
  };

  // NEW: Improved function to display reservation date properly
  const displayReservationDate = (reservation: Reservation) => {
    // Priority 1: Use reservationDate if available
    if (reservation.reservationDate) {
      // The reservation form stores an already formatted French date
      // ("24/09/2026"), which Date cannot parse: show it as recorded.
      const stored = String(reservation.reservationDate).trim();
      const datePart = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stored) ? stored : formatDate(stored);
      // If time is also available, show both
      if (reservation.reservationTime) {
        return `${datePart} ${reservation.reservationTime}`;
      }
      return datePart;
    }
    
    // Priority 2: Fallback to createdAt date
    return formatDate(reservation.createdAt);
  };

  // NEW: Function to display only the time part
  const displayReservationTime = (reservation: Reservation) => {
    if (reservation.reservationTime) {
      return reservation.reservationTime;
    }
    
    // Fallback to time from createdAt
    if (reservation.createdAt) {
      try {
        const date = new Date(reservation.createdAt);
        if (!isNaN(date.getTime())) {
          return formatTimeGMT2(date);
        }
      } catch {
        // Ignore errors
      }
    }
    
    return t("reservationHistory.timeNotSpecified");
  };

  const viewReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
    setError(null);
  };

  // A conflict means another device changed the reservation: reload it.
  const refreshIfStale = async (error: { isConflict: boolean; status: number }) => {
    if (error.isConflict || error.status === 404 || error.status === 400) await fetchReservations();
  };

  const openCompletionDialog = (reservation: Reservation) => {
    confirmAction.request({
      ...completeReservationCopy(reservation),
      action: () => requestJson(`${API_BASE}/sales/${reservation._id}/complete`, { method: "PATCH", body: {} }),
      onSuccess: () => markCompletedLocally(reservation),
      onError: refreshIfStale,
    });
  };

  const markAsPending = (reservation: Reservation) => {
    confirmAction.request({
      ...revertReservationCopy(reservation),
      action: () => requestJson(`${API_BASE}/sales/${reservation._id}/pending`, { method: "PATCH", body: {} }),
      onSuccess: () => {
        setReservations(prev => prev.map(r => r._id === reservation._id ? { ...r, status: "pending", completedBy: undefined, completedAt: undefined } : r));
        setShowModal(false);
      },
      onError: refreshIfStale,
    });
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    const copy = deleteSaleCopy({ ...reservation, type: "reservation" });
    if (copy.blockedReason) { notifyInfo(copy.blockedReason); return; }
    confirmAction.request({
      ...copy,
      action: () => requestJson(`${API_BASE}/sales/${reservation._id}`, { method: "DELETE" }),
      onSuccess: async () => { setShowModal(false); await fetchReservations(); },
      onError: refreshIfStale,
    });
  };

  // Check if user can edit reservations (admin or manager)
  const canEditReservation = userRole === 'superadmin' || userRole === 'manager';
  
  // Deletion and "back to pending" are superadmin-only on the server.
  const canDeleteReservation = userRole === 'superadmin';
  const canRevertReservation = userRole === 'superadmin';

  // EDIT FUNCTIONALITY
  const openEditModal = async (reservation: Reservation) => {
    if (reservation.status === 'cancelled') {
      setError(t("reservationHistory.cannotEditCancelled"));
      return;
    }

    // Only admin can edit completed reservations
    if (reservation.status === 'completed' && userRole !== 'superadmin') {
      setError(t("reservationHistory.onlyAdminEditCompleted"));
      return;
    }

    setEditingReservation(reservation);
    setEditForm({
      customer: { ...reservation.customer },
      items: reservation.items.map((item) => ({ ...item })),
      paymentMethod: reservation.paymentMethod,
      reason: "",
      notes: reservation.notes || "",
      reservationDate: reservation.reservationDate || "",
      reservationTime: reservation.reservationTime || ""
    });
    setShowEditModal(true);
    setError(null);

    // Ensure products are loaded
    if (products.length === 0) {
      await fetchProducts();
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingReservation(null);
    setEditForm({
      customer: { name: "", phone: "", email: "" },
      items: [],
      paymentMethod: "cash",
      reason: "",
      notes: "",
      reservationDate: "",
      reservationTime: ""
    });
    setError(null);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...editForm.items];
    const product = products.find(
      (p) => p._id === updatedItems[index].productId
    );

    if (product && newQuantity > product.stock + updatedItems[index].quantity) {
      setError(t("reservationHistory.insufficientStock", { stock: product.stock }));
      return;
    }

    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].price;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedItems = [...editForm.items];
    updatedItems[index].price = newPrice;
    updatedItems[index].enteredPrice = newPrice;
    updatedItems[index].enteredCurrency = "USD";
    updatedItems[index].priceUSD = newPrice;
    updatedItems[index].priceFC = undefined;
    updatedItems[index].exchangeRate = undefined;
    updatedItems[index].total = newPrice * updatedItems[index].quantity;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = editForm.items.filter((_, i) => i !== index);
    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addNewItem = () => {
    if (products.length === 0) {
      setError(t("reservationHistory.noProducts"));
      return;
    }

    const defaultProduct = products[0];
    const newItem: ReservationItem = {
      productId: defaultProduct._id,
      name: defaultProduct.name,
      quantity: 1,
      price: defaultProduct.price,
      total: defaultProduct.price,
      _id: `temp-${Date.now()}`,
      enteredPrice: defaultProduct.price,
      enteredCurrency: "USD",
      priceUSD: defaultProduct.price,
    };

    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      setError(t("reservationHistory.productNotFound"));
      return;
    }

    const updatedItems = [...editForm.items];
    updatedItems[index].productId = productId;
    updatedItems[index].name = product.name;
    updatedItems[index].price = product.price;
    updatedItems[index].enteredPrice = product.price;
    updatedItems[index].enteredCurrency = "USD";
    updatedItems[index].priceUSD = product.price;
    updatedItems[index].priceFC = undefined;
    updatedItems[index].exchangeRate = undefined;
    updatedItems[index].total = product.price * updatedItems[index].quantity;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const calculateTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, total: subtotal };
  };

  const handleEditReservation = async () => {
    if (!editingReservation) return;

    if (editForm.items.length === 0) {
      setError(t("reservationHistory.needItem"));
      return;
    }

    if (!editForm.customer.name || !editForm.customer.phone) {
      setError(t("reservationHistory.needCustomer"));
      return;
    }

    if (!editForm.reason) {
      setError(t("reservationHistory.needReason"));
      return;
    }

    try {
      setLoading(true);

      // Calculate totals properly
      const { subtotal, total } = calculateTotals();

      const updateData = {
        customer: editForm.customer,
        items: editForm.items.map((item) => ({
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
        paymentMethod: editForm.paymentMethod,
        reason: editForm.reason,
        notes: editForm.notes,
        reservationDate: editForm.reservationDate,
        reservationTime: editForm.reservationTime,
        _id: editingReservation._id,
        saleId: editingReservation.saleId,
      };

      console.log("Sending reservation update data:", updateData);

      const response = await fetch(
        `${API_BASE}/sales/${editingReservation._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Update response status:", response.status);

      if (response.ok) {
        const updatedReservation = await response.json();
        console.log("Updated reservation:", updatedReservation);

        setMessage(t("reservationHistory.updated"));

        // Refresh the reservations list immediately
        await fetchReservations();

        closeEditModal();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error("Update error:", errorData);
        setError(apiErrorFromPayload(response.status, errorData).message);
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      setError(t("reservationHistory.updateNetworkError"));
    } finally {
      setLoading(false);
    }
  };

  // DELETE FUNCTIONALITY
  const { subtotal, total } = calculateTotals();

  // Print receipt for reservation (pending or completed)
  const printReservationReceipt = (reservation: Reservation) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      const username = localStorage.getItem("username") || t("reservationHistory.seller");
      const currentDate = formatNowGMT2();
      
      const isCompleted = reservation.status === 'completed';
      
      printWindow.document.write(`
<html>
  <head>
    <title>${t("resHistoryReceipt.title")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .status-badge {
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
        ${isCompleted 
          ? 'background-color: #28a745; color: white;' 
          : 'background-color: #ffc107; color: #000;'
        }
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .status-info {
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
        ${isCompleted 
          ? 'background-color: #d4edda; border: 2px solid #28a745;' 
          : 'background-color: #fff3cd; border: 2px solid #ffc107;'
        }
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .notes {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS DOUBLE M CLASSIC BOUTIQUE</strong></div>
        <div class="shop-details"><strong>780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi</strong></div>
        <div class="shop-details">${t("saleReceipt.tel")}: <strong>+243 836 017 031</strong></div>
        <div class="shop-details"><strong>LSH/RCCM/22-A-01266</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="status-badge">
        <strong>${isCompleted ? t("resHistoryReceipt.collected") : t("resHistoryReceipt.pending")}</strong>
      </div>
      
      <div class="receipt-info">
        <div class="shop-details">${t("saleReceipt.date")}: <strong>${currentDate}</strong></div>
        <div class="shop-details">${t("resHistoryReceipt.reservationNo")}: <strong>${reservation.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${t("saleReceipt.customer")}: <strong>${reservation.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">${t("saleReceipt.phone")}: <strong>${reservation.customer.phone}</strong></div>
        ${reservation.customer.email ? `
          <div class="customer-field">${t("reservationReceipt.email")}: <strong>${reservation.customer.email}</strong></div>
        ` : ''}
      </div>
      
      ${reservation.notes ? `
        <div class="notes">
          <strong>${t("reservationReceipt.notes")}:</strong> <strong>${reservation.notes}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">${t("reservationReceipt.items")}</div>
      
      <div class="items-section">
      ${reservation.items
        .map(
          (item) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-details">
            <strong>${item.quantity}${t("resHistoryReceipt.pcs")} × ${item.enteredCurrency === "FC" && item.enteredPrice !== undefined ? `${item.enteredPrice.toLocaleString(currentLocale())} FC` : `$${(item.enteredPrice ?? item.price).toFixed(2)}`}</strong>
          </div>
        </div>
        <div class="item-row">
          <div class="item-name"><strong>${t("resHistoryReceipt.subtotal")}</strong></div>
          <div class="item-details">
            <strong>${item.enteredCurrency === "FC" && item.enteredPrice !== undefined ? `${(item.enteredPrice * item.quantity).toLocaleString(currentLocale())} FC<br/>${t("resHistoryReceipt.usdEquivalent")}: $${((item.priceUSD ?? item.price) * item.quantity).toFixed(2)}` : `$${item.total.toFixed(2)}`}</strong>
          </div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${t("resHistoryReceipt.totalAmount")}:</strong></div>
          <div><strong>$${reservation.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${t("reservationReceipt.depositReceived")}:</strong></div>
          <div><strong>$${reservation.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${t("receipt.paymentMethod")}:</strong></div>
          <div class="payment-method"><strong>${paymentMethodLabel(reservation.paymentMethod).toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="status-info">
        <div><strong>${isCompleted ? t("resHistoryReceipt.completedTitle") : t("resHistoryReceipt.pendingTitle")}</strong></div>
        <div><strong>${isCompleted ? t("resHistoryReceipt.handedOver") : t("resHistoryReceipt.present")}</strong></div>
        <div><strong>${isCompleted ? t("resHistoryReceipt.pickupDate", { date: currentDate }) : t("resHistoryReceipt.reservationDate", { date: displayReservationDate(reservation) })}</strong></div>
      </div>
      
      <div class="sales-person">
        ${t("saleReceipt.agent")}: <strong>${username.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${isCompleted ? t("resHistoryReceipt.pickedUp") : t("reservationReceipt.thanks")}</strong></div>
        ${!isCompleted ? `
          <div class="warning"><strong>${t("reservationReceipt.validity")}</strong></div>
          <div class="warning"><strong>${t("saleReceipt.noRefund")}</strong></div>
        ` : ''}
        <div class="warning"><strong>${t("resHistoryReceipt.seeYou")}</strong></div>
      </div>

      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  const markCompletedLocally = (reservation: Reservation) => {
    const completedBy = localStorage.getItem("username") || "Admin";
    const completedAt = new Date().toISOString();
    setReservations(prev => prev.map(r => r._id === reservation._id ? { ...r, status: "completed", completedBy, completedAt } : r));
    setShowModal(false);
    // Hand-over receipt, as before.
    setTimeout(() => printReservationReceipt({ ...reservation, status: "completed", completedBy, completedAt }), 500);
  };

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {MODULES.reservationhistory.label}
          </h1>
          <p className="text-gray-600">
            {MODULES.reservationhistory.description}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              {t("reservationHistory.pendingCount")} <span className="font-bold">{summary?.pending ?? pendingReservations.length}</span>
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">
              {t("reservationHistory.completedCount")} <span className="font-bold">{completedReservations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{summary?.totalReservations ?? reservations.length}</div>
          <div className="text-sm text-gray-600">{t("reservationHistory.totalReservations")}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{summary?.pending ?? pendingReservations.length}</div>
          <div className="text-sm text-gray-600">{t("reservationHistory.pending")}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{summary?.completed ?? completedReservations.length}</div>
          <div className="text-sm text-gray-600">{t("reservationHistory.completed")}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {summary?.itemQuantity ?? reservations.reduce(
              (sum, reservation) => sum + reservation.items.reduce(
                (itemSum, item) => itemSum + item.quantity,
                0
              ),
              0
            )}
          </div>
          <div className="text-sm text-gray-600">{t("reservationHistory.reservedItems")}</div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-green-700 hover:text-green-900"
            aria-label={t("reservationHistory.dismiss")}
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
            aria-label={t("reservationHistory.dismiss")}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("reservationHistory.searchPlaceholder")}
              aria-label={t("reservationHistory.searchLabel")}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            aria-label={t("reservationHistory.statusFilter")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t("reservationHistory.filters.all")}</option>
            <option value="pending">{t("reservationHistory.filters.pending")}</option>
            <option value="completed">{t("reservationHistory.filters.completed")}</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={fetchReservations}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? t("reservationHistory.loadingShort") : t("common.refresh")}
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("reservationHistory.list", { count: filteredReservations.length })}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">{t("reservationHistory.loading")}</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("reservationHistory.noneFound")}</p>
              <p className="text-sm">
                {t("reservationHistory.noneFoundHint")}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.id")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.customer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.items")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reservationHistory.columns.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {reservation.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {displayReservationDate(reservation)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {displayReservationTime(reservation)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {t("reservationHistory.itemCount", { count: reservation.items.length })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatUSD(reservation.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {reservation.status === 'completed' ? t("reservationHistory.statusCompleted") : t("reservationHistory.statusPending")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewReservationDetails(reservation)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title={t("reservationHistory.viewDetails")}
                          aria-label={t("reservationHistory.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => printReservationReceipt(reservation)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title={t("reservationHistory.printReceipt")}
                          aria-label={t("reservationHistory.printReceipt")}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Button - Only for admin/manager */}
                        {canEditReservation && (
                          <button
                            onClick={() => openEditModal(reservation)}
                            disabled={reservation.status === 'cancelled'}
                            className={`p-1 rounded ${
                              reservation.status === 'cancelled'
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-yellow-600 hover:text-yellow-900"
                            }`}
                            title={t("reservationHistory.edit")}
                            aria-label={t("reservationHistory.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Delete Button - Only for admin */}
                        {canDeleteReservation && reservation.status !== 'completed' && (
                          <button
                            onClick={() => handleDeleteReservation(reservation)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title={t("reservationHistory.delete")}
                            aria-label={t("reservationHistory.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {canEditReservation && (
                          <>
                            {reservation.status === 'pending' ? (
                              <button
                                onClick={() => openCompletionDialog(reservation)}
                                disabled={loading || confirmAction.busy}
                                className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                                title={t("reservationHistory.complete")}
                                aria-label={t("reservationHistory.complete")}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : reservation.status === 'completed' && canRevertReservation && (
                              <button
                                onClick={() => markAsPending(reservation)}
                                disabled={loading}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50"
                                title={t("reservationHistory.revert")}
                                aria-label={t("reservationHistory.revert")}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <span className="text-sm text-gray-600">
            {t("reservationHistory.pageInfo", { page: pagination.page, pages: pagination.totalPages, count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t("reservationHistory.previous")}
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t("reservationHistory.next")}
            </button>
          </div>
        </div>
      )}

      {/* Completion Confirmation Dialog */}
      {confirmAction.dialog}

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("reservationHistory.detailsTitle", { id: selectedReservation.saleId })}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label={t("common.close")}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Reservation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.columns.id")}
                  </span>
                  <p className="text-sm text-gray-900">{selectedReservation.saleId}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.createdAt")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(selectedReservation.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.reservationDate")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedReservation.reservationDate 
                      ? t("reservationHistory.dateAt", { date: formatDate(selectedReservation.reservationDate), time: selectedReservation.reservationTime || displayReservationTime(selectedReservation) })
                      : t("reservationHistory.notSpecifiedF")
                    }
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.paymentMethod")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {paymentMethodLabel(selectedReservation.paymentMethod)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.columns.status")}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedReservation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {selectedReservation.status === 'completed' ? t("reservationHistory.statusCompleted") : t("reservationHistory.statusPending")}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.seller2")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedReservation.salesPerson || t("reservationHistory.notSpecified")}
                  </p>
                </div>
                {selectedReservation.completedAt && (
                  <>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("reservationHistory.completedOn")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(selectedReservation.completedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("reservationHistory.completedBy")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedReservation.completedBy || t("common.unknown")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("reservationHistory.customerInfo")}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t("reservationHistory.name")}</p>
                        <p className="text-sm text-gray-900">{selectedReservation.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t("reservationHistory.phone")}</p>
                        <p className="text-sm text-gray-900">{selectedReservation.customer.phone}</p>
                      </div>
                    </div>
                    {selectedReservation.customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{t("reservationHistory.email")}</p>
                          <p className="text-sm text-gray-900">{selectedReservation.customer.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("reservationHistory.reservedItemsCount", { count: selectedReservation.items.length })}
                </h4>
                <div className="space-y-3">
                  {selectedReservation.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">
                            {t("reservationHistory.quantityLine", { quantity: item.quantity, price: formatUSD(item.price) })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatUSD(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    {t("reservationHistory.notes")}
                  </h4>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-700">{selectedReservation.notes}</p>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">{t("reservationHistory.totalAmount")}</span>
                  <span className="text-gray-900">
                    {formatUSD(selectedReservation.total)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={() => printReservationReceipt(selectedReservation)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {t("reservationHistory.printReceiptButton")}
                </button>
                
                {canEditReservation && (
                  <>
                    <button
                      onClick={() => openEditModal(selectedReservation)}
                      disabled={selectedReservation.status === 'cancelled'}
                      className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedReservation.status === 'cancelled'
                          ? "border-gray-300 text-gray-400 cursor-not-allowed"
                          : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      {t("reservationHistory.editButton")}
                    </button>

                    {selectedReservation.status === 'pending' ? (
                      <button
                        onClick={() => openCompletionDialog(selectedReservation)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t("reservationHistory.complete")}
                      </button>
                    ) : selectedReservation.status === 'completed' && canRevertReservation && (
                      <button
                        onClick={() => markAsPending(selectedReservation)}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("reservationHistory.revertButton")}
                      </button>
                    )}
                  </>
                )}

                {canDeleteReservation && selectedReservation.status !== 'completed' && (
                  <button
                    onClick={() => handleDeleteReservation(selectedReservation)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("reservationHistory.deleteButton")}
                  </button>
                )}

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

      {/* Edit Reservation Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("reservationHistory.editTitle", { id: editingReservation.saleId })}
              </h3>
              <button
                onClick={closeEditModal}
                aria-label={t("common.close")}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("reservationHistory.customerInfo")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="reservation-edit-nom" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reservationHistory.name")}
                    </label>
                    <input
                      id="reservation-edit-nom"
                      type="text"
                      value={editForm.customer.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reservation-edit-telephone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reservationHistory.phone")}
                    </label>
                    <input
                      id="reservation-edit-telephone"
                      type="tel"
                      value={editForm.customer.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reservation-edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reservationHistory.email")}
                    </label>
                    <input
                      id="reservation-edit-email"
                      type="email"
                      value={editForm.customer.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="reservation-edit-date-de-reservation" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.reservationDate")}
                  </label>
                  <input
                    id="reservation-edit-date-de-reservation"
                    type="date"
                    value={editForm.reservationDate}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        reservationDate: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label htmlFor="reservation-edit-heure-de-reservation" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.reservationTime")}
                  </label>
                  <input
                    id="reservation-edit-heure-de-reservation"
                    type="time"
                    value={editForm.reservationTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        reservationTime: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label htmlFor="reservation-edit-methode-de-paiement" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reservationHistory.paymentMethodEdit")}
                  </label>
                  <select
                    id="reservation-edit-methode-de-paiement"
                    value={editForm.paymentMethod}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="cash">{paymentMethodLabel("cash")}</option>
                    <option value="card">{paymentMethodLabel("card")}</option>
                    <option value="transfer">{paymentMethodLabel("transfer")}</option>
                    <option value="other">{paymentMethodLabel("other")}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="reservation-edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("reservationHistory.notes")}
                </label>
                <textarea
                  id="reservation-edit-notes"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder={t("reservationHistory.notesPlaceholder")}
                  className="w-full p-2 border rounded h-20"
                />
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    {t("reservationHistory.items")}
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
                      {t("reservationHistory.refreshProducts")}
                    </button>
                    <button
                      onClick={addNewItem}
                      disabled={products.length === 0}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {t("reservationHistory.addItem")}
                    </button>
                  </div>
                </div>

                {products.length === 0 && !loadingProducts && (
                  <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4">
                    <p className="text-sm">
                      {t("reservationHistory.noItemsAvailable")}
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
                          <label htmlFor={`reservation-edit-item-${index}-article`} className="block text-sm font-medium text-gray-700 mb-1">
                            {t("reservationHistory.item")}
                          </label>
                          {loadingProducts ? (
                            <div className="p-2 border rounded bg-gray-200 text-gray-600 text-sm">
                              {t("reservationHistory.loadingProducts")}
                            </div>
                          ) : products.length === 0 ? (
                            <input
                              id={`reservation-edit-item-${index}-article`}
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updatedItems = [...editForm.items];
                                updatedItems[index].name = e.target.value;
                                setEditForm((prev) => ({
                                  ...prev,
                                  items: updatedItems,
                                }));
                              }}
                              placeholder={t("reservationHistory.productName")}
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <select
                              id={`reservation-edit-item-${index}-article`}
                              value={item.productId}
                              onChange={(e) =>
                                updateItemProduct(index, e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            >
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {t("reservationHistory.productOption", { name: product.name, price: formatUSD(product.price), stock: product.stock })}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor={`reservation-edit-item-${index}-price`} className="block text-sm font-medium text-gray-700 mb-1">
                            {t("reservationHistory.price")}
                          </label>
                          <input
                            id={`reservation-edit-item-${index}-price`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItemPrice(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full p-2 border rounded"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor={`reservation-edit-item-${index}-quantity`} className="block text-sm font-medium text-gray-700 mb-1">
                            {t("reservationHistory.quantity")}
                          </label>
                          <div className="flex items-center border rounded">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className="p-2 hover:bg-gray-200"
                              disabled={item.quantity <= 1}
                              aria-label={t("reservationHistory.decrease")}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              id={`reservation-edit-item-${index}-quantity`}
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
                              aria-label={t("reservationHistory.increase")}
                              className="p-2 hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <span className="block text-sm font-medium text-gray-700 mb-1">
                            {t("reservationHistory.total")}
                          </span>
                          <div className="p-2 bg-white border rounded font-medium">
                            {formatUSD(item.total)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> {t("reservationHistory.remove")}
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
                  <span className="text-sm text-gray-600">{t("reservationHistory.subtotal")}</span>
                  <span className="text-sm text-gray-900">
                    {formatUSD(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">{t("reservationHistory.totalLabel")}</span>
                  <span className="text-gray-900">{formatUSD(total)}</span>
                </div>
              </div>

              {/* Edit Reason */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("reservationHistory.editReason")}
                </h4>
                <textarea
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder={t("reservationHistory.editReasonPlaceholder")}
                  aria-label={t("reservationHistory.editReason")}
                  className="w-full p-2 border rounded h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleEditReservation}
                  disabled={loading || editForm.items.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {t("reservationHistory.updating")}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> {t("reservationHistory.update")}
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
    </div>
  );
}
