// "Télécharger la fiche de stock": the consolidated Fiche de stock of every
// product the user may see, generated as a PDF for the chosen period and
// category. Nothing is listed on screen; the server aggregates and enforces
// the category (a shareholder is pinned to its own).
import { useState } from "react";
import { FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { serverUrl } from "../../utils/constants";
import { formatNowGMT2 } from "../../utils/dateUtils";
import { requestJson, toApiError } from "../../lib/apiError";
import { downloadOperationalReportPdf } from "../reports/operationalReportPdf";
import { stockSheetPdfModel, type StockSheetPayload } from "../reports/operationalReportModel";
import { ReportFilterFields } from "../reports/reportControls";
import { periodLabelOf, useReportFilters, useShopIdentity } from "../reports/reportFilters";

export function StockReportDownload() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters = useReportFilters();
  const shop = useShopIdentity(open);

  async function generate() {
    if (!filters.rangeValid) return;
    setBusy(true);
    setError(null);
    try {
      const data = await requestJson<StockSheetPayload>(`${serverUrl}/products/stock-sheet?${filters.query}`);
      downloadOperationalReportPdf(stockSheetPdfModel(data, {
        shop,
        periodLabel: periodLabelOf(data.period, filters.range),
        generatedAt: formatNowGMT2(),
        range: filters.range,
      }));
      setOpen(false);
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setOpen(true); }}
        className="ui-button ui-button--secondary w-full sm:w-auto"
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        {t("operationalReports.downloadStock")}
      </button>
      <ConfirmDialog
        open={open}
        title={t("operationalReports.downloadStockTitle")}
        message={(
          <div className="space-y-3">
            <p>{t("operationalReports.downloadStockHint")}</p>
            <div className="grid gap-3">
              <ReportFilterFields filters={filters} idPrefix="stock-download" />
            </div>
            {!filters.rangeValid && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("operationalReports.invalidRange")}</p>}
          </div>
        )}
        confirmLabel={t("operationalReports.downloadPdf")}
        pendingLabel={t("operationalReports.generating")}
        loading={busy}
        disabled={!filters.rangeValid}
        error={error ? { title: t("system.errorOccurred"), message: error } : null}
        onConfirm={() => void generate()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
