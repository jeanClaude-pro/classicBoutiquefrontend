// Customer-facing sale receipt and stub, shared by every sale printing path:
// the browser receipt/stub after a sale (NewSale), the Sales History reprint
// and PDF, and the payload of the thermal ESC/POS printer (server/routes/print.js,
// laid out by server/utils/receiptLayout.js).
//
// Money is printed in Congolese francs ONLY. Each line's FC amount is the
// sale's own stored snapshot (getItemFcUnitPrice): the entered FC price, the
// FC price snapshot, or the USD price at the sale's historical rate — never
// today's rate. The USD values stay untouched in the sale for accounting.
import i18n, { currentLanguage, type AppLanguage } from "../i18n/index.ts";
import { getItemFcUnitPrice, type StoredSaleItemPrice } from "../utils/salePricing.ts";

export type ReceiptItem = StoredSaleItemPrice & { name: string };

export interface ReceiptLine {
  /** Product name exactly as stored: never translated or rewritten. */
  name: string;
  quantity: number;
  unitFC?: number;
  totalFC?: number;
}

export interface SaleReceiptLabels {
  title: string;
  stubTitle: string;
  tagline: string;
  tel: string;
  date: string;
  receiptNo: string;
  customer: string;
  phone: string;
  email: string;
  itemsBought: string;
  itemsSold: string;
  item: string;
  unitPrice: string;
  qty: string;
  total: string;
  subtotal: string;
  saleTotal: string;
  payment: string;
  agent: string;
  thanks: string;
  noExchange: string;
  noRefund: string;
  stubNo: string;
  stubNumber: string;
  stubFooter: string;
  keepStub: string;
  receiptNoShort: string;
  dateShort: string;
}

export interface SaleReceiptShop {
  shopName: string;
  shopAddress: string;
  shopNumber: string;
  shopRegistration: string;
  receiptFooter?: string;
}

export interface SaleReceiptInput extends SaleReceiptShop {
  receiptNumber: string | number;
  stubNumber?: string | number;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  /** The sale's own rate snapshot, used only for lines without an FC snapshot. */
  exchangeRate?: number;
  /** Stored/raw payment value (cash, mpesa, transfer…). */
  paymentMethod: string;
  salesPerson: string;
}

export interface SaleReceiptDocument extends SaleReceiptInput {
  language: AppLanguage;
  labels: SaleReceiptLabels;
  lines: ReceiptLine[];
  subtotalFC?: number;
  totalFC?: number;
  paymentLabel: string;
}

const LABEL_KEYS: Record<keyof SaleReceiptLabels, string> = {
  title: "saleReceipt.title",
  stubTitle: "saleReceipt.stubTitle",
  tagline: "saleReceipt.tagline",
  tel: "saleReceipt.tel",
  date: "saleReceipt.date",
  receiptNo: "saleReceipt.receiptNo",
  customer: "saleReceipt.customer",
  phone: "saleReceipt.phone",
  email: "saleReceipt.email",
  itemsBought: "saleReceipt.itemsBought",
  itemsSold: "saleReceipt.itemsSold",
  item: "saleReceipt.columns.item",
  unitPrice: "saleReceipt.columns.unitPrice",
  qty: "saleReceipt.columns.qty",
  total: "saleReceipt.columns.total",
  subtotal: "saleReceipt.subtotal",
  saleTotal: "saleReceipt.saleTotal",
  payment: "saleReceipt.payment",
  agent: "saleReceipt.agent",
  thanks: "saleReceipt.thanks",
  noExchange: "saleReceipt.noExchange",
  noRefund: "saleReceipt.noRefund",
  stubNo: "saleReceipt.stubNo",
  stubNumber: "saleReceipt.stubNumberOfDay",
  stubFooter: "saleReceipt.stubFooter",
  keepStub: "saleReceipt.keepStub",
  receiptNoShort: "saleReceipt.receiptNoShort",
  dateShort: "saleReceipt.dateShort",
};

