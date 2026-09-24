/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import { formatNowGMT2 } from "../../utils/dateUtils";
import { t } from "../../i18n";
import { categoryPresentation, type AccountingCategory, type CategoryAccountingDTO } from "./accountingPresentation";

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface ReportAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalValidatedExpenses: number;
  totalEntries: number;
  netRevenue: number;
  categoryBreakdown?: Partial<Record<AccountingCategory, CategoryAccountingDTO>>;
  topProducts: TopProduct[];
  recentTrends: {
    salesGrowth: number | null;
    revenueGrowth: number | null;
    customerGrowth: number | null;
  };
}

export interface ReportSections {
  financial: boolean;
  sales: boolean;
  products: boolean;
  clients: boolean;
  expenses: boolean;
  entries: boolean;
}

export interface ReportConfig {
  sections: ReportSections;
  analytics: ReportAnalytics;
  adminUsername: string;
  adminSignatureText: string;
  hasSignature: boolean;
  hasStamp: boolean;
  timeframeLabel: string;
  formatCurrency: (n: number) => string;
  companyAddress?: string;
  companyPhone?: string;
  companyRegistration?: string;
}

const COMPANY = "ETS DOUBLE M CLASSIC BOUTIQUE";
// Labels are read when the PDF is generated, in the interface language.
const PW = 210;
const PH = 297;
const M = 18;
const CW = PW - M * 2;
const HDR_BOTTOM = 24;
const FTR_TOP = PH - 24;
const CT = HDR_BOTTOM + 12;
const CB = FTR_TOP - 8;

const ink = {
  navy: [15, 23, 42],
  blue: [30, 64, 175],
  muted: [100, 116, 139],
  border: [203, 213, 225],
  borderSoft: [226, 232, 240],
  surface: [248, 250, 252],
  white: [255, 255, 255],
  success: [15, 118, 110],
  danger: [153, 27, 27],
  warning: [180, 83, 9],
} as const;

// The report is written in plain ASCII like the rest of this PDF.
function pdfText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-");
}

/** Translated, plain-ASCII text for the PDF. */
function tr(key: string, options?: Record<string, unknown>): string {
  return pdfText(t(key, options));
}

