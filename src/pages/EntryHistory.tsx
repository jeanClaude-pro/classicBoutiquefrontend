"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { currentLocale } from "../i18n";
import { describeTimeframe, formatDateTimeGMT2 } from "../utils/dateUtils";
import { serverUrl } from "../utils/constants";
import { apiErrorFromResponse, requestJson } from "../lib/apiError";
import { deleteEntryCopy } from "../lib/confirmationCopy";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { MODULES } from "../config/modules";
import { roleLabel } from "../config/roles";
import { entryStatusLabel, paymentMethodLabel } from "../lib/labels";
import { ENTRY_CATEGORIES, ENTRY_SOURCES, entryCategoryLabel, entrySourceLabel } from "../lib/entryOptions";
import { formatFC, formatUSD } from "../utils/salePricing";
import {
  Search,
  FileText,
  Eye,
  Download,
  User,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Filter,
  Shield,
} from "lucide-react";
import jsPDF from "jspdf";

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

interface Entry {
  _id: string;
  entryId: string;
  amount: number;
  enteredAmount?: number;
  enteredCurrency?: "USD" | "FC";
  amountUSD?: number;
  amountFC?: number;
  exchangeRate?: number;
  source: string;
  category: string;
  paymentMethod: string;
  description: string;
  receivedFrom: {
    name: string;
    phone: string;
    email: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  updatedBy?: string;
  editedBy?: string;
  editedAt?: string;
  editHistory?: EditHistoryEntry[];
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

interface PaginationMetadata {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface EntrySummaryGroup {
  count: number;
  amount: number;
}

interface EntrySummary {
  totalRecords: number;
  totalAmount: number;
  active: EntrySummaryGroup;
  deleted: EntrySummaryGroup;
  paymentMethods: Record<string, EntrySummaryGroup>;
  categories: Record<string, EntrySummaryGroup>;
  sources: Record<string, EntrySummaryGroup>;
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get date range for different timeframes
const getTimeframeParams = (
  timeframe: "day" | "week" | "month" | "year", 
  selectedYear?: number, 
  selectedDate?: string
) => {
  const params = new URLSearchParams();
  const today = new Date();
  
  switch (timeframe) {
    case "day":
      params.set("date", selectedDate || getTodayDate());
      break;
      
    case "week": {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.set("from", weekAgo.toISOString().split('T')[0]);
      params.set("to", today.toISOString().split('T')[0]);
      break;
    }

    case "month": {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("from", firstDayOfMonth.toISOString().split('T')[0]);
      params.set("to", lastDayOfMonth.toISOString().split('T')[0]);
      break;
    }

    case "year": {
      const year = selectedYear || today.getFullYear();
      params.set("year", year.toString());
      break;
    }
  }
  
  return params.toString();
};

export default function EntryHistory() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS DOUBLE M CLASSIC BOUTIQUE",
    shopAddress: "780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",
    shopNumber: "+243 975 085 799",
    shopRegistration: "LSH/RCCM/22-A-01266",
    // Empty: the receipt then uses its own closing line in the interface language.
    receiptFooter: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    source: "",
    category: "",
    paymentMethod: "cash" as "cash" | "card" | "transfer" | "other",
    description: "",
    receivedFrom: { name: "", phone: "", email: "" },
    reason: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User state for role checking
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const confirmAction = useConfirmAction();

  // Timeframe state
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("day");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [initialLoad, setInitialLoad] = useState(true);
  const [timeframeDescription, setTimeframeDescription] = useState<string>("");

  // Edited entries filter state
  const [showEditedEntries, setShowEditedEntries] = useState(false);
  const [editedEntries, setEditedEntries] = useState<Entry[]>([]);
  const [selectedEditedEntry, setSelectedEditedEntry] = useState<Entry | null>(null);
  const [showEditedDetailsModal, setShowEditedDetailsModal] = useState(false);
  const [summary, setSummary] = useState<EntrySummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  // Sources and categories (same stored values as Entry.tsx)
  const sources = ENTRY_SOURCES;
  const categories = ENTRY_CATEGORIES;

  // Effect to automatically set to today's date when timeframe changes to "day"
  useEffect(() => {
    if (!initialLoad && timeframe === "day") {
      const today = getTodayDate();
      setSelectedDate(today);
    }
  }, [timeframe, initialLoad]);

  // Fetch current user on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchEntries();
    fetch(`${serverUrl}/settings/receipt`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
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
  }, []);

  // Fetch entries when timeframe or filters change
  useEffect(() => {
    if (currentUser !== null) { // Only fetch entries after user data is loaded
      fetchEntries();
    }
  }, [timeframe, selectedYear, selectedDate, showEditedEntries, currentUser, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeframe, selectedYear, selectedDate, showEditedEntries, searchTerm]);

  // Update edited entries when entries change
  useEffect(() => {
    updateEditedEntries();
  }, [entries]);

  // Fetch current user from API or localStorage
  const fetchCurrentUser = async () => {
    try {
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAdmin(userData.role === "superadmin");
      } else {
        // Fallback to API call
        const res = await fetch(`${serverUrl}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          setIsAdmin(userData.role === "superadmin");
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Default to non-admin if can't fetch user
      setIsAdmin(false);
    }
  };

  const updateEditedEntries = () => {
    // Filter entries that have editHistory or editedBy field
    const edited = entries.filter(entry => 
      (entry.editHistory && entry.editHistory.length > 0) || entry.editedBy
    );

    // Sort by edit date (newest first)
    const sortedEditedEntries = edited.sort((a, b) => {
      const dateA = a.editedAt ? new Date(a.editedAt).getTime() : new Date(a.updatedAt).getTime();
      const dateB = b.editedAt ? new Date(b.editedAt).getTime() : new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    setEditedEntries(sortedEditedEntries);
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on timeframe
      const timeframeParams = getTimeframeParams(timeframe, selectedYear, selectedDate);
      
      // Add status filter for edited entries view
      const statusParam = showEditedEntries ? "&status=all" : "&status=active";
      const pageParam = `&page=${currentPage}&limit=50`;
      const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
      
      const url = `${serverUrl}/entries?${timeframeParams}${statusParam}${pageParam}${searchParam}`;
      
      console.log("Fetching entries from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        
        console.log("API Response:", data);
        
        if (data.success && data.data) {
          // Set entries
          const fetchedEntries: Entry[] = data.data;
          setEntries(fetchedEntries);
          setPagination(data.pagination || null);
          
          // Set timeframe description
          setTimeframeDescription(data.timeframe?.description || "");
          
          // Set summary data
          if (data.summary) {
            setSummary(data.summary);
          }
          
          console.log(`Fetched ${fetchedEntries.length} entries with timeframe: ${data.timeframe?.description}`);
        } else {
          console.error("Unexpected API response format:", data);
          setEntries([]);
          setSummary(null);
          setError(t("entryHistory.unexpectedResponse"));
        }
      } else {
        setError(t("entryHistory.loadFailed", { message: (await apiErrorFromResponse(res)).message }));
        setEntries([]);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
      setError(t("entryHistory.connectionFailed"));
      setEntries([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Get available years from API or default
  const getAvailableYears = (): number[] => {
    // Start with current year
    const currentYear = new Date().getFullYear();
    const years = [currentYear];
    
    // Add previous years (up to 5 years back)
    for (let i = 1; i <= 5; i++) {
      years.push(currentYear - i);
    }
    
    return years.sort((a, b) => b - a);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const years = getAvailableYears();
    const currentIndex = years.indexOf(selectedYear);
    
    if (direction === 'prev' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  const getTimeframeLabel = () => {
    if (timeframeDescription) {
      return describeTimeframe(timeframeDescription);
    }
    
    switch (timeframe) {
      case "day":
        if (selectedDate) {
          const date = new Date(selectedDate);
          return date.toLocaleDateString(currentLocale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        return t("dates.today");
      case "week":
        return t("entryHistory.thisWeek");
      case "month":
        return t("entryHistory.thisMonth");
      case "year":
        return t("dates.year", { year: selectedYear });
      default:
        return t("entryHistory.thisWeek");
    }
  };

  const handleTimeframeChange = (period: "day" | "week" | "month" | "year") => {
    setTimeframe(period);
    
    if (period === "year") {
      const years = getAvailableYears();
      setSelectedYear(years[0] || new Date().getFullYear());
    }
  };

  // Filter entries based on search term
  const filteredEntries = (showEditedEntries ? editedEntries : entries).filter(entry =>
    entry.entryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.receivedFrom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.receivedFrom.phone.includes(searchTerm) ||
    entry.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.createdBy?.username && entry.createdBy.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatOriginalAmount = (entry: Entry) =>
    entry.enteredCurrency === "FC"
      ? `${formatFC(entry.enteredAmount ?? entry.amountFC ?? 0)} (${t("entryHistory.equivalent", { amount: formatUSD(entry.amountUSD ?? entry.amount) })})`
      : formatUSD(entry.enteredAmount ?? entry.amount);

  // Function to view edited entry details
  const viewEditedEntryDetails = (entry: Entry) => {
    setSelectedEditedEntry(entry);
    setShowEditedDetailsModal(true);
  };

  // Function to render change comparison
  const renderChangeComparison = (entry: Entry) => {
    if (!entry.editHistory || entry.editHistory.length === 0) return null;

    const latestEdit = entry.editHistory[entry.editHistory.length - 1];
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
            <span className="font-medium">{latestEdit.editedBy || entry.editedBy || t("salesHistory.notProvided")}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("salesHistory.editDate")}:</span>
            <span className="font-medium">{formatDate(latestEdit.editedAt || entry.editedAt || entry.updatedAt)}</span>
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

  // Print function for entry receipt
  const printEntryReceipt = (entry: Entry) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html lang="${currentLocale().slice(0, 2)}">
  <head>
    <title>${t("entryReceipt.title")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0; padding: 0;
        font-size: 12px; font-weight: bold; line-height: 1.2;
        width: 80mm; background-color: white;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .receipt-container { width: 78mm; margin: 0 auto; padding: 1mm 2mm; border: none; text-align: center; position: relative; }
      .logo-watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${window.location.origin}/newlogo.png'); background-repeat: no-repeat; background-position: center; background-size: 65%; opacity: 0.18; pointer-events: none; z-index: 0; }
      .content-wrapper { position: relative; z-index: 1; }
      .header { text-align: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 2px double #000; }
      .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 0.5mm; text-transform: uppercase; }
      .shop-details { font-size: 10px; margin-bottom: 0.3mm; line-height: 1.2; font-weight: bold; }
      .receipt-info { margin: 2mm 0; padding: 1mm 2mm; background-color: #f8f8f8; border-left: 3px solid #000; text-align: left; }
      .receipt-title { font-size: 11px; font-weight: bold; margin: 1mm 0; text-transform: uppercase; background-color: #000; color: white; padding: 1mm 2mm; border-radius: 2px; text-align: center; }
      .entry-badge { background-color: #000; color: white; padding: 2mm; font-weight: bold; text-align: center; margin: 1mm 0; font-size: 13px; border-radius: 3px; }
      .details-section { margin: 0; padding: 0; background-color: #fafafa; border: none; }
      .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; padding: 0.5mm 2mm; border-bottom: 1px dotted #ddd; font-size: 10px; }
      .detail-label { text-align: left; font-weight: bold; font-size: 10px; flex: 1; }
      .detail-value { text-align: right; font-weight: bold; font-size: 10px; flex: 1; }
      .amount-section { font-weight: bold; margin-top: 2mm; padding: 1mm 2mm; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; }
      .amount-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; font-size: 11px; padding: 0 1mm; }
      .payment-method { text-transform: uppercase; font-weight: bold; font-size: 11px; color: #000; }
      .footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #f8f8f8; border-top: 1px dashed #000; }
      .agent-info { margin-top: 2mm; text-align: center; font-weight: bold; font-size: 10px; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 2px; }
      .sender-info { margin: 2mm 0; padding: 1mm 2mm; font-weight: bold; text-align: left; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 10px; }
      .sender-field { margin-bottom: 0.3mm; font-size: 10px; }
      .cut-line { text-align: center; margin: 2mm 0 0 0; font-weight: bold; font-size: 10px; color: #000; letter-spacing: 1px; }
      .thank-you { font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
      .warning { font-size: 9px; color: #000; margin: 0.3mm 0; font-weight: bold; }
      .description { margin: 1mm 0; padding: 1mm 2mm; background-color: #f5f5f5; border-left: 3px solid #ccc; font-size: 10px; font-weight: bold; border-radius: 2px; text-align: left; }
      .section-divider { height: 2px; background: linear-gradient(to right, transparent, #000, transparent); margin: 1mm 0; }
      @media print {
        @page { margin: 0 !important; size: 80mm auto !important; }
        body { margin: 0 !important; padding: 0 !important; width: 80mm !important; font-size: 12px !important; background: white !important; font-weight: bold !important; height: auto !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .receipt-container { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 1mm 2mm !important; width: 78mm !important; }
        .cut-line { page-break-after: always !important; margin-bottom: 0 !important; }
        body::after, body::before { display: none !important; content: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${shopSettings.shopName}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopAddress}</strong></div>
        <div class="shop-details">${t("receipt.tel")}: <strong>${shopSettings.shopNumber}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${t("receipt.date")}: <strong>${formatDate(entry.createdAt)}</strong></div>
        <div class="shop-details">${t("receipt.receiptNo")}: <strong>${entry.entryId}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>${t("entryReceipt.confirmed")}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${t("receipt.receivedFrom")}: <strong>${entry.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">${t("receipt.phone")}: <strong>${entry.receivedFrom.phone}</strong></div>
        ${entry.receivedFrom.email ? `<div class="sender-field">${t("receipt.email")}: <strong>${entry.receivedFrom.email}</strong></div>` : ""}
      </div>
      
      ${entry.description ? `<div class="description"><strong>${t("receipt.description")}:</strong> <strong>${entry.description}</strong></div>` : ''}
      
      <div class="receipt-title">${t("entryReceipt.details")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.source")}:</strong></div>
          <div class="detail-value"><strong>${entrySourceLabel(entry.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.category")}:</strong></div>
          <div class="detail-value"><strong>${entryCategoryLabel(entry.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${paymentMethodLabel(entry.paymentMethod).toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${t("receipt.amountReceived")}:</strong></div>
          <div><strong>${formatOriginalAmount(entry)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        ${t("receipt.recordedBy")}: <strong>${(entry.createdBy?.username || t("salesHistory.notSpecified")).toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${shopSettings.receiptFooter || t("entryReceipt.success")}</strong></div>
        <div class="warning"><strong>${t("entryReceipt.keep")}</strong></div>
      </div>

      <div class="cut-line">✄ ────────────────────────── ✄</div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try { window.print(); } catch(e) { console.error('Print error:', e); }
        setTimeout(() => { window.close(); }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  const generateEntryPDF = (entry: Entry) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text(shopSettings.shopName, 105, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text(t("saleReceipt.tagline").replace(/_/g, ""), 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(shopSettings.shopRegistration, 105, 20, { align: "center" });
    doc.text(`${t("receipt.tel")}: ${shopSettings.shopNumber}`, 105, 25, { align: "center" });
    doc.text(shopSettings.shopAddress, 105, 30, { align: "center" });

    doc.setFontSize(16);
    doc.text(t("entryReceipt.title"), 105, 37, { align: "center" });

    // Entry Info
    doc.setFontSize(10);
    doc.text(`${t("entryReceipt.date")}: ${formatDate(entry.createdAt)}`, 20, 45);
    doc.text(`${t("entryReceipt.receiptNo")}: ${entry.entryId}`, 20, 52);
    doc.text(`${t("entryHistory.paymentMethod")}: ${paymentMethodLabel(entry.paymentMethod).toUpperCase()}`, 20, 59);
    doc.text(`${t("entryHistory.status")}: ${entryStatusLabel(entry.status).toUpperCase()}`, 20, 66);

    // Created By Info
    doc.text(`${t("receipt.recordedBy")}: ${entry.createdBy?.username || t("salesHistory.notSpecified")}`, 20, 73);

    // Received From Info
    doc.setFontSize(12);
    doc.text(`${t("entryHistory.senderInfo")}:`, 20, 85);
    doc.setFontSize(10);
    doc.text(`${t("entryHistory.name")}: ${entry.receivedFrom.name}`, 20, 92);
    doc.text(`${t("common.phone")}: ${entry.receivedFrom.phone}`, 20, 99);
    if (entry.receivedFrom.email) {
      doc.text(`${t("common.email")}: ${entry.receivedFrom.email}`, 20, 106);
    }

    // Entry Details
    doc.setFontSize(12);
    doc.text(`${t("entryHistory.details.title")}:`, 20, 113);
    doc.setFontSize(10);

    let yPos = 120;
    doc.text(`${t("entryHistory.source")}: ${entrySourceLabel(entry.source)}`, 20, yPos); yPos += 7;
    doc.text(`${t("entryHistory.category")}: ${entryCategoryLabel(entry.category)}`, 20, yPos); yPos += 7;
    doc.text(`${t("entryHistory.amount")}: ${formatOriginalAmount(entry)}`, 20, yPos); yPos += 7;

    if (entry.description) {
      yPos += 3;
      doc.text(`${t("entryHistory.description")}: ${entry.description}`, 20, yPos); yPos += 10;
    }

    // Footer
    doc.setFontSize(10);
    doc.text(shopSettings.receiptFooter || t("entryReceipt.success"), 105, yPos + 20, { align: "center" });
    doc.text(t("entryReceipt.keep"), 105, yPos + 30, { align: "center" });
    doc.text(t("entryReceipt.thanks"), 105, yPos + 40, { align: "center" });

    doc.save(`entry-${entry.entryId}.pdf`);
  };

  const viewEntryDetails = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (entry: Entry) => {
    if (entry.status === "deleted") {
      setError(t("entryHistory.notEditable"));
      return;
    }

    setEditingEntry(entry);
    setEditForm({
      amount: entry.amount,
      source: entry.source,
      category: entry.category,
      paymentMethod: entry.paymentMethod as "cash" | "card" | "transfer" | "other",
      description: entry.description,
      receivedFrom: { ...entry.receivedFrom },
      reason: "",
    });
    setShowEditModal(true);
    setError(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditForm({
      amount: 0,
      source: "",
      category: "",
      paymentMethod: "cash",
      description: "",
      receivedFrom: { name: "", phone: "", email: "" },
      reason: "",
    });
    setError(null);
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    if (!editForm.receivedFrom.name || !editForm.receivedFrom.phone) {
      setError(t("entryHistory.senderRequired"));
      return;
    }

    if (!editForm.reason) {
      setError(t("entryHistory.reasonRequired"));
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        amount: editForm.amount,
        source: editForm.source,
        category: editForm.category,
        paymentMethod: editForm.paymentMethod,
        description: editForm.description,
        receivedFrom: editForm.receivedFrom,
        reason: editForm.reason,
      };

      console.log("Sending update data:", updateData);

      const response = await fetch(
        `${serverUrl}/entries/${editingEntry._id}`,
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
        const updatedEntry = await response.json();
        console.log("Updated entry:", updatedEntry);

        setMessage(`✅ ${t("entryHistory.updated")}`);
        await fetchEntries();
        closeEditModal();
      } else {
        setError((await apiErrorFromResponse(response)).message);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      setError(t("entryHistory.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Superadmin only; the server marks the entry as deleted (kept for audit).
  const handleDeleteEntry = (entry: Entry) => {
    if (entry.status === "deleted") return;
    confirmAction.request({
      ...deleteEntryCopy(entry),
      action: () => requestJson(`${serverUrl}/entries/${entry._id}`, { method: "DELETE" }),
      onSuccess: async () => { setShowModal(false); await fetchEntries(); },
      onError: async (error) => { if (error.isConflict || error.status === 404) await fetchEntries(); },
    });
  };

  // Summary statistics display component - ONLY VISIBLE TO ADMINS
  const SummaryStats = () => {
    if (!summary || !isAdmin) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t("entryHistory.summary.title")}
          </h3>
          {currentUser && (
            <span className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              {t("entryHistory.summary.loggedInAs", { user: currentUser.name || currentUser.username, role: roleLabel(currentUser.role) })}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("entryHistory.summary.total")}</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalRecords}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("entryHistory.summary.totalAmount")}</p>
                <p className="text-2xl font-bold text-green-600">{formatUSD(summary.totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("entryHistory.summary.active")}</p>
                <p className="text-2xl font-bold text-green-600">{summary.active?.count || 0}</p>
                <p className="text-sm text-gray-500">{formatUSD(summary.active?.amount || 0)}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("entryHistory.summary.paymentMethods")}</p>
                <p className="text-xl font-semibold text-purple-600">
                  {Object.keys(summary.paymentMethods || {}).length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Detailed stats row */}
        {summary.paymentMethods && Object.keys(summary.paymentMethods).length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">{t("entryHistory.summary.byPaymentMethod")}:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(summary.paymentMethods).map(([method, data]) => (
                <div key={method} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{paymentMethodLabel(method)}:</span>
                    <span className="font-semibold text-green-600">{data.count}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t("entryHistory.summary.totalValue", { amount: formatUSD(data.amount) })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources summary */}
        {summary.sources && Object.keys(summary.sources).length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">{t("entryHistory.summary.topSources")}:</h4>
            <div className="space-y-2">
              {Object.entries(summary.sources)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .slice(0, 3)
                .map(([source, data]) => (
                  <div key={source} className="flex justify-between items-center bg-white p-2 rounded border">
                    <span className="text-gray-700">{entrySourceLabel(source)}</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{t("entryHistory.entryCount", { count: data.count })}</div>
                      <div className="text-sm text-green-600">{formatUSD(data.amount)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {MODULES.entryhistory.label}
          </h1>
          <p className="text-gray-600">
            {MODULES.entryhistory.description}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Edited Entries Filter Button */}
          <button
            onClick={() => setShowEditedEntries(!showEditedEntries)}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
              showEditedEntries
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {showEditedEntries ? t("entryHistory.allEntries") : t("entryHistory.editedEntries")}
            {showEditedEntries && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {editedEntries.length}
              </span>
            )}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("entryHistory.searchPlaceholder")}
              aria-label={t("entryHistory.searchPlaceholder")}
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Timeframe Filter Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            {showEditedEntries ? t("entryHistory.editedEntries") : t("entryHistory.allEntries")} - {getTimeframeLabel()}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Date Picker for Day View */}
            {timeframe === "day" && (
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <label htmlFor="date-picker" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  {t("common.date")}:
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ml-2 px-2 py-1 border-none bg-transparent text-xs sm:text-sm focus:outline-none focus:ring-0 text-gray-900 font-medium w-full"
                />
              </div>
            )}
            
            {timeframe === "year" && (
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                <button
                  onClick={() => navigateYear('prev')}
                  disabled={getAvailableYears().indexOf(selectedYear) === getAvailableYears().length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-900 px-2 min-w-[60px] sm:min-w-[80px] text-center">{selectedYear}</span>
                <button
                  onClick={() => navigateYear('next')}
                  disabled={getAvailableYears().indexOf(selectedYear) === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              {(["day", "week", "month", "year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeframeChange(period)}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    timeframe === period
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {t(`entryHistory.periods.${period}`)}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
              title={t("common.refresh")}
              aria-label={t("common.refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Show summary statistics - Admin only */}
        <SummaryStats />
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
            {showEditedEntries ? t("entryHistory.editedEntries") : t("entryHistory.cashEntries")} ({filteredEntries.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">{t("entryHistory.loading")}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {showEditedEntries 
                  ? t("entryHistory.noEditedEntries") 
                  : t("entryHistory.noEntries")
                }
              </p>
              <p className="text-sm">{t("salesHistory.forPeriod")}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.cols.entryId")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.cols.sender")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.source")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("salesHistory.cols.payment")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("entryHistory.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.date")}
                  </th>
                  {showEditedEntries && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("salesHistory.lastEdit")}
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.entryId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.receivedFrom.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.receivedFrom.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entrySourceLabel(entry.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entryCategoryLabel(entry.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatOriginalAmount(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {paymentMethodLabel(entry.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          entry.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {entryStatusLabel(entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    {showEditedEntries && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.editedAt ? formatDate(entry.editedAt) : t("common.notAvailable")}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {showEditedEntries ? (
                          <button
                            onClick={() => viewEditedEntryDetails(entry)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title={t("salesHistory.actions.viewEdits")}
                          >
                            <History className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => viewEntryDetails(entry)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title={t("salesHistory.actions.view")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {!showEditedEntries && (
                          <>
                            <button
                              onClick={() => openEditModal(entry)}
                              disabled={entry.status === "deleted"}
                              className={`p-1 rounded ${
                                entry.status === "deleted"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-yellow-600 hover:text-yellow-900"
                              }`}
                              title={t("entryHistory.actions.edit")}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => generateEntryPDF(entry)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title={t("salesHistory.actions.downloadPdfShort")}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printEntryReceipt(entry)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              title={t("salesHistory.actions.printReceipt")}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {isAdmin && <button
                              onClick={() => handleDeleteEntry(entry)}
                              disabled={entry.status === "deleted" || confirmAction.busy}
                              className={`p-1 rounded ${
                                entry.status === "deleted"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-900"
                              }`}
                              title={t("entryHistory.actions.delete")}
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
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <span className="text-sm text-gray-600">
            {t("entryHistory.pagination", { page: pagination.page, pages: pagination.totalPages, count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded border px-3 py-1.5 disabled:opacity-40">{t("salesHistory.previous")}</button>
            <button disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">{t("salesHistory.next")}</button>
          </div>
        </div>
      )}

      {/* Entry Details Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("entryHistory.details.title")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Entry Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("entryHistory.cols.entryId")}
                  </span>
                  <p className="text-sm text-gray-900">{selectedEntry.entryId}</p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("common.date")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedEntry.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("entryHistory.paymentMethod")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {paymentMethodLabel(selectedEntry.paymentMethod)}
                  </p>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("entryHistory.status")}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedEntry.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {entryStatusLabel(selectedEntry.status)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    {t("entryHistory.recordedBy")}
                  </span>
                  <p className="text-sm text-gray-900">
                    {selectedEntry.createdBy?.username || t("salesHistory.notSpecified")}
                  </p>
                </div>
                {selectedEntry.editedBy && (
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("salesHistory.lastEdit")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedEntry.editedAt
                        ? t("salesHistory.details.editedByOn", { user: selectedEntry.editedBy, date: formatDate(selectedEntry.editedAt) })
                        : t("salesHistory.details.editedByOnly", { user: selectedEntry.editedBy })}
                    </p>
                  </div>
                )}
              </div>

              {/* Received From Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("entryHistory.senderInfo")}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("entryHistory.name")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.receivedFrom.name}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        {t("common.phone")}
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.receivedFrom.phone}
                      </p>
                    </div>
                    {selectedEntry.receivedFrom.email && (
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          {t("common.email")}
                        </span>
                        <p className="text-sm text-gray-900">
                          {selectedEntry.receivedFrom.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t("entryHistory.details.title")}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">{t("entryHistory.source")}:</span>
                    <span className="text-gray-900">{entrySourceLabel(selectedEntry.source)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">{t("entryHistory.category")}:</span>
                    <span className="text-gray-900">{entryCategoryLabel(selectedEntry.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">{t("entryHistory.amount")}:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatUSD(selectedEntry.amount)}
                    </span>
                  </div>
                  {selectedEntry.description && (
                    <div>
                      <span className="font-medium text-gray-700">{t("entryHistory.description")}:</span>
                      <p className="text-gray-900 mt-1">{selectedEntry.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show edit history if available */}
              {selectedEntry.editHistory && selectedEntry.editHistory.length > 0 && (
                renderChangeComparison(selectedEntry)
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={() => generateEntryPDF(selectedEntry)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("salesHistory.actions.downloadPdfShort")}
                </button>
                <button
                  onClick={() => printEntryReceipt(selectedEntry)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {t("salesHistory.actions.printReceipt")}
                </button>
                <button
                  onClick={() => openEditModal(selectedEntry)}
                  disabled={selectedEntry.status === "deleted"}
                  className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    selectedEntry.status === "deleted"
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {t("entryHistory.actions.edit")}
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

      {/* Edited Entry Details Modal */}
      {showEditedDetailsModal && selectedEditedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("salesHistory.edits.title", { id: selectedEditedEntry.entryId })}
              </h3>
              <button
                onClick={() => setShowEditedDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Entry Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg">
                  {t("entryHistory.edits.currentState")}
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.cols.sender")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedEditedEntry.receivedFrom.name} ({selectedEditedEntry.receivedFrom.phone})
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.edits.currentAmount")}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatUSD(selectedEditedEntry.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.source")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {entrySourceLabel(selectedEditedEntry.source)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.category")}
                    </span>
                    <p className="text-sm text-gray-900">
                      {entryCategoryLabel(selectedEditedEntry.category)}
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
                  {selectedEditedEntry.editHistory && selectedEditedEntry.editHistory.length > 0 ? (
                    selectedEditedEntry.editHistory.map((edit, index) => (
                      <div key={edit._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {t("salesHistory.edits.number", { number: selectedEditedEntry.editHistory!.length - index })}
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

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("entryHistory.editTitle", { id: editingEntry.entryId })}
              </h3>
              <button
                onClick={closeEditModal}
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

              {/* Entry Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("entryHistory.entryInfo")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="entry-edit-montant" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.amountUsd")} *
                    </label>
                    <input
                      id="entry-edit-montant"
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="entry-edit-source" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.source")} *
                    </label>
                    <select
                      id="entry-edit-source"
                      value={editForm.source}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          source: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">{t("entry.selectSource")}</option>
                      {sources.map((source) => (
                        <option key={source} value={source}>
                          {entrySourceLabel(source)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="entry-edit-categorie" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.category")} *
                    </label>
                    <select
                      id="entry-edit-categorie"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">{t("entry.selectCategory")}</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {entryCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="entry-edit-methode-de-paiement" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.paymentMethod")} *
                    </label>
                    <select
                      id="entry-edit-methode-de-paiement"
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as "cash" | "card" | "transfer" | "other",
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    >
                      {(["cash", "card", "transfer", "other"] as const).map((value) => (
                        <option key={value} value={value}>{paymentMethodLabel(value)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="entry-edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("entryHistory.description")}
                </label>
                <textarea
                  id="entry-edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t("entry.descriptionPlaceholder")}
                  className="w-full p-2 border rounded h-20"
                />
              </div>

              {/* Received From Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t("entryHistory.senderInfo")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="entry-edit-nom" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("entryHistory.name")} *
                    </label>
                    <input
                      id="entry-edit-nom"
                      type="text"
                      value={editForm.receivedFrom.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, name: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="entry-edit-telephone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("common.phone")} *
                    </label>
                    <input
                      id="entry-edit-telephone"
                      type="tel"
                      value={editForm.receivedFrom.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, phone: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="entry-edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("common.email")}
                    </label>
                    <input
                      id="entry-edit-email"
                      type="email"
                      value={editForm.receivedFrom.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, email: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
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
                  placeholder={t("entryHistory.reasonPlaceholder")}
                  className="w-full p-2 border rounded h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleEditEntry}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {t("entryHistory.updating")}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> {t("entryHistory.update")}
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