/** Receipt wording in `language` (the interface language by default). */
export function saleReceiptLabels(language: AppLanguage = currentLanguage()): SaleReceiptLabels {
  const t = i18n.getFixedT(language);
  const labels = {} as SaleReceiptLabels;
  for (const [field, key] of Object.entries(LABEL_KEYS)) {
    // {{number}} is filled by whoever prints the stub number.
    labels[field as keyof SaleReceiptLabels] = t(key, { number: "{{number}}" });
  }
  return labels;
}

export function receiptPaymentLabel(method: string, language: AppLanguage = currentLanguage()): string {
  const value = String(method || "");
  return i18n.getFixedT(language)(`saleReceipt.payments.${value}`, { defaultValue: value.toUpperCase() });
}

/** One ARTICLE / PU / QTE / TOTAL line per item, in FC from the sale's snapshots. */
export function receiptLines(items: ReceiptItem[], saleRate?: number): ReceiptLine[] {
  return items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitFC = getItemFcUnitPrice(item, saleRate);
    return { name: String(item.name ?? ""), quantity, unitFC, totalFC: unitFC === undefined ? undefined : unitFC * quantity };
  });
}

/** Sum of the line totals; unknown when any line has no FC value. */
export function receiptTotalFC(lines: ReceiptLine[]): number | undefined {
  if (!lines.length || lines.some((line) => line.totalFC === undefined)) return undefined;
  return lines.reduce((sum, line) => sum + (line.totalFC ?? 0), 0);
}

/**
 * "30,000 FC": whole francs with a fixed separator in both languages, so the
 * browser receipt, the PDF and the thermal printer print the same characters
 * (the French narrow no-break space is not printable on thermal printers).
 */
export function formatReceiptFC(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  return `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} FC`;
}

export function buildSaleReceipt(input: SaleReceiptInput, language: AppLanguage = currentLanguage()): SaleReceiptDocument {
  const lines = receiptLines(input.items, input.exchangeRate);
  const totalFC = receiptTotalFC(lines);
  return {
    ...input,
    language,
    labels: saleReceiptLabels(language),
    lines,
    // Discounts are already in each line's unit price: no sale-level adjustment.
    subtotalFC: totalFC,
    totalFC,
    paymentLabel: receiptPaymentLabel(input.paymentMethod, language),
  };
}

/** Body of POST /api/print/receipt and /api/print/stub (thermal printer). */
export function escPosReceiptData(doc: SaleReceiptDocument) {
  const { labels } = doc;
  return {
    shopName: doc.shopName,
    shopAddress: doc.shopAddress,
    shopNumber: doc.shopNumber,
    shopRegistration: doc.shopRegistration,
    receiptFooter: doc.receiptFooter,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone ?? "",
    customerEmail: doc.customerEmail,
    items: doc.items,
    exchangeRate: doc.exchangeRate,
    paymentMethod: doc.paymentMethod,
    paymentLabel: doc.paymentLabel,
    salesPerson: doc.salesPerson,
    date: doc.date,
    receiptNumber: doc.receiptNumber,
    stubNumber: doc.stubNumber ?? doc.receiptNumber,
    language: doc.language,
    labels: {
      tagline: labels.tagline,
      date: labels.dateShort,
      receiptNo: labels.receiptNoShort,
      customer: labels.customer,
      phone: labels.phone,
      email: labels.email,
      item: labels.item,
      unitPrice: labels.unitPrice,
      qty: labels.qty,
      total: labels.total,
      subtotal: labels.subtotal,
      saleTotal: labels.saleTotal,
      payment: labels.payment,
      agent: labels.agent,
      thanks: labels.thanks,
      noExchange: `${labels.noExchange} - ${labels.noRefund}`,
      stubTitle: labels.stubTitle.toUpperCase(),
      stubNumber: labels.stubNumber,
    },
  };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] as string
  ));
}