function color(doc: jsPDF, rgb: readonly number[]): void {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fill(doc: jsPDF, rgb: readonly number[]): void {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function stroke(doc: jsPDF, rgb: readonly number[]): void {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function drawHeader(doc: jsPDF, reportTitle: string): void {
  fill(doc, ink.white);
  doc.rect(0, 0, PW, HDR_BOTTOM, "F");
  stroke(doc, ink.borderSoft);
  doc.line(M, HDR_BOTTOM, PW - M, HDR_BOTTOM);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  color(doc, ink.navy);
  doc.text(COMPANY, M, HDR_BOTTOM - 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  color(doc, ink.muted);
  doc.text(reportTitle, PW - M, HDR_BOTTOM - 7, { align: "right" });
}

function drawFooter(doc: jsPDF, page: number, total: number, genAt: string): void {
  stroke(doc, ink.borderSoft);
  doc.line(M, FTR_TOP, PW - M, FTR_TOP);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  color(doc, ink.muted);
  doc.text(tr("pdfReport.generatedOn", { date: genAt }), M, FTR_TOP + 5);
  doc.text(tr("pdfReport.page", { page, total }), PW - M, FTR_TOP + 5, { align: "right" });
  doc.text(`${COMPANY} - ${tr("pdfReport.companySub")}`, PW / 2, FTR_TOP + 5, { align: "center" });
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  color(doc, ink.navy);
  doc.text(title, M, y);
  stroke(doc, ink.blue);
  doc.setLineWidth(0.5);
  doc.line(M, y + 3, M + 28, y + 3);
  stroke(doc, ink.borderSoft);
  doc.setLineWidth(0.2);
  doc.line(M + 32, y + 3, PW - M, y + 3);
  return y + 10;
}

function infoPanel(doc: jsPDF, title: string, text: string, y: number): number {
  fill(doc, ink.surface);
  stroke(doc, ink.borderSoft);
  doc.rect(M, y, CW, 18, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  color(doc, ink.navy);
  doc.text(title.toUpperCase(), M + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  color(doc, ink.muted);
  doc.text(doc.splitTextToSize(text, CW - 8), M + 4, y + 12);
  return y + 24;
}

function metricGrid(
  doc: jsPDF,
  items: { label: string; value: string; note?: string }[],
  y: number,
  cols = 3,
): number {
  const gap = 4;
  const cardH = 24;
  const colW = (CW - gap * (cols - 1)) / cols;

  items.forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = M + col * (colW + gap);
    const cy = y + row * (cardH + gap);

    fill(doc, ink.white);
    stroke(doc, ink.borderSoft);
    doc.rect(x, cy, colW, cardH, "FD");
    fill(doc, ink.blue);
    doc.rect(x, cy, 1.4, cardH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    color(doc, ink.muted);
    doc.text(item.label.toUpperCase(), x + 4, cy + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    color(doc, ink.navy);
    doc.text(doc.splitTextToSize(item.value, colW - 8)[0] ?? "", x + 4, cy + 14);

    if (item.note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.6);
      color(doc, ink.muted);
      doc.text(doc.splitTextToSize(item.note, colW - 8)[0] ?? "", x + 4, cy + 20);
    }
  });

  return y + Math.ceil(items.length / cols) * (cardH + gap) + 4;
}

function dataTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  widths: number[],
  rowH = 7.5,
  onPageBreak?: () => void,
): number {
  const tw = widths.reduce((a, b) => a + b, 0);

  const drawTableHeader = (hy: number): void => {
    fill(doc, ink.navy);
    doc.rect(x, hy, tw, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    color(doc, ink.white);

    let hx = x;
    headers.forEach((h, i) => {
      doc.text(h, hx + 2.5, hy + rowH - 2.4);
      hx += widths[i];
    });
  };

  let pageStartY = y;
  drawTableHeader(pageStartY);
  let ry = y + rowH;

  for (let ri = 0; ri < rows.length; ri++) {
    if (ry + rowH > CB) {
      stroke(doc, ink.border);
      doc.rect(x, pageStartY, tw, ry - pageStartY, "S");

      if (!onPageBreak) break;
      onPageBreak();
      pageStartY = CT;
      drawTableHeader(pageStartY);
      ry = pageStartY + rowH;
    }

    if (ri % 2 === 0) {
      fill(doc, ink.surface);
      doc.rect(x, ry, tw, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    color(doc, ink.navy);
    let cx = x;
    rows[ri].forEach((cell, ci) => {
      const maxChars = Math.max(4, Math.floor(widths[ci] / 2));
      const clipped = cell.length > maxChars ? `${cell.substring(0, maxChars - 3)}...` : cell;
      doc.text(clipped, cx + 2.5, ry + rowH - 2.4);
      cx += widths[ci];
    });

    stroke(doc, ink.borderSoft);
    doc.line(x, ry + rowH, x + tw, ry + rowH);
    ry += rowH;
  }

  stroke(doc, ink.border);
  doc.rect(x, pageStartY, tw, ry - pageStartY, "S");
  return ry + 5;
}

function drawCertificationBox(
  doc: jsPDF,
  y: number,
  config: Pick<ReportConfig, "adminUsername" | "adminSignatureText" | "hasSignature" | "hasStamp">,
): number {
  const { adminUsername, adminSignatureText, hasSignature, hasStamp } = config;
  const sigW = CW / 2 - 3;
  const stX = M + CW / 2 + 3;
  const stW = CW / 2 - 3;

  fill(doc, ink.white);
  stroke(doc, ink.borderSoft);
  doc.rect(M, y, sigW, 56, "FD");
  doc.rect(stX, y, stW, 56, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  color(doc, ink.navy);
  doc.text(tr("pdfReport.adminSignature"), M + 4, y + 8);
  doc.text(tr("pdfReport.officialStamp"), stX + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  color(doc, ink.muted);
  doc.text(tr("pdfReport.name", { name: adminUsername }), M + 4, y + 17);
  if (adminSignatureText) doc.text(tr("pdfReport.title", { title: adminSignatureText }), M + 4, y + 24);
  doc.text(hasSignature ? tr("pdfReport.signatureConfirmed") : tr("pdfReport.signatureNotConfirmed"), M + 4, y + 50);

  stroke(doc, ink.border);
  doc.line(M + 4, y + 42, M + sigW - 6, y + 42);

  const eCx = stX + stW / 2;
  const eCy = y + 32;
  stroke(doc, hasStamp ? ink.blue : ink.border);
  doc.setLineWidth(0.4);
  doc.ellipse(eCx, eCy, 16, 16, "S");
  doc.ellipse(eCx, eCy, 12, 12, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  color(doc, hasStamp ? ink.blue : ink.muted);
  doc.text(tr("pdfReport.stamp"), eCx, eCy - 2, { align: "center" });
  doc.text(hasStamp ? tr("pdfReport.confirmed") : tr("pdfReport.notConfirmed"), eCx, eCy + 4, { align: "center" });
  doc.setLineWidth(0.2);

  return y + 64;
}

export function generateCompanyReport(config: ReportConfig): void {
  const {
    analytics,
    sections,
    adminUsername,
    adminSignatureText,
    hasSignature,
    hasStamp,
    timeframeLabel,
    formatCurrency,
    companyAddress = "780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",
    companyPhone = "+243 836 017 031",
    companyRegistration = "LSH/RCCM/22-A-01266",
  } = config;

  const doc = new (jsPDF as any)({ orientation: "portrait", unit: "mm", format: "a4" });
  const genAt = formatNowGMT2();
  const official = hasSignature && hasStamp;

  const secNames: string[] = [];
  if (sections.financial) secNames.push(tr("pdfReport.sec.financial"));
  if (sections.sales) secNames.push(tr("pdfReport.sec.sales"));
  if (sections.products) secNames.push(tr("pdfReport.sec.products"));
  if (sections.clients) secNames.push(tr("pdfReport.sec.clients"));
  if (sections.expenses) secNames.push(tr("pdfReport.sec.expenses"));
  if (sections.entries) secNames.push(tr("pdfReport.sec.entries"));

  const allSelected = Object.values(sections).every(Boolean);
  const reportTitle = allSelected
    ? tr("pdfReport.fullTitle")
    : secNames.length === 1
      ? secNames[0]
      : tr("pdfReport.selectiveTitle");

  fill(doc, ink.white);
  doc.rect(0, 0, PW, PH, "F");
  fill(doc, ink.navy);
  doc.rect(0, 0, PW, 66, "F");
  fill(doc, ink.blue);
  doc.rect(0, 64.5, PW, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  color(doc, ink.white);
  doc.text(COMPANY, PW / 2, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(tr("pdfReport.companySub"), PW / 2, 33, { align: "center" });

  doc.setFontSize(7.8);
  doc.text(companyAddress, PW / 2, 42, { align: "center" });
  doc.text(companyPhone, PW / 2, 47, { align: "center" });
  doc.text(companyRegistration, PW / 2, 52, { align: "center" });

  const coverY = 88;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  color(doc, ink.navy);
  doc.text(reportTitle.toUpperCase(), M, coverY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  color(doc, ink.muted);
  doc.text(tr("pdfReport.period", { period: timeframeLabel }), M, coverY + 9);

  fill(doc, ink.surface);
  stroke(doc, ink.borderSoft);
  doc.rect(M, coverY + 22, CW, 50, "FD");

  const metaRows: [string, string][] = [
    [tr("pdfReport.meta.generatedAt"), genAt],
    [tr("pdfReport.meta.preparedBy"), adminUsername],
    [tr("pdfReport.meta.sections"), secNames.join(", ") || tr("pdfReport.meta.noSection")],
    [tr("pdfReport.meta.status"), official ? tr("pdfReport.officialDoc") : tr("pdfReport.unofficialDoc")],
  ];

  metaRows.forEach(([label, value], i) => {
    const rowY = coverY + 34 + i * 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    color(doc, ink.navy);
    doc.text(label, M + 6, rowY);
    doc.setFont("helvetica", "normal");
    color(doc, i === 3 ? (official ? ink.success : ink.warning) : ink.muted);
    doc.text(doc.splitTextToSize(value, CW - 62)[0] ?? "", M + 58, rowY);
  });

  const noticeY = coverY + 88;
  stroke(doc, official ? ink.success : ink.warning);
  fill(doc, official ? [240, 253, 250] : [255, 251, 235]);
  doc.rect(M, noticeY, CW, 24, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  color(doc, official ? ink.success : ink.warning);
  doc.text(official ? tr("pdfReport.certificationHeading") : tr("pdfReport.validationNote"), M + 5, noticeY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  color(doc, ink.navy);
  doc.text(
    doc.splitTextToSize(
      official
        ? tr("pdfReport.certifiedText")
        : tr("pdfReport.notCertifiedText"),
      CW - 10,
    ),
    M + 5,
    noticeY + 16,
  );

  let Y = CT;
  let secNum = 0;

  function newPage(): void {
    doc.addPage();
    drawHeader(doc, reportTitle);
    Y = CT;
  }

  function ensure(need: number): void {
    if (Y + need > CB) newPage();
  }

  newPage();

  if (sections.financial) {
    secNum++;
    ensure(86);
    Y = sectionTitle(doc, tr("pdfReport.financialTitle", { n: secNum }), Y);
    Y = metricGrid(
      doc,
      [
        { label: tr("pdfReport.metrics.totalSales"), value: String(analytics.totalSales), note: tr("pdfReport.metrics.totalSalesNote") },
        { label: tr("pdfReport.metrics.salesReceipts"), value: formatCurrency(analytics.totalRevenue), note: tr("pdfReport.metrics.salesReceiptsNote") },
        { label: tr("pdfReport.metrics.cashEntries"), value: formatCurrency(analytics.totalEntries), note: tr("pdfReport.metrics.cashEntriesNote") },
        { label: tr("pdfReport.metrics.expenses"), value: formatCurrency(analytics.totalValidatedExpenses), note: tr("pdfReport.metrics.expensesNote") },
        { label: tr("pdfReport.metrics.netCash"), value: formatCurrency(analytics.netRevenue), note: tr("pdfReport.metrics.netCashNote") },
        { label: tr("pdfReport.metrics.uniqueCustomers"), value: String(analytics.totalCustomers), note: tr("pdfReport.metrics.uniqueCustomersNote") },
      ],
      Y,
      3,
    );
    // Same fields and labels as the Analytics screen (accountingPresentation):
    // the PDF formats authoritative backend numbers and never recomputes them.
    for (const key of ["CLOTHES", "SHOES"] as const) {
      const row = analytics.categoryBreakdown?.[key];
      if (!row) continue;
      const view = categoryPresentation(key, row);
      ensure(70);
      Y = sectionTitle(doc, tr("pdfReport.categoryPeriod", { category: pdfText(view.title).toUpperCase() }), Y);
      Y = metricGrid(doc, view.period.map((metric) => ({ label: pdfText(metric.label), value: formatCurrency(metric.value) })), Y, 2);
      if (view.balance.length > 0) {
        ensure(40);
        Y = sectionTitle(doc, tr("pdfReport.categoryCurrent", { category: pdfText(view.title) }), Y);
        Y = metricGrid(doc, view.balance.map((metric) => ({ label: pdfText(metric.label), value: formatCurrency(metric.value) })), Y, 2);
        Y = infoPanel(doc, tr("pdfReport.restockingRule"), pdfText(view.fundsExplanation), Y);
      }
    }
  }

  if (sections.sales) {
    secNum++;
    ensure(34);
    Y = sectionTitle(doc, tr("pdfReport.salesTitle", { n: secNum }), Y);
    const trend = analytics.recentTrends.revenueGrowth;
    Y = infoPanel(
      doc,
      tr("pdfReport.commercialPerformance"),
      tr("pdfReport.salesLine", { sales: analytics.totalSales, revenue: formatCurrency(analytics.totalRevenue), customers: analytics.totalCustomers, trend: trend === null ? tr("pdfReport.notAvailable") : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%` }),
      Y,
    );
  }

  if (sections.products) {
    secNum++;
    ensure(42);
    Y = sectionTitle(doc, tr("pdfReport.productsTitle", { n: secNum }), Y);
    if (analytics.topProducts.length > 0) {
      Y = dataTable(
        doc,
        ["#", tr("pdfReport.columns.item"), tr("pdfReport.columns.qty"), tr("pdfReport.columns.revenue")],
        analytics.topProducts.map((p, i) => [
          String(i + 1),
          p.name,
          tr("pdfReport.units", { count: p.quantity }),
          formatCurrency(p.revenue),
        ]),
        M,
        Y,
        [12, 92, 32, 38],
        7.5,
        () => {
          doc.addPage();
          drawHeader(doc, reportTitle);
        },
      );
    } else {
      Y = infoPanel(doc, tr("pdfReport.noProductSales"), tr("pdfReport.noProductSalesText"), Y);
    }
  }

  if (sections.clients) {
    secNum++;
    ensure(34);
    Y = sectionTitle(doc, tr("pdfReport.clientsTitle", { n: secNum }), Y);
    const trend = analytics.recentTrends.customerGrowth;
    Y = infoPanel(
      doc,
      tr("pdfReport.customerActivity"),
      tr("pdfReport.clientsLine", { customers: analytics.totalCustomers, trend: trend === null ? tr("pdfReport.notAvailable") : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%` }),
      Y,
    );
  }

  if (sections.expenses) {
    secNum++;
    ensure(34);
    Y = sectionTitle(doc, tr("pdfReport.expensesTitle", { n: secNum }), Y);
    Y = infoPanel(doc, tr("pdfReport.validatedOutflows"), tr("pdfReport.expensesText", { amount: formatCurrency(analytics.totalValidatedExpenses) }), Y);
  }

  if (sections.entries) {
    secNum++;
    ensure(34);
    Y = sectionTitle(doc, tr("pdfReport.entriesTitle", { n: secNum }), Y);
    Y = infoPanel(doc, tr("pdfReport.cashEntries"), tr("pdfReport.totalReceived", { amount: formatCurrency(analytics.totalEntries) }), Y);
  }

  ensure(112);
  Y = sectionTitle(doc, tr("pdfReport.certificationTitle"), Y);
  Y = drawCertificationBox(doc, Y, {
    adminUsername,
    adminSignatureText,
    hasSignature,
    hasStamp,
  });

  stroke(doc, official ? ink.success : ink.warning);
  fill(doc, official ? [240, 253, 250] : [255, 251, 235]);
  doc.rect(M, Y, CW, 22, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  color(doc, official ? ink.success : ink.warning);
  doc.text(official ? tr("pdfReport.officialBanner") : tr("pdfReport.unofficialBanner"), M + 5, Y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  color(doc, ink.navy);
  doc.text(
    doc.splitTextToSize(
      official
        ? tr("pdfReport.officialBannerText")
        : tr("pdfReport.unofficialBannerText"),
      CW - 10,
    ),
    M + 5,
    Y + 16,
  );
  Y += 32;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  color(doc, ink.muted);
  doc.text(tr("pdfReport.generatedBy", { date: genAt, name: adminUsername }), PW / 2, Y, { align: "center" });

  const totalPgs = doc.getNumberOfPages();
  for (let p = 2; p <= totalPgs; p++) {
    doc.setPage(p);
    drawFooter(doc, p - 1, totalPgs - 1, genAt);
  }

  const dateStamp = new Date().toISOString().split("T")[0];
  doc.save(`${tr("pdfReport.fileName")}-${dateStamp}.pdf`);
}
