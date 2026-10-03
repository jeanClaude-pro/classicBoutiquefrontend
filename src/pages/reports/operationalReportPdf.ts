// jsPDF rendering of a Fiche de stock / Fiche des ventes model. Same visual
// language and plain-ASCII text convention as the analytics report
// (src/pages/analytics/reportGenerator.ts): navy ink, hairline borders, no
// shadows. Content comes only from operationalReportModel.ts.
import jsPDF from "jspdf";
import { COMPANY_NAME, pdfText, type PdfTableModel } from "./operationalReportModel";

const PW = 297; // A4 landscape
const PH = 210;
const M = 14;
const CW = PW - M * 2;
const FOOTER_TOP = PH - 12;
const BOTTOM = FOOTER_TOP - 4;

const LINE_BREAK = String.fromCharCode(10);

// Print-friendly palette of the visual system (light fills only).
const ink = {
  navy: [24, 24, 27],
  blue: [22, 101, 52],
  muted: [113, 113, 122],
  border: [212, 212, 216],
  borderSoft: [228, 228, 231],
  surface: [250, 250, 247],
  white: [255, 255, 255],
} as const;

const color = (doc: jsPDF, rgb: readonly number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
const fill = (doc: jsPDF, rgb: readonly number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
const stroke = (doc: jsPDF, rgb: readonly number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

function drawPageHeader(doc: jsPDF, model: PdfTableModel): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  color(doc, ink.navy);
  doc.text(pdfText(model.shop.shopName || COMPANY_NAME), M, 16);
  doc.setFontSize(12);
  color(doc, ink.blue);
  doc.text(pdfText(model.title), PW - M, 16, { align: "right" });

  const identity = [model.shop.shopAddress, model.shop.shopNumber, model.shop.shopRegistration].filter(Boolean).join("  |  ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  color(doc, ink.muted);
  if (identity) doc.text(pdfText(identity), M, 21.5);
  stroke(doc, ink.border);
  doc.setLineWidth(0.3);
  doc.line(M, 25, PW - M, 25);
  return 31;
}

function drawMeta(doc: jsPDF, model: PdfTableModel, y: number): number {
  fill(doc, ink.surface);
  stroke(doc, ink.borderSoft);
  doc.rect(M, y, CW, 13, "FD");
  const colW = CW / model.meta.length;
  model.meta.forEach((item, index) => {
    const x = M + 4 + index * colW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    color(doc, ink.muted);
    doc.text(pdfText(item.label).toUpperCase(), x, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    color(doc, ink.navy);
    doc.text(doc.splitTextToSize(pdfText(item.value), colW - 6)[0] ?? "", x, y + 10);
  });
  return y + 17;
}

function drawSummary(doc: jsPDF, model: PdfTableModel, y: number): number {
  if (!model.summary.length) return y;
  const gap = 3;
  const cardW = (CW - gap * (model.summary.length - 1)) / model.summary.length;
  model.summary.forEach((item, index) => {
    const x = M + index * (cardW + gap);
    fill(doc, ink.white);
    stroke(doc, ink.borderSoft);
    doc.rect(x, y, cardW, 15, "FD");
    fill(doc, ink.blue);
    doc.rect(x, y, 1.2, 15, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    color(doc, ink.muted);
    doc.text(doc.splitTextToSize(pdfText(item.label).toUpperCase(), cardW - 6)[0] ?? "", x + 4, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    color(doc, ink.navy);
    doc.text(doc.splitTextToSize(pdfText(item.value), cardW - 6)[0] ?? "", x + 4, y + 11.5);
  });
  return y + 20;
}

function columnLayout(model: PdfTableModel) {
  const total = model.weights.reduce((sum, weight) => sum + weight, 0);
  const widths = model.weights.map((weight) => (weight / total) * CW);
  const lefts = widths.map((_, index) => M + widths.slice(0, index).reduce((sum, width) => sum + width, 0));
  return { widths, lefts };
}

function drawCells(doc: jsPDF, model: PdfTableModel, cells: string[][], y: number, lineH: number) {
  const { widths, lefts } = columnLayout(model);
  cells.forEach((lines, index) => {
    const x = model.numeric[index] ? lefts[index] + widths[index] - 2 : lefts[index] + 2;
    doc.text(lines, x, y, { align: model.numeric[index] ? "right" : "left", lineHeightFactor: lineH });
  });
}

function drawTableHeader(doc: jsPDF, model: PdfTableModel, y: number): number {
  const { widths } = columnLayout(model);
  fill(doc, [244, 244, 245]);
  doc.rect(M, y, CW, 8, "F");
  stroke(doc, ink.blue);
  doc.setLineWidth(0.4);
  doc.line(M, y + 8, PW - M, y + 8);
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  color(doc, ink.navy);
  drawCells(doc, model, model.headers.map((label, index) => doc.splitTextToSize(pdfText(label).toUpperCase(), widths[index] - 4).slice(0, 1)), y + 5.2, 1);
  return y + 8;
}

/** Renders the model into a new jsPDF document (not saved). */
export function renderOperationalReportPdf(model: PdfTableModel): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { widths } = columnLayout(model);
  let y = drawPageHeader(doc, model);
  y = drawMeta(doc, model, y);
  y = drawSummary(doc, model, y);
  for (const note of model.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    color(doc, ink.muted);
    const lines = doc.splitTextToSize(pdfText(note), CW);
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 1.2;
  }
  if (model.notes.length) y += 1.5;
  y = drawTableHeader(doc, model, y);

  // A cell may hold several lines (FC amount, then its USD equivalent).
  const rowLines = (row: string[]) => row.map((value, index) => String(value || "").split(LINE_BREAK)
    .flatMap((part) => doc.splitTextToSize(pdfText(part), widths[index] - 4) as string[]));
  const drawRow = (row: string[], index: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.6);
    const lines = rowLines(row);
    const height = Math.max(7, Math.max(...lines.map((cell) => cell.length)) * 3.4 + 3.4);
    if (y + height > BOTTOM) {
      doc.addPage();
      y = drawTableHeader(doc, model, drawPageHeader(doc, model));
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(7.6);
    }
    if (bold) { fill(doc, ink.surface); doc.rect(M, y, CW, height, "F"); }
    else if (index % 2 === 1) { fill(doc, [252, 252, 253]); doc.rect(M, y, CW, height, "F"); }
    color(doc, ink.navy);
    drawCells(doc, model, lines, y + 4.6, 1.15);
    stroke(doc, bold ? ink.border : ink.borderSoft);
    doc.setLineWidth(bold ? 0.35 : 0.2);
    doc.line(M, y + height, PW - M, y + height);
    y += height;
  };

  if (!model.body.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    color(doc, ink.muted);
    doc.text(pdfText(model.empty), M + 2, y + 5);
    y += 8;
  }
  model.body.forEach((row, index) => drawRow(row, index));
  if (model.totals) drawRow(model.totals, 0, true);

  const pages = doc.getNumberOfPages();
  const generated = model.meta[model.meta.length - 1];
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    stroke(doc, ink.borderSoft);
    doc.setLineWidth(0.2);
    doc.line(M, FOOTER_TOP, PW - M, FOOTER_TOP);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    color(doc, ink.muted);
    doc.text(pdfText(`${generated.label}: ${generated.value}`), M, FOOTER_TOP + 4.5);
    doc.text(pdfText(`${COMPANY_NAME} - ${model.title}`), PW / 2, FOOTER_TOP + 4.5, { align: "center" });
    doc.text(`${page}/${pages}`, PW - M, FOOTER_TOP + 4.5, { align: "right" });
  }
  return doc;
}

export function downloadOperationalReportPdf(model: PdfTableModel): void {
  renderOperationalReportPdf(model).save(model.fileName);
}
