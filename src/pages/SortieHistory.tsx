"use client";

import { useState, useEffect } from "react";
import { describeTimeframeFr, formatDateTimeGMT2, formatTimeGMT2, formatMonthNameGMT2 } from "../utils/dateUtils";
import { expenseStatusLabel, paymentMethodLabel } from "../lib/labels";
import { serverUrl } from "../utils/constants";
import { formatFC, formatUSD } from "../utils/salePricing";
import { apiErrorFromResponse, requestJson, toApiError, type ApiError } from "../lib/apiError";
import { notifyInfo, notifySuccess } from "../lib/notify";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { MODULES } from "../config/modules";
import {
  expenseDeletionCopy,
  expenseRejectionCopy,
  expenseReversalCopy,
  expenseTypeLabel,
  expenseValidationCopy,
} from "../lib/confirmationCopy";
import {
  Search,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
  Calendar,
  RefreshCw,
  User,
  Trash2,
  Save,
  X,
  AlertCircle,
  History,
  Filter,
  ChevronDown,
  Shield,
  RotateCcw,
} from "lucide-react";

interface ExpenseItem {
  _id: string;
  expenseId: string;
  reason: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  enteredAmount?: number;
  enteredCurrency?: "USD" | "FC";
  amountUSD?: number;
  amountFC?: number;
  exchangeRate?: number;
  paymentMethod: string;
  status: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
  expenseType?: "COMPANY_EXPENSE" | "GOODS_PURCHASE" | "REPAYMENT" | "LEGACY_UNCLASSIFIED" | "normal" | "repayment";
  category?: "CLOTHES" | "SHOES";
  creditorSnapshot?: { name?: string; type?: string };
  transactionKind?: "DEBIT" | "REVERSAL";
  reversedBy?: string | null;
}

// Shapes returned by GET /api/expenses and /api/expenses/:id/history.
interface StatusTotals { count: number; amount: number }
interface ExpenseSummary {
  totalRecords: number;
  totalAmount: number;
  pending: StatusTotals;
  validated: StatusTotals;
  rejected?: StatusTotals;
  averageAmount?: number;
  validationRate?: number;
}
type AppliedFilters = Record<string, string | undefined>;
interface ExpenseHistoryItem { action: string; timestamp: string; formattedDate?: string; [key: string]: unknown }

