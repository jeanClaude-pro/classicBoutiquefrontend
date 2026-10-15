import { Fragment, useEffect, useState } from "react";
import { ArchiveX, ChevronDown, ChevronUp, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiErrorFromResponse, toApiError } from "../../lib/apiError";
import { formatDateTimeGMT2 } from "../../utils/dateUtils";
import { formatFC, formatUSD, getSaleFcTotal, type StoredSaleItemPrice } from "../../utils/salePricing";
import { serverUrl } from "../../utils/constants";

interface VoidedSaleItem extends StoredSaleItemPrice {
  _id?: string;
  productId: string;
  name: string;
}

interface VoidedSale {
  _id: string;
  saleId: string;
  customer?: { name?: string; phone?: string };
  items: VoidedSaleItem[];
  total: number;
  exchangeRate?: number;
  paymentMethod: string;
  status: string;
  salesPerson?: string;
  createdAt: string;
  voidedAt?: string;
  editHistory?: Array<{ reason?: string }>;
}

interface VoidedSalesResponse {
  success: boolean;
  data?: VoidedSale[];
  pagination?: {
    page: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface Props {
  token: string;
  queryString: string;
}

export default function VoidedSalesDialog({ token, queryString }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState<VoidedSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<VoidedSalesResponse["pagination"]>();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    async function loadVoidedSales() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(queryString);
        params.set("status", "voided");
        params.set("page", String(page));
        params.set("limit", "50");
        const response = await fetch(`${serverUrl}/sales?${params}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw await apiErrorFromResponse(response);
        const body = (await response.json()) as VoidedSalesResponse;
        if (!body.success || !Array.isArray(body.data)) throw new Error(t("salesHistory.unexpectedResponse"));
        // Never trust only the query parameter: keep this archive exclusively
        // for records whose persisted status is actually voided.
        setSales(body.data.filter((sale) => sale.status === "voided"));
        setPagination(body.pagination);
      } catch (caught) {
        if (!controller.signal.aborted) setError(t("salesHistory.loadFailed", { message: toApiError(caught).message }));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadVoidedSales();
    return () => controller.abort();
  }, [open, page, queryString, token, t]);

  return (
    <>
      <button
        type="button"
        onClick={() => { setPage(1); setOpen(true); }}
        className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-2"
      >
        <ArchiveX className="w-4 h-4" />
        {t("salesHistory.voided.open")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="voided-sales-title">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 id="voided-sales-title" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <ArchiveX className="h-5 w-5 text-red-600" />
                  {t("salesHistory.voided.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t("salesHistory.voided.description")}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label={t("salesHistory.voided.close")}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin" /> {t("salesHistory.loading")}
                </div>
              ) : error ? (
                <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
              ) : sales.length === 0 ? (
                <div className="py-12 text-center text-gray-500">{t("salesHistory.voided.empty")}</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("salesHistory.cols.saleId")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("salesHistory.cols.customer")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("salesHistory.cols.agent")}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t("salesHistory.cols.total")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("salesHistory.voided.voidedAt")}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sales.map((sale) => {
                        const expanded = expandedId === sale._id;
                        const fcTotal = getSaleFcTotal(sale.total, sale.items, sale.exchangeRate);
                        const reason = sale.editHistory?.[sale.editHistory.length - 1]?.reason;
                        return (
                          <Fragment key={sale._id}>
                            <tr className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{sale.saleId}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div>{sale.customer?.name || t("salesHistory.customerMissing")}</div>
                                {sale.customer?.phone && <div className="text-xs text-gray-500">{sale.customer.phone}</div>}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{sale.salesPerson || t("salesHistory.notSpecified")}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {fcTotal === undefined ? "—" : formatFC(fcTotal)}
                                <div className="text-xs font-normal text-gray-500">≈ {formatUSD(sale.total)}</div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDateTimeGMT2(sale.voidedAt || sale.createdAt)}</td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => setExpandedId(expanded ? null : sale._id)} className="rounded p-1 text-blue-600 hover:bg-blue-50" aria-label={t("salesHistory.voided.toggle", { id: sale.saleId })}>
                                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </td>
                            </tr>
                            {expanded && (
                              <tr className="bg-red-50/40">
                                <td colSpan={6} className="px-6 py-4 text-sm text-gray-700">
                                  {reason && <p className="mb-2"><span className="font-medium">{t("salesHistory.reason")}:</span> {reason}</p>}
                                  <ul className="space-y-1">
                                    {sale.items.map((item, index) => (
                                      <li key={item._id || `${item.productId}-${index}`}>
                                        {item.name}: {item.quantity} × {item.enteredPrice ?? item.price ?? 0} {item.enteredCurrency || "USD"}
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("salesHistory.pagination", { page: pagination.page, pages: pagination.totalPages, count: pagination.totalRecords })}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border px-3 py-1.5 text-sm disabled:opacity-40">
                      {t("salesHistory.previous")}
                    </button>
                    <button type="button" disabled={!pagination.hasNextPage} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-1.5 text-sm disabled:opacity-40">
                      {t("salesHistory.next")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