const RECEIPT_STYLES = (origin: string) => `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0; padding: 0;
        font-size: 12px; font-weight: bold; line-height: 1.2;
        width: 80mm; background-color: white;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .receipt-container { width: 78mm; margin: 0 auto; padding: 1mm 2mm; border: none; text-align: center; position: relative; }
      .logo-watermark {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('${origin}/newlogo.png');
        background-repeat: no-repeat; background-position: center; background-size: 65%;
        opacity: 0.18; pointer-events: none; z-index: 0;
      }
      .content-wrapper { position: relative; z-index: 1; }
      .header { text-align: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 2px double #000; }
      .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 0.5mm; text-transform: uppercase; }
      .shop-details { font-size: 10px; margin-bottom: 0.3mm; line-height: 1.2; font-weight: bold; }
      .receipt-info { margin: 2mm 0; padding: 1mm 2mm; background-color: #f8f8f8; border-left: 3px solid #000; text-align: left; }
      .receipt-title {
        font-size: 11px; font-weight: bold; margin: 1mm 0; text-transform: uppercase;
        background-color: #000; color: white; padding: 1mm 2mm; border-radius: 2px; text-align: center;
      }
      .stub-number {
        font-size: 11px; font-weight: bold; margin: 2mm 0; text-transform: uppercase;
        background-color: #333; color: white; padding: 1mm 2mm; border-radius: 3px;
      }
      .items-table { width: 100%; border-collapse: collapse; font-size: 10px; background-color: #fafafa; }
      .items-table th {
        background-color: #e0e0e0; text-transform: uppercase; font-weight: bold;
        padding: 1mm 0.8mm; border-bottom: 1px solid #999;
      }
      .items-table td { padding: 0.6mm 0.8mm; border-bottom: 1px dotted #ddd; vertical-align: top; font-weight: bold; }
      .items-table .col-article { text-align: left; overflow-wrap: anywhere; word-break: break-word; }
      .items-table .col-pu, .items-table .col-total { text-align: right; white-space: nowrap; }
      .items-table .col-qte { text-align: center; white-space: nowrap; }
      .total-section { font-weight: bold; margin-top: 2mm; padding: 1mm 2mm; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; }
      .total-row { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 0.5mm; font-size: 11px; padding: 0 1mm; text-align: left; }
      .total-row > div:last-child { text-align: right; white-space: nowrap; }
      .payment-method { text-transform: uppercase; font-weight: bold; font-size: 11px; color: #000; }
      .footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #f8f8f8; border-top: 1px dashed #000; }
      .stub-footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 3px; }
      .sales-person { margin-top: 2mm; text-align: center; font-weight: bold; font-size: 10px; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 2px; }
      .customer-info { margin: 2mm 0; padding: 1mm 2mm; font-weight: bold; text-align: left; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 10px; }
      .customer-field { margin-bottom: 0.3mm; font-size: 10px; }
      .cut-line { text-align: center; margin: 2mm 0 0 0; font-weight: bold; font-size: 10px; color: #000; letter-spacing: 1px; }
      .thank-you { font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
      .warning { font-size: 9px; color: #000; margin: 0.3mm 0; font-weight: bold; }
      .section-divider { height: 2px; background: linear-gradient(to right, transparent, #000, transparent); margin: 1mm 0; }
      @media print {
        @page { margin: 0 !important; size: 80mm auto !important; }
        body {
          margin: 0 !important; padding: 0 !important; width: 80mm !important; font-size: 12px !important;
          background: white !important; font-weight: bold !important; height: auto !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }
        .receipt-container { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 1mm 2mm !important; width: 78mm !important; }
        .cut-line { page-break-after: always !important; margin-bottom: 0 !important; }
        body::after, body::before { display: none !important; content: none !important; }
      }`;

/** The ARTICLE | PU | QTE | TOTAL table (FC only). */
export function receiptItemsTableHtml(doc: SaleReceiptDocument): string {
  const { labels } = doc;
  const rows = doc.lines.map((line) => `
          <tr>
            <td class="col-article">${escapeHtml(line.name)}</td>
            <td class="col-pu">${formatReceiptFC(line.unitFC)}</td>
            <td class="col-qte">${line.quantity}</td>
            <td class="col-total">${formatReceiptFC(line.totalFC)}</td>
          </tr>`).join("");
  return `
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-article">${escapeHtml(labels.item)}</th>
            <th class="col-pu">${escapeHtml(labels.unitPrice)}</th>
            <th class="col-qte">${escapeHtml(labels.qty)}</th>
            <th class="col-total">${escapeHtml(labels.total)}</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>`;
}