interface ExpensesResponse {
  success: boolean;
  data: ExpenseItem[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timeframe: {
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
  };
  summary: {
    totalRecords: number;
    totalAmount: number;
    pending: {
      count: number;
      amount: number;
    };
    validated: {
      count: number;
      amount: number;
    };
    rejected: {
      count: number;
      amount: number;
    };
  };
  filtersApplied: {
    status: string;
    paymentMethod: string;
    recordedBy: string;
    search: string;
  };
}

interface UserPermissions {
  isAdmin: boolean;
  canValidate: boolean;
  canEditAll: boolean;
  canDeleteAll: boolean;
  userId: string;
  userName: string;
}

// User interface for role checking
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  permissions?: string[];
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
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

export default function SortieHistory() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    reason: "",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
    updateReason: "",
  });
  const confirmAction = useConfirmAction();
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // User state for role checking

  // Timeframe state - Updated to match backend query parameters
  const [timeframeType, setTimeframeType] = useState<
    "custom" | "day" | "month" | "year" | "today"
  >("today");
  
  const [queryParams, setQueryParams] = useState({
    from: "",
    to: "",
    date: getTodayDate(),
    year: getCurrentYear().toString(),
    month: getCurrentMonth().split('-')[1],
    status: "",
    paymentMethod: "",
    recordedBy: "",
    search: ""
  });

  const [initialLoad, setInitialLoad] = useState(true);
  const [summaryStats, setSummaryStats] = useState<ExpenseSummary | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
  const [timeframeDescription, setTimeframeDescription] = useState<string>("Aujourd'hui");
  // Shown inside the edit dialog: the page-level banner sits behind its overlay.
  const [editError, setEditError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ExpensesResponse["pagination"] | null>(null);

  // User permissions
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    isAdmin: false,
    canValidate: false,
    canEditAll: false,
    canDeleteAll: false,
    userId: "",
    userName: "",
  });

  // Build query string from queryParams
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", "50");
    
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
    if (queryParams.paymentMethod) params.append("paymentMethod", queryParams.paymentMethod);
    if (queryParams.recordedBy) params.append("recordedBy", queryParams.recordedBy);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    
    return params.toString();
  };

  useEffect(() => {
    fetchUserPermissions();
    fetchExpenses();
  }, []);

  // Fetch data when query params change
  useEffect(() => {
    if (Object.keys(queryParams).length > 0) {
      fetchExpenses();
    }
  }, [queryParams, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryParams, searchTerm]);

  // Effect to automatically set to today's date when timeframe changes to "day"
  useEffect(() => {
    if (!initialLoad && timeframeType === "day") {
      const today = getTodayDate();
      setSelectedDate(today);
    }
  }, [timeframeType, initialLoad]);

  // Effect to enforce day-only view for non-admin users
  useEffect(() => {
    if (!userPermissions.isAdmin && timeframeType !== "day") {
      setTimeframeType("day");
      setQueryParams(prev => ({
        ...prev,
        date: getTodayDate(),
        from: "",
        to: "",
        year: "",
        month: ""
      }));
    }
  }, [timeframeType, userPermissions.isAdmin]);

  // Effect to mark initial load as complete
  useEffect(() => {
    if (expenses.length > 0) {
      setInitialLoad(false);
    }
  }, [expenses]);

  const fetchUserPermissions = async () => {
    try {
      const res = await fetch(`${serverUrl}/expenses/permissions/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserPermissions(data);
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const url = `${serverUrl}/expenses${queryString ? `?${queryString}` : ''}`;
      
      console.log("Fetching expenses from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data: ExpensesResponse = await res.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const fetchedExpenses = data.data;
          
          console.log(`Fetched ${fetchedExpenses.length} expenses from API`);
          console.log("Timeframe metadata:", data.timeframe);
          console.log("Summary stats:", data.summary);
          
          // Sort expenses by date - newest first
          const sortedExpenses = fetchedExpenses.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setExpenses(sortedExpenses);
          setPagination(data.pagination || null);
          
          // Update metadata
          setTimeframeDescription(describeTimeframeFr(data.timeframe.description));
          setSummaryStats(data.summary);
          setAppliedFilters(data.filtersApplied);
          
        } else {
          console.warn("Unexpected expenses data structure:", data);
          setError("Réponse inattendue du serveur. Actualisez la page.");
        }
      } else {
        setError(`Impossible de charger les décaissements. ${(await apiErrorFromResponse(res)).message}`);
      }
    } catch (error) {
      setError(`Impossible de charger les décaissements. ${toApiError(error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableYears = (): number[] => {
    return Array.from({ length: 10 }, (_, i) => getCurrentYear() - i);
  };

  const getTimeframeLabel = () => {
    if (!userPermissions.isAdmin) {
      return "Aujourd'hui";
    }
    
    return timeframeDescription;
  };

  const handleTimeframeTypeChange = (type: "custom" | "day" | "month" | "year" | "today") => {
    if (!userPermissions.isAdmin && type !== "day") {
      return;
    }
    
    setTimeframeType(type);
    
    // Reset specific query params based on type
    const newParams = { ...queryParams };
    
    switch(type) {
      case "today":
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

  const handleQueryParamChange = (key: keyof typeof queryParams, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setQueryParams({
      from: "",
      to: "",
      date: getTodayDate(),
      year: getCurrentYear().toString(),
      month: getCurrentMonth().split('-')[1],
      status: "",
      paymentMethod: "",
      recordedBy: "",
      search: ""
    });
    setTimeframeType("today");
    setSearchTerm("");
    setShowAdvancedFilters(false);
  };

  // Helper function to set selected date (for day view)
  const setSelectedDate = (date: string) => {
    handleQueryParamChange("date", date);
  };

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatOriginalAmount = (expense: ExpenseItem) =>
    expense.enteredCurrency === "FC"
      ? `${formatFC(expense.enteredAmount ?? expense.amountFC ?? 0)} (Équiv. ${formatUSD(expense.amountUSD ?? expense.amount)})`
      : formatUSD(expense.enteredAmount ?? expense.amount);

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.expenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.recipientPhone.includes(searchTerm) ||
      expense.recordedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewExpenseDetails = (expense: ExpenseItem) => {
    setSelectedExpense(expense);
    setShowModal(true);
    setError(null);
  };

  // A conflict, an insufficient-funds refusal or a vanished record means the
  // list is stale: refresh it so the user decides on current data.
  const refreshIfStale = async (error: ApiError) => {
    if (error.isConflict || error.code === "INSUFFICIENT_PURCHASE_FUNDS" || error.status === 404) await fetchExpenses();
  };

  const requestValidation = (expense: ExpenseItem) => {
    const copy = expenseValidationCopy(expense);
    if (copy.blockedReason) { notifyInfo(copy.blockedReason); return; }
    confirmAction.request({
      ...copy,
      action: () => requestJson(`${serverUrl}/expenses/${expense._id}/validate`, { method: "PATCH", body: {} }),
      onSuccess: async () => { setShowModal(false); await fetchExpenses(); },
      onError: refreshIfStale,
    });
  };

  const requestRejection = (expense: ExpenseItem) => {
    confirmAction.request({
      ...expenseRejectionCopy(expense),
      reason: { label: "Motif du rejet", required: true, placeholder: "Ex. : doublon, montant erroné…" },
      action: (reason) => requestJson(`${serverUrl}/expenses/${expense._id}/reject`, { method: "PATCH", body: { reason } }),
      onSuccess: async () => { setShowModal(false); await fetchExpenses(); },
      onError: refreshIfStale,
    });
  };

  const requestDeletion = (expense: ExpenseItem) => {
    const copy = expenseDeletionCopy(expense);
    if (copy.blockedReason) { notifyInfo(copy.blockedReason); return; }
    // Pending records use the owner route; other non-validated ones the admin route.
    const endpoint = expense.status !== "pending" && userPermissions.isAdmin
      ? `${serverUrl}/expenses/${expense._id}/admin`
      : `${serverUrl}/expenses/${expense._id}`;
    confirmAction.request({
      ...copy,
      action: () => requestJson(endpoint, { method: "DELETE" }),
      onSuccess: () => {
        setExpenses((current) => current.filter((item) => item._id !== expense._id));
        if (selectedExpense?._id === expense._id) { setSelectedExpense(null); setShowModal(false); }
      },
      onError: refreshIfStale,
    });
  };

  const canReverseExpense = (expense: ExpenseItem): boolean =>
    userPermissions.isAdmin && expense.status === "validated" &&
    (expense.expenseType === "COMPANY_EXPENSE" || expense.expenseType === "GOODS_PURCHASE") &&
    expense.transactionKind !== "REVERSAL" && !expense.reversedBy;

  const requestReversal = (expense: ExpenseItem) => {
    confirmAction.request({
      ...expenseReversalCopy(expense),
      reason: { label: "Motif de la contre-passation", required: true, placeholder: "Ex. : achat annulé par le fournisseur" },
      action: (reason) => requestJson(`${serverUrl}/expenses/${expense._id}/reverse`, { method: "POST", body: { reason } }),
      onSuccess: async () => { setShowModal(false); await fetchExpenses(); },
      onError: refreshIfStale,
    });
  };

  const openEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setEditForm({
      reason: expense.reason,
      recipientName: expense.recipientName,
      recipientPhone: expense.recipientPhone,
      amount: String(expense.amount ?? ""),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
      updateReason: "",
    });
    setShowEditModal(true);
    setError(null);
  };

  const closeEditModal = () => {
    setEditError(null);
    setShowEditModal(false);
    setEditingExpense(null);
    setEditForm({
      reason: "",
      recipientName: "",
      recipientPhone: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
      updateReason: "",
    });
    setError(null);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setExpenseHistory([]);
  };

  const fetchExpenseHistory = async (expenseId: string) => {
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `${serverUrl}/expenses/${expenseId}/history`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setExpenseHistory(data.history || []);
        setShowHistoryModal(true);
      } else {
        setError(`Impossible de charger l'historique de ce décaissement. ${(await apiErrorFromResponse(res)).message}`);
      }
    } catch (error) {
      setError(`Impossible de charger l'historique de ce décaissement. ${toApiError(error).message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;

    setActionLoading(`editing-${editingExpense._id}`);
    setEditError(null);

    try {
      // Check if update reason is required (for validated/rejected expenses)
      const requiresUpdateReason = editingExpense.status !== "pending" && userPermissions.isAdmin;
      if (requiresUpdateReason && !editForm.updateReason.trim()) {
        setEditError("Indiquez la raison de la modification : ce décaissement a déjà été traité.");
        setActionLoading(null);
        return;
      }

      const response = await fetch(
        `${serverUrl}/expenses/${editingExpense._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            reason: editForm.reason,
            recipientName: editForm.recipientName,
            recipientPhone: editForm.recipientPhone,
            amount: parseFloat(editForm.amount),
            paymentMethod: editForm.paymentMethod,
            notes: editForm.notes,
            updateReason: editForm.updateReason,
          }),
        }
      );

      if (response.ok) {
        const updatedExpense = await response.json();
        notifySuccess("Modification enregistrée avec succès.");
        closeEditModal();

        // Update the expense in the local state
        setExpenses((current) => current.map(exp =>
          exp._id === editingExpense._id ? { ...exp, ...updatedExpense } : exp
        ));
        
        // Also update selected expense if it's the same one
        if (selectedExpense && selectedExpense._id === editingExpense._id) {
          setSelectedExpense({ ...selectedExpense, ...updatedExpense });
        }
      } else {
        const failure = await apiErrorFromResponse(response);
        setEditError(failure.message);
        if (failure.isConflict || failure.status === 404) void fetchExpenses();
      }
    } catch (error) {
      setEditError(toApiError(error).message);
    } finally {
      setActionLoading(null);
    }
  };

  // Print function for expense receipt
  const printExpenseReceipt = (expense: ExpenseItem) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      // Format the amount directly for the print window
      const formattedAmount = expense.enteredCurrency === "FC"
        ? `${(expense.enteredAmount ?? expense.amountFC ?? 0).toLocaleString("fr-FR")} FC (Équiv. $${(expense.amountUSD ?? expense.amount).toFixed(2)})`
        : new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "USD",
          }).format(expense.enteredAmount ?? expense.amount);

      const formattedDate = formatDateTimeGMT2(expense.createdAt);
      const validatedDate = expense.validatedAt
        ? formatDateTimeGMT2(expense.validatedAt)
        : formattedDate;

      printWindow.document.write(`
<html>
  <head>
    <title>Reçu de décaissement</title>
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
      .expense-details {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
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
      .validation-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
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
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS DOUBLE M CLASSIC BOUTIQUE</strong></div>
        <div class="shop-details"><strong>780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 836 017 031</strong></div>
        <div class="shop-details"><strong>LSH/RCCM/22-A-01266</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${formattedDate}</strong></div>
        <div class="shop-details">RECU #: <strong>${
          expense.expenseId
        }</strong></div>
      </div>
      
      <div class="receipt-title">REÇU DE DÉCAISSEMENT</div>
      
      <div class="expense-details">
        <div class="detail-row">
          <div class="detail-label"><strong>RAISON:</strong></div>
          <div class="detail-value"><strong>${expense.reason.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>BÉNÉFICIAIRE:</strong></div>
          <div class="detail-value"><strong>${expense.recipientName.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>TÉLÉPHONE:</strong></div>
          <div class="detail-value"><strong>${
            expense.recipientPhone
          }</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MONTANT:</strong></div>
          <div class="detail-value"><strong>${formattedAmount}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${expense.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>MONTANT TOTAL:</strong></div>
          <div><strong>${formattedAmount}</strong></div>
        </div>
      </div>
      
      <div class="validation-info">
        Validé par: <strong>${expense.validatedBy || "ADMIN"}</strong><br>
        Le: <strong>${validatedDate}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>SOUCHE DE DÉCAISSEMENT</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Reçu #: <strong>${
          expense.expenseId
        }</strong></div>
        <div class="warning">Date: <strong>${formattedDate}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
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

  // Check if user can edit this expense
  const canEditExpense = (expense: ExpenseItem): boolean => {
    // Validated accounting records and repayments are immutable server-side.
    if (["REPAYMENT", "repayment"].includes(expense.expenseType || "")) return false;
    if (expense.status === "validated" && ["COMPANY_EXPENSE", "GOODS_PURCHASE"].includes(expense.expenseType || "")) return false;
    if (userPermissions.isAdmin || userPermissions.canEditAll) {
      return true; // Admin can edit any expense
    }
    
    // Regular users can only edit their own pending expenses
    if (expense.status === "pending" && expense.recordedBy === userPermissions.userId) {
      return true;
    }
    
    return false;
  };

  // Check if user can delete this expense
  const canDeleteExpense = (expense: ExpenseItem): boolean => {
    // Money that already left the till is never deleted (reversal instead).
    if (expense.status === "validated") return false;
    if (userPermissions.isAdmin || userPermissions.canDeleteAll) {
      return true; // Admin can delete any expense
    }
    
    // Regular users can only delete their own pending expenses
    if (expense.status === "pending" && expense.recordedBy === userPermissions.userId) {
      return true;
    }
    
    return false;
  };

  // Check if update reason is required for editing
  const requiresUpdateReason = (expense: ExpenseItem | null): boolean => {
    if (!expense) return false;
    return expense.status !== "pending" && (userPermissions.isAdmin || userPermissions.canEditAll);
  };

  // Summary Statistics component - Only visible to admins
  const SummaryStats = () => {
    // Double-guard: API permission AND localStorage role must both confirm admin
    const localIsAdmin = (() => {
      try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw).role === "superadmin" : false;
      } catch { return false; }
    })();
    if (!summaryStats || !userPermissions.isAdmin || !localIsAdmin) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Synthèse des décaissements
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total des décaissements</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalRecords}</p>
                <p className="text-sm text-gray-500">{formatUSD(summaryStats.totalAmount)}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validés</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.validated.count}</p>
                <p className="text-sm text-green-600">{formatUSD(summaryStats.validated.amount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending.count}</p>
                <p className="text-sm text-yellow-600">{formatUSD(summaryStats.pending.amount)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.rejected?.count || 0}</p>
                <p className="text-sm text-red-600">{formatUSD(summaryStats.rejected?.amount || 0)}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Detailed statistics */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Répartition par statut</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Validés :</span>
                  <div className="text-right">
                    <span className="font-semibold text-green-600">{summaryStats.validated.count}</span>
                    <div className="text-xs text-gray-500">{formatUSD(summaryStats.validated.amount)}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En attente :</span>
                  <div className="text-right">
                    <span className="font-semibold text-yellow-600">{summaryStats.pending.count}</span>
                    <div className="text-xs text-gray-500">{formatUSD(summaryStats.pending.amount)}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejetés :</span>
                  <div className="text-right">
                    <span className="font-semibold text-red-600">{summaryStats.rejected?.count || 0}</span>
                    <div className="text-xs text-gray-500">{formatUSD(summaryStats.rejected?.amount || 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Montants totaux</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total général:</span>
                  <span className="font-bold text-blue-600">{formatUSD(summaryStats.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Montant moyen:</span>
                  <span className="font-medium text-gray-900">
                    {summaryStats.totalRecords > 0 
                      ? formatUSD(summaryStats.totalAmount / summaryStats.totalRecords)
                      : formatUSD(0)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de validation:</span>
                  <span className="font-medium text-green-600">
                    {summaryStats.totalRecords > 0 
                      ? `${((summaryStats.validated.count / summaryStats.totalRecords) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Informations temporelles</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Période:</span>
                  <span className="text-sm font-medium text-gray-900">{timeframeDescription}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dernière mise à jour:</span>
                  <span className="text-sm text-gray-900">{formatTimeGMT2(new Date())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Données filtrées:</span>
                  <span className="text-sm text-gray-900">{filteredExpenses.length} / {expenses.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-28 md:pb-8 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {MODULES.historicsortie.label}
          </h1>
          <p className="text-gray-600">{MODULES.historicsortie.description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un décaissement…"
              aria-label="Rechercher un décaissement"
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats - Only visible to admins */}
      <SummaryStats />

      {/* Timeframe Filter Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtre par période ({getTimeframeLabel()})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Timeframe Selection */}
        {showFilters && (
          <div className="space-y-4">
            <div>
              <span id="sortie-history-timeframe-type" className="block text-sm font-medium text-gray-700 mb-2">
                Type de période
              </span>
              <div role="group" aria-labelledby="sortie-history-timeframe-type" className="flex flex-wrap gap-2">
                {(["today", "day", "month", "year", "custom"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTimeframeTypeChange(type)}
                    disabled={!userPermissions.isAdmin && type !== "day"}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      timeframeType === type
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${!userPermissions.isAdmin && type !== "day" ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {type === "today" && "Aujourd'hui"}
                    {type === "day" && "Jour spécifique"}
                    {type === "month" && "Mois spécifique"}
                    {type === "year" && "Année spécifique"}
                    {type === "custom" && "Plage personnalisée"}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific timeframe inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {timeframeType === "day" && (
                <div>
                  <label htmlFor="sortie-history-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    id="sortie-history-date"
                    type="date"
                    value={queryParams.date}
                    onChange={(e) => handleQueryParamChange("date", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={!userPermissions.isAdmin}
                  />
                </div>
              )}

              {timeframeType === "month" && (
                <>
                  <div>
                    <label htmlFor="sortie-history-mois-annee" className="block text-sm font-medium text-gray-700 mb-1">
                      Année
                    </label>
                    <select
                      id="sortie-history-mois-annee"
                      value={queryParams.year}
                      onChange={(e) => handleQueryParamChange("year", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      {getAvailableYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sortie-history-mois" className="block text-sm font-medium text-gray-700 mb-1">
                      Mois
                    </label>
                    <select
                      id="sortie-history-mois"
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
                  <label htmlFor="sortie-history-annee" className="block text-sm font-medium text-gray-700 mb-1">
                    Année
                  </label>
                  <select
                    id="sortie-history-annee"
                    value={queryParams.year}
                    onChange={(e) => handleQueryParamChange("year", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {timeframeType === "custom" && (
                <>
                  <div>
                    <label htmlFor="sortie-history-date-de-debut" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <input
                      id="sortie-history-date-de-debut"
                      type="date"
                      value={queryParams.from}
                      onChange={(e) => handleQueryParamChange("from", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="sortie-history-date-de-fin" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      id="sortie-history-date-de-fin"
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
                {showAdvancedFilters ? "Masquer les filtres avancés" : "Filtres avancés"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label htmlFor="sortie-history-statut" className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      id="sortie-history-statut"
                      value={queryParams.status}
                      onChange={(e) => handleQueryParamChange("status", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="validated">Validés</option>
                      <option value="rejected">Rejetés</option>
                      <option value="all">Tous</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sortie-history-methode-de-paiement" className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de paiement
                    </label>
                    <select
                      id="sortie-history-methode-de-paiement"
                      value={queryParams.paymentMethod}
                      onChange={(e) => handleQueryParamChange("paymentMethod", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Toutes</option>
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="bank">Banque</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sortie-history-enregistre-par" className="block text-sm font-medium text-gray-700 mb-1">
                      Enregistré par
                    </label>
                    <input
                      id="sortie-history-enregistre-par"
                      type="text"
                      value={queryParams.recordedBy}
                      onChange={(e) => handleQueryParamChange("recordedBy", e.target.value)}
                      placeholder="Filtrer par enregistreur..."
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
            <span className="font-medium">Filtres appliqués :</span>
            <span className="ml-2">
              Statut : {appliedFilters.status && !["all", "none"].includes(appliedFilters.status) ? expenseStatusLabel(appliedFilters.status) : "tous"},
              Paiement : {appliedFilters.paymentMethod && !["all", "none"].includes(appliedFilters.paymentMethod) ? paymentMethodLabel(appliedFilters.paymentMethod) : "tous"}
              {appliedFilters.recordedBy && appliedFilters.recordedBy !== 'none' && `, Enregistré par : ${appliedFilters.recordedBy}`}
              {appliedFilters.search && appliedFilters.search !== 'none' && `, Recherche : ${appliedFilters.search}`}
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
            {userPermissions.isAdmin ? "Décaissements de la période" : "Décaissements du jour"} (
            {filteredExpenses.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des décaissements…</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun décaissement trouvé</p>
              <p className="text-sm">pour la période sélectionnée</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif et type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéficiaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.expenseId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.reason}
                      {/* One badge per operation type; reversals and reversed originals are flagged. */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${["REPAYMENT", "repayment"].includes(expense.expenseType || "") ? "bg-orange-100 text-orange-800" : expense.expenseType === "COMPANY_EXPENSE" ? "bg-red-100 text-red-800" : expense.expenseType === "GOODS_PURCHASE" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                          {expenseTypeLabel(expense.expenseType)}
                          {["REPAYMENT", "repayment"].includes(expense.expenseType || "") ? ` · ${expense.creditorSnapshot?.name || "Créancier"}` : expense.category ? ` · ${expense.category === "SHOES" ? "Chaussures" : "Vêtements"}` : ""}
                        </span>
                        {expense.transactionKind === "REVERSAL" && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Contre-passation</span>}
                        {expense.reversedBy && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Contre-passé</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expense.recipientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {expense.recipientPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatOriginalAmount(expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {paymentMethodLabel(expense.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          expense.status === "validated"
                            ? "bg-green-100 text-green-800"
                            : expense.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {expense.status === "validated"
                          ? "Validé"
                          : expense.status === "rejected"
                          ? "Rejeté"
                          : "En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewExpenseDetails(expense)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* History button */}
                        <button
                          onClick={() => fetchExpenseHistory(expense._id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Voir l'historique"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Admin-only validation buttons */}
                        {userPermissions.canValidate &&
                          expense.status !== "validated" &&
                          expense.status !== "rejected" && (
                            <>
                              <button
                                onClick={() => requestValidation(expense)}
                                disabled={confirmAction.busy}
                                className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                                title="Valider le décaissement"
                                aria-label={`Valider ${expense.expenseId}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => requestRejection(expense)}
                                disabled={confirmAction.busy}
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                                title="Rejeter le décaissement"
                                aria-label={`Rejeter ${expense.expenseId}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        {/* Edit button - show if user has permission */}
                        {canEditExpense(expense) && (
                          <button
                            onClick={() => openEditModal(expense)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                            title="Modifier le décaissement"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button - show if user has permission */}
                        {canDeleteExpense(expense) && (
                          <button
                            onClick={() => requestDeletion(expense)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer le décaissement"
                            aria-label={`Supprimer ${expense.expenseId}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {canReverseExpense(expense) && (
                          <button
                            onClick={() => requestReversal(expense)}
                            className="text-amber-600 hover:text-amber-800 p-1 rounded"
                            title="Contre-passer l'opération"
                            aria-label={`Contre-passer ${expense.expenseId}`}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print button - only show for validated expenses */}
                        {expense.status === "validated" && (
                          <button
                            onClick={() => printExpenseReceipt(expense)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title="Imprimer le reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
            Page {pagination.page} sur {pagination.totalPages} · {pagination.totalRecords} décaissements
          </span>
          <div className="flex gap-2">
            <button disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded border px-3 py-1.5 disabled:opacity-40">Précédent</button>
            <button disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Suivant</button>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails du décaissement
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Expense Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedExpense.expenseId}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedExpense.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de paiement
                  </span>
                  <p className="text-sm text-gray-900">
                    {paymentMethodLabel(selectedExpense.paymentMethod)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedExpense.status === "validated"
                        ? "bg-green-100 text-green-800"
                        : selectedExpense.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedExpense.status === "validated"
                      ? "Validé"
                      : selectedExpense.status === "rejected"
                      ? "Rejeté"
                      : "En attente"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Enregistré par
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedExpense.recordedBy}
                  </p>
                </div>
              </div>

              {/* Reason and Amount */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Motif et montant
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Raison
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.reason}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          Montant
                        </span>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatUSD(selectedExpense.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Information du Bénéficiaire
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.recipientName}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.recipientPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedExpense.notes && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Notes supplémentaires
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {selectedExpense.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* History button */}
                <button
                  onClick={() => fetchExpenseHistory(selectedExpense._id)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Historique
                </button>
                
                {selectedExpense.status === "validated" && (
                  <button
                    onClick={() => printExpenseReceipt(selectedExpense)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer Reçu
                  </button>
                )}
                {userPermissions.canValidate &&
                  selectedExpense.status !== "validated" &&
                  selectedExpense.status !== "rejected" && (
                    <>
                      <button
                        onClick={() => requestValidation(selectedExpense)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider
                      </button>
                      <button
                        onClick={() => requestRejection(selectedExpense)}
                        className="flex-1 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </button>
                    </>
                  )}
                {canReverseExpense(selectedExpense) && (
                  <button
                    onClick={() => requestReversal(selectedExpense)}
                    className="flex-1 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Contre-passer
                  </button>
                )}
                {canEditExpense(selectedExpense) && (
                  <button
                    onClick={() => openEditModal(selectedExpense)}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                {canDeleteExpense(selectedExpense) && (
                  <button
                    onClick={() => requestDeletion(selectedExpense)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {confirmAction.dialog}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Modifier le décaissement
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {requiresUpdateReason(editingExpense) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Modification d'un décaissement {expenseStatusLabel(editingExpense.status).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Ce décaissement a déjà été traité. Indiquez la raison de
                    cette modification.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="sortie-edit-raison" className="block text-sm font-medium text-gray-700 mb-1">
                    Motif du décaissement *
                  </label>
                  <input
                    id="sortie-edit-raison"
                    type="text"
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sortie-edit-beneficiaire-nom" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du bénéficiaire *
                    </label>
                    <input
                      id="sortie-edit-beneficiaire-nom"
                      type="text"
                      value={editForm.recipientName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recipientName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="sortie-edit-beneficiaire-telephone" className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone du bénéficiaire *
                    </label>
                    <input
                      id="sortie-edit-beneficiaire-telephone"
                      type="tel"
                      value={editForm.recipientPhone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recipientPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sortie-edit-montant" className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (USD) *
                    </label>
                    <input
                      id="sortie-edit-montant"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="sortie-edit-methode-de-paiement" className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de paiement *
                    </label>
                    <select
                      id="sortie-edit-methode-de-paiement"
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paymentMethod: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="bank">Virement bancaire</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>

                {requiresUpdateReason(editingExpense) && (
                  <div>
                    <label htmlFor="sortie-edit-motif" className="block text-sm font-medium text-gray-700 mb-1">
                      Raison de la modification *
                    </label>
                    <textarea
                      id="sortie-edit-motif"
                      value={editForm.updateReason}
                      onChange={(e) =>
                        setEditForm({ ...editForm, updateReason: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Expliquez pourquoi vous modifiez ce décaissement…"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cette raison sera enregistrée dans l'historique du
                      décaissement.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="sortie-edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes supplémentaires (optionnel)
                  </label>
                  <textarea
                    id="sortie-edit-notes"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ajoutez des notes supplémentaires..."
                  />
                </div>
              </div>

              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {editError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleEditExpense}
                  disabled={actionLoading === `editing-${editingExpense._id}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === `editing-${editingExpense._id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer les modifications
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}

      {/* Expense History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Historique du décaissement
              </h3>
              <button
                onClick={closeHistoryModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement de l'historique...</p>
                </div>
              ) : expenseHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun historique disponible</p>
                  <p className="text-sm">pour ce décaissement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900">
                      Décaissement : {selectedExpense?.expenseId || "—"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Statut actuel:{" "}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          selectedExpense?.status === "validated"
                            ? "bg-green-100 text-green-800"
                            : selectedExpense?.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedExpense?.status === "validated"
                          ? "Validé"
                          : selectedExpense?.status === "rejected"
                          ? "Rejeté"
                          : "En attente"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">
                      Journal des modifications
                    </h4>
                    <div className="space-y-3">
                      {expenseHistory.map((item, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-900 font-medium">
                              {item.action}
                            </p>
                            <span className="text-xs text-gray-500">
                              {item.formattedDate}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatTimeGMT2(new Date(item.timestamp))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-6">
                <button
                  onClick={closeHistoryModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
