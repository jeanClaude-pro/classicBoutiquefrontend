/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { currentLocale } from "../i18n";
import { ENTRY_CATEGORIES, ENTRY_SOURCES, entryCategoryLabel, entrySourceLabel } from "../lib/entryOptions";
import { apiErrorFromPayload, toApiError } from "../lib/apiError";
import { MODULES } from "../config/modules";
import { notifySuccess } from "../lib/notify";
import { formatNowGMT2, formatDateGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { DollarSign, RefreshCw, FileText, User, Calculator } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot, formatFC, formatUSD } from "../utils/salePricing";

interface Entry {
  _id: string;
  entryId: string;
  amount: number;
  source: string;
  category: string;
  paymentMethod: string;
  description: string;
  receivedFrom: {
    name: string;
    phone: string;
    email: string;
  };
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  status: string;
}

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

type UiPayment = "cash" | "mpesa" | "card" | "bank" | "other";

// Payment method normalization function (matches your route)
function uiToModelPayment(pm: UiPayment): "cash" | "card" | "transfer" | "other" {
  if (pm === "cash") return "cash";
  if (pm === "card") return "card";
  if (pm === "mpesa" || pm === "bank") return "transfer";
  return "other";
}

// Safe JSON parser to handle HTML errors
async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

export default function Entry() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  // Synchronous guard: a second click can arrive before `submitting` re-renders.
  const submitLock = useRef(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  const { user: currentUser } = useAuth();

  const [form, setForm] = useState({
    amount: "",
    amountInFC: "",
    source: "",
    category: "",
    paymentMethod: "cash" as UiPayment,
    description: "",
    receivedFromName: "",
    receivedFromPhone: "",
    receivedFromEmail: "",
    currencyMode: "fc" as "usd" | "fc"
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Predefined sources and categories: stable stored values, translated labels.
  const sources = ENTRY_SOURCES;
  const categories = ENTRY_CATEGORIES;
  // Receipt helpers: labels in the language active when the receipt is printed.
  const receiptAmount = (data: any) => data.enteredCurrency === "FC" ? `${data.enteredAmount.toLocaleString(currentLocale())} FC` : `$${data.enteredAmount.toFixed(2)}`;
  const receiptPayment = (data: any) => t(`entryOptions.payment.${data.paymentMethod}`, { defaultValue: data.paymentMethod }).toUpperCase();

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token") || ""}`,
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
    loadExchangeRate();
  }, []);

  // Calculate USD amount when FC amount changes
  useEffect(() => {
    if (form.currencyMode === "fc" && form.amountInFC && exchangeRate) {
      const fcAmount = parseFloat(form.amountInFC) || 0;
      const usdAmount = fcAmount / exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amount: usdAmount.toFixed(2)
      }));
    }
  }, [form.amountInFC, form.currencyMode, exchangeRate]);

  // Calculate FC amount when USD amount changes
  useEffect(() => {
    if (form.currencyMode === "usd" && form.amount && exchangeRate) {
      const usdAmount = parseFloat(form.amount) || 0;
      const fcAmount = usdAmount * exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amountInFC: Math.round(fcAmount).toString()
      }));
    }
  }, [form.amount, form.currencyMode, exchangeRate]);

  const isFormValid = 
    parseFloat(form.amount) > 0 && 
    form.source.trim() !== "" && 
    form.category.trim() !== "" && 
    form.receivedFromName.trim() !== "" &&
    form.receivedFromPhone.trim() !== "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
      amount: "",
      amountInFC: ""
    }));
  };

  function authHeader(): Record<string, string> {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Print function for entry receipt only
  const printReceiptOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>${t("entryReceipt.title")}</title>
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
      .entry-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .details-section {
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
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
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
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
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
      .description {
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
        <div class="shop-name"><strong>${receiptData.shopName}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopAddress}</strong></div>
        <div class="shop-details">${t("receipt.tel")}: <strong>${receiptData.shopNumber}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${t("receipt.date")}: <strong>${receiptData.date}</strong></div>
        <div class="shop-details">${t("receipt.receiptNo")}: <strong>${receiptData.receiptNumber}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>${t("entryReceipt.confirmed")}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${t("receipt.receivedFrom")}: <strong>${receiptData.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">${t("receipt.phone")}: <strong>${receiptData.receivedFrom.phone}</strong></div>
        ${
          receiptData.receivedFrom.email
            ? `<div class="sender-field">${t("receipt.email")}: <strong>${receiptData.receivedFrom.email}</strong></div>`
            : ""
        }
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>${t("receipt.description")}:</strong> <strong>${receiptData.description}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">${t("entryReceipt.details")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.source")}:</strong></div>
          <div class="detail-value"><strong>${entrySourceLabel(receiptData.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.category")}:</strong></div>
          <div class="detail-value"><strong>${entryCategoryLabel(receiptData.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${receiptPayment(receiptData)}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${t("receipt.amountReceived")}:</strong></div>
          <div><strong>${receiptAmount(receiptData)}</strong></div>
        </div>
        ${
          receiptData.enteredCurrency === "FC"
            ? `<div class="amount-row">
                 <div><strong>${t("entryReceipt.usdEquivalent")}:</strong></div>
                 <div><strong>$${receiptData.amountUSD.toFixed(2)}</strong></div>
               </div>`
            : ''
        }
      </div>
      
      <div class="agent-info">
        ${t("receipt.recordedBy")}: <strong>${receiptData.agent.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${t("entryReceipt.success")}</strong></div>
        <div class="warning"><strong>${t("entryReceipt.keep")}</strong></div>
        <div class="warning"><strong>${t("entryReceipt.thanks")}</strong></div>
        <div class="thank-you"><strong>${t("entryReceipt.seeYou")}</strong></div>
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

  // Print function for entry stub only
  const printStubOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>${t("entryReceipt.stubTitle")}</title>
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
      .stub-container { 
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
        font-size: 14px;
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
      .stub-number {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .details-section {
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
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
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
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
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
      .description {
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
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .stub-container { 
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
    <div class="stub-container">
      <div class="header">
        <div class="shop-name"><strong>${receiptData.shopName}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopAddress}</strong></div>
        <div class="shop-details">${t("receipt.tel")}: <strong>${receiptData.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${t("receipt.date")}: <strong>${receiptData.date}</strong></div>
        <div class="shop-details">${t("receipt.receiptNo")}: <strong>${receiptData.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>${t("entryReceipt.stubNumber", { number: receiptData.stubNumber })}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${t("receipt.receivedFrom")}: <strong>${receiptData.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">${t("receipt.phone")}: <strong>${receiptData.receivedFrom.phone}</strong></div>
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>${t("receipt.description")}:</strong> <strong>${receiptData.description}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">${t("entryReceipt.stubDetails")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.source")}:</strong></div>
          <div class="detail-value"><strong>${entrySourceLabel(receiptData.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.category")}:</strong></div>
          <div class="detail-value"><strong>${entryCategoryLabel(receiptData.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${t("receipt.paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${receiptPayment(receiptData)}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${t("receipt.amountReceived")}:</strong></div>
          <div><strong>${receiptAmount(receiptData)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        ${t("receipt.recordedBy")}: <strong>${receiptData.agent.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>${t("entryReceipt.stubFooter")}</strong></div>
        <div class="warning"><strong>${receiptData.shopName}</strong></div>
        <div class="warning"><strong>${t("entryReceipt.keepStub")}</strong></div>
        <div class="warning">${t("entryReceipt.receiptNo")}: <strong>${receiptData.receiptNumber}</strong></div>
        <div class="warning">${t("entryReceipt.date")}: <strong>${receiptData.date}</strong></div>
        <div class="warning">${t("entryReceipt.source")}: <strong>${entrySourceLabel(receiptData.source)}</strong></div>
        <div class="warning">${t("entryReceipt.amount")}: <strong>${receiptAmount(receiptData)}</strong></div>
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

  // Sequential printing function for entries
  const printSequentially = () => {
    // Print receipt first
    printReceiptOnly();
    
    // Wait 2 seconds then print stub
    setTimeout(() => {
      printStubOnly();
    }, 2000);
  };

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(() => {
        printSequentially();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submitting || submitLock.current) return;

    submitLock.current = true;
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // Convert payment method to match backend model
      const normalizedPaymentMethod = uiToModelPayment(form.paymentMethod);
      const amountSnapshot = createAmountSnapshot(
        parseFloat(form.currencyMode === "fc" ? form.amountInFC : form.amount),
        form.currencyMode === "fc" ? "FC" : "USD",
        exchangeRate?.rate
      );

      const body = {
        amount: amountSnapshot.amountUSD,
        ...amountSnapshot,
        source: form.source,
        category: form.category,
        paymentMethod: normalizedPaymentMethod,
        description: form.description,
        receivedFrom: {
          name: form.receivedFromName,
          phone: form.receivedFromPhone,
          email: form.receivedFromEmail || "",
        }
      };

      console.log("Sending entry data:", body);

      const res = await fetch(`${API_BASE}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });

      // Use safe JSON parser to handle HTML errors
      const data = await readJsonSafe(res);
      
      if (!res.ok) {
        throw apiErrorFromPayload(res.status, data);
      }

      console.log("Entry created successfully:", data);

      // Get the entry ID from the API response
      const entryId = data.entryId || data._id;
      
      // Enhanced receipt data
      const newReceiptData = {
        shopName: "ETS DOUBLE M CLASSIC BOUTIQUE",
        shopAddress: "780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",
        shopNumber: "+243 836 017 031",
        shopRegistration: "LSH/RCCM/22-A-01266",
        amount: amountSnapshot.amountUSD,
        ...amountSnapshot,
        source: form.source,
        category: form.category,
        paymentMethod: form.paymentMethod, // Keep UI payment method for display
        description: form.description,
        receivedFrom: {
          name: form.receivedFromName,
          phone: form.receivedFromPhone,
          email: form.receivedFromEmail,
        },
        agent: currentUser?.username || t("entry.agent"),
        date: formatNowGMT2(),
        receiptNumber: entryId,
        stubNumber: entryId,
        exchangeRate: exchangeRate?.rate
      };

      setReceiptData(newReceiptData);

      // Reset form
      setForm({
        amount: "",
        amountInFC: "",
        source: "",
        category: "",
        paymentMethod: "cash",
        description: "",
        receivedFromName: "",
        receivedFromPhone: "",
        receivedFromEmail: "",
        currencyMode: "fc"
      });

      setMessage(
        t("entry.recordedPrinting")
      );
      notifySuccess(t("entry.recorded"));
    } catch (e: any) {
      console.error("Error creating entry:", e);
      setError(toApiError(e).message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header with Exchange Rate */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{MODULES.entry.label}</h2>
              <p className="text-gray-600 mt-1">{MODULES.entry.description}</p>
            </div>
            
            {/* Exchange Rate Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{t("entry.todayRate")}</span>
                </div>
                {loadingRate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : exchangeRate ? (
                  <div className="text-right">
                    <div className="font-bold text-blue-800 text-lg">
                      1 USD = {new Intl.NumberFormat(currentLocale()).format(exchangeRate.rate)} FC
                    </div>
                    <div className="text-xs text-blue-600">
                      {t("entry.effectiveSince", { date: formatDateGMT2(exchangeRate.effectiveFrom) })}
                    </div>
                  </div>
                ) : (
                  <span className="text-red-600 text-sm">{t("entry.rateUnavailable")}</span>
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

        <form onSubmit={handleEntry} className="space-y-6">
          {/* Amount and Basic Info */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              {t("entry.info")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="entry-amount" className="block font-medium text-gray-700">
                    {t("entry.amount")}
                  </label>
                  <button
                    type="button"
                    onClick={toggleCurrencyMode}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Calculator className="w-3 h-3" />
                    {form.currencyMode === 'usd' ? 'USD → FC' : 'FC → USD'}
                  </button>
                </div>
                
                {form.currencyMode === 'usd' ? (
                  <input
                    id="entry-amount"
                    type="number"
                    step="0.01"
                    name="amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder={t("entry.amountUsdPlaceholder")}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0.01"
                    required
                  />
                ) : (
                  <input
                    id="entry-amount"
                    type="number"
                    name="amountInFC"
                    value={form.amountInFC}
                    onChange={(e) => setForm({ ...form, amountInFC: e.target.value })}
                    placeholder={t("entry.amountFcPlaceholder")}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                )}
                
                {/* Conversion Display */}
                {form.amount && form.currencyMode === 'usd' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatFC(parseFloat(form.amount) * exchangeRate.rate)}
                  </p>
                )}
                {form.amountInFC && form.currencyMode === 'fc' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatUSD(parseFloat(form.amountInFC) / exchangeRate.rate)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="entry-source" className="block mb-2 font-medium text-gray-700">
                  {t("entry.source")}
                </label>
                <select
                  id="entry-source"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label htmlFor="entry-category" className="block mb-2 font-medium text-gray-700">
                  {t("entry.category")}
                </label>
                <select
                  id="entry-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label htmlFor="entry-payment-method" className="block mb-2 font-medium text-gray-700">
                  {t("entry.paymentMethod")}
                </label>
                <select
                  id="entry-payment-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cash">{t("entryOptions.payment.cash")}</option>
                  <option value="mpesa">{t("entryOptions.payment.mpesa")}</option>
                  <option value="bank">{t("entryOptions.payment.bank")}</option>
                  <option value="card">{t("entryOptions.payment.card")}</option>
                  <option value="other">{t("entryOptions.payment.other")}</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="entry-description" className="block mb-2 font-medium text-gray-700">
                {t("entry.description")}
              </label>
              <textarea
                id="entry-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t("entry.descriptionPlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {/* Received From Information */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {t("entry.sender")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entry-received-from-name" className="block mb-2 font-medium text-gray-700">
                  {t("entry.senderName")}
                </label>
                <input
                  id="entry-received-from-name"
                  type="text"
                  name="receivedFromName"
                  value={form.receivedFromName}
                  onChange={handleChange}
                  placeholder={t("entry.senderNamePlaceholder")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="entry-received-from-phone" className="block mb-2 font-medium text-gray-700">
                  {t("entry.senderPhone")}
                </label>
                <input
                  id="entry-received-from-phone"
                  type="tel"
                  name="receivedFromPhone"
                  value={form.receivedFromPhone}
                  onChange={handleChange}
                  placeholder={t("entry.senderPhonePlaceholder")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entry-received-from-email" className="block mb-2 font-medium text-gray-700">
                  {t("entry.senderEmail")}
                </label>
                <input
                  id="entry-received-from-email"
                  type="email"
                  name="receivedFromEmail"
                  value={form.receivedFromEmail}
                  onChange={handleChange}
                  placeholder={t("entry.senderEmailPlaceholder")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={`w-full px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${
                isFormValid && !submitting
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  : "bg-gray-400 cursor-not-allowed text-white"
              } transition-colors`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t("entry.saving")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t("entry.save")}
                </span>
              )}
            </button>

            {!isFormValid && (
              <p className="text-sm text-orange-600 mt-2 text-center">
                {t("entry.requiredFields")}
              </p>
            )}
          </div>
        </form>

        {/* Hidden receipt container */}
        <div ref={receiptRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