const amountRow = (label: string, value: string, className = "") =>
  `<div class="total-row"><div><strong>${escapeHtml(label)}:</strong></div><div${className ? ` class="${className}"` : ""}><strong>${value}</strong></div></div>`;

/**
 * Complete printable page (80mm) of the receipt or of the stub. Both use the
 * same item table and the same FC amounts; the stub keeps its shorter layout.
 */
export function renderSaleReceiptHtml(
  doc: SaleReceiptDocument,
  variant: "receipt" | "stub",
  origin: string = typeof window === "undefined" ? "" : window.location.origin
): string {
  const { labels } = doc;
  const isStub = variant === "stub";
  const customer = `
      <div class="customer-info">
        <div class="customer-field">${escapeHtml(labels.customer)}: <strong>${escapeHtml(String(doc.customerName ?? "").toUpperCase())}</strong></div>
        ${doc.customerPhone ? `<div class="customer-field">${escapeHtml(labels.phone)}: <strong>${escapeHtml(doc.customerPhone)}</strong></div>` : ""}
        ${!isStub && doc.customerEmail ? `<div class="customer-field">${escapeHtml(labels.email)}: <strong>${escapeHtml(doc.customerEmail)}</strong></div>` : ""}
      </div>`;
  const totals = isStub
    ? amountRow(labels.saleTotal, formatReceiptFC(doc.totalFC))
    : amountRow(labels.subtotal, formatReceiptFC(doc.subtotalFC)) + amountRow(labels.total, formatReceiptFC(doc.totalFC));
  const footer = isStub
    ? `
      <div class="stub-footer">
        <div class="thank-you"><strong>${escapeHtml(labels.stubFooter)}</strong></div>
        <div class="warning"><strong>${escapeHtml(doc.shopName)}</strong></div>
        <div class="warning"><strong>${escapeHtml(labels.keepStub)}</strong></div>
        <div class="warning">${escapeHtml(labels.receiptNoShort)}: <strong>${escapeHtml(doc.receiptNumber)}</strong></div>
        <div class="warning">${escapeHtml(labels.dateShort)}: <strong>${escapeHtml(doc.date)}</strong></div>
      </div>`
    : `
      <div class="footer">
        <div class="thank-you"><strong>${escapeHtml(doc.receiptFooter || labels.thanks)}</strong></div>
        <div class="warning"><strong>${escapeHtml(labels.noExchange)}</strong></div>
        <div class="warning"><strong>${escapeHtml(labels.noRefund)}</strong></div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="${doc.language}">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(isStub ? labels.stubTitle : labels.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${RECEIPT_STYLES(origin)}
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${escapeHtml(doc.shopName)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(doc.shopAddress)}</strong></div>
        <div class="shop-details">${escapeHtml(labels.tel)}: <strong>${escapeHtml(doc.shopNumber)}</strong></div>
        ${isStub ? "" : `<div class="shop-details"><strong>${escapeHtml(doc.shopRegistration)}</strong></div>`}
      </div>

      <div class="section-divider"></div>

      <div class="receipt-info">
        <div class="shop-details">${escapeHtml(labels.date)}: <strong>${escapeHtml(doc.date)}</strong></div>
        <div class="shop-details">${escapeHtml(labels.receiptNo)}: <strong>${escapeHtml(doc.receiptNumber)}</strong></div>
      </div>
      ${isStub ? `
      <div class="stub-number">${escapeHtml(labels.stubNo)}<strong>${escapeHtml(doc.stubNumber ?? doc.receiptNumber)}</strong></div>` : ""}
      ${customer}

      <div class="receipt-title">${escapeHtml(isStub ? labels.itemsSold : labels.itemsBought)}</div>
      ${receiptItemsTableHtml(doc)}

      <div class="total-section">
        ${totals}
        ${amountRow(labels.payment, `${escapeHtml(doc.paymentLabel)}`, "payment-method")}
      </div>

      <div class="sales-person">
        ${escapeHtml(labels.agent)}: <strong>${escapeHtml(String(doc.salesPerson ?? "").toUpperCase())}</strong>
      </div>
      ${footer}

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
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
`;
}

/** Opens an 80mm print window with the page; it prints and closes itself. */
export function openReceiptPrintWindow(html: string): boolean {
  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
