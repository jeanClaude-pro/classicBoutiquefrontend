import { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Download, Lock, RefreshCw, Search } from "lucide-react";
import { serverUrl } from "../../utils/constants";
import { requestJson, toApiError } from "../../lib/apiError";
import { notifyError } from "../../lib/notify";
import { MODULES } from "../../config/modules";
import { roleLabel } from "../../config/roles";
import { currentLocale } from "../../i18n";
import { Button, Card, EmptyState, ErrorState, FilterBar, PageHeader, Skeleton, StatusBadge } from "../../components/ui";

interface AuditEntry {
  _id: string;
  action: string;
  outcome: "success" | "failure";
  actorName?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  details?: unknown;
  ip?: string;
  createdAt: string;
}

interface AuditPage {
  data: AuditEntry[];
  pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
}

interface Filters { action: string; outcome: string; actor: string; targetId: string; from: string; to: string }

const EMPTY_FILTERS: Filters = { action: "", outcome: "", actor: "", targetId: "", from: "", to: "" };
const PAGE_SIZE = 50;
const EXPORT_LIMIT = 5000;

function query(filters: Filters, page: number, limit = PAGE_SIZE): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [key, value] of Object.entries(filters)) if (value.trim()) params.set(key, value.trim());
  return params.toString();
}

/** A readable one-line summary of the most useful facts of an event. */
function summary(entry: AuditEntry): string {
  const pick = (value: unknown) => (value && typeof value === "object" ? value as Record<string, unknown> : {});
  const after = pick(entry.after);
  const details = pick(entry.details);
  const attempt = pick(details.attempt);
  const parts: string[] = [];
  const id = after.saleId ?? after.expenseId ?? after.entryId ?? details.saleId ?? details.expenseId ?? details.receiptNumber ?? attempt.receiptNumber;
  if (id) parts.push(String(id));
  const amount = after.total ?? after.amountUSD ?? details.total ?? details.amountUSD ?? attempt.total;
  if (amount !== undefined && amount !== null && amount !== "") parts.push(`${Number(amount).toFixed(2)} USD`);
  const reason = details.reason ?? details.code ?? details.updateReason;
  if (reason) parts.push(String(reason));
  return parts.join(" · ");
}

function Value({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === "") return <span className="audit-muted">—</span>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return <pre className="audit-json">{JSON.stringify(value, null, 2)}</pre>;
}

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Neutralize spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function AuditLog() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const actionLabel = useCallback((action: string) => {
    const label = t(`audit.actions.${action}`);
    return label === `audit.actions.${action}` ? action : label;
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await requestJson<AuditPage>(`${serverUrl}/audit-logs?${query(applied, page)}`));
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { void load(); }, [load]);

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  };
  const reset = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows: AuditEntry[] = [];
      for (let next = 1; rows.length < EXPORT_LIMIT; next += 1) {
        const chunk = await requestJson<AuditPage>(`${serverUrl}/audit-logs?${query(applied, next, 100)}`);
        rows.push(...chunk.data);
        if (next >= chunk.pagination.totalPages || chunk.data.length === 0) break;
      }
      const header = [t("audit.when"), t("audit.action"), "code", t("audit.outcome"), t("audit.who"), "role", t("audit.target"), "id", t("audit.ip"), t("audit.before"), t("audit.after"), t("audit.more")];
      const lines = rows.map((row) => [
        new Date(row.createdAt).toISOString(), actionLabel(row.action), row.action, row.outcome, row.actorName, row.actorRole,
        row.targetType, row.targetId, row.ip, row.before, row.after, row.details,
      ].map(csvCell).join(","));
      const blob = new Blob([`${String.fromCharCode(0xfeff)}${[header.map(csvCell).join(","), ...lines].join("\r\n")}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      notifyError(caught);
    } finally {
      setExporting(false);
    }
  };

  const actionOptions = Object.keys((t("audit.actions", { returnObjects: true }) as unknown as Record<string, string>) || {}).sort((a, b) => actionLabel(a).localeCompare(actionLabel(b)));
  const pagination = result?.pagination;
  const dateTime = new Intl.DateTimeFormat(currentLocale(), { dateStyle: "short", timeStyle: "medium", timeZone: "Africa/Lubumbashi" });

  return (
    <div className="ui-page">
      <PageHeader
        title={MODULES.audit.label}
        description={MODULES.audit.description}
        actions={<>
          <Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.retry")}</Button>
          <Button variant="secondary" onClick={() => void exportCsv()} loading={exporting}><Download className="h-4 w-4" />{exporting ? t("audit.exporting") : t("audit.exportCsv")}</Button>
        </>}
      >
        <p className="audit-immutable"><Lock aria-hidden="true" />{t("audit.immutable")}</p>
      </PageHeader>

      <FilterBar aria-label={t("audit.filters")}>
        <form onSubmit={apply} className="audit-filters">
          <label>{t("audit.action")}
            <select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}>
              <option value="">{t("audit.allActions")}</option>
              {actionOptions.map((action) => <option key={action} value={action}>{actionLabel(action)}</option>)}
            </select>
          </label>
          <label>{t("audit.outcome")}
            <select value={filters.outcome} onChange={(event) => setFilters({ ...filters, outcome: event.target.value })}>
              <option value="">{t("audit.allOutcomes")}</option>
              <option value="success">{t("audit.success")}</option>
              <option value="failure">{t("audit.failure")}</option>
            </select>
          </label>
          <label>{t("audit.actor")}
            <input value={filters.actor} maxLength={120} placeholder={t("audit.actorPlaceholder")} onChange={(event) => setFilters({ ...filters, actor: event.target.value })} />
          </label>
          <label>{t("audit.reference")}
            <input value={filters.targetId} maxLength={100} placeholder={t("audit.referencePlaceholder")} onChange={(event) => setFilters({ ...filters, targetId: event.target.value })} />
          </label>
          <label>{t("audit.from")}
            <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
          </label>
          <label>{t("audit.to")}
            <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </label>
          <div className="audit-filter-actions">
            <Button type="submit"><Search className="h-4 w-4" />{t("audit.apply")}</Button>
            <Button type="button" variant="ghost" onClick={reset}>{t("audit.reset")}</Button>
          </div>
        </form>
      </FilterBar>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <Card className="audit-card">
        {pagination && <p className="audit-count">{t("audit.total", { count: pagination.totalRecords })}</p>}
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>{t("audit.when")}</th>
                <th>{t("audit.what")}</th>
                <th>{t("audit.who")}</th>
                <th>{t("audit.details")}</th>
                <th aria-label={t("audit.details")} />
              </tr>
            </thead>
            <tbody>
              {loading && !result && Array.from({ length: 6 }, (_, index) => (
                <tr key={index}><td colSpan={5}><Skeleton className="h-6 w-full" /></td></tr>
              ))}
              {result?.data.map((entry) => {
                const expanded = open === entry._id;
                return (
                  <Fragment key={entry._id}>
                    <tr className={entry.outcome === "failure" ? "is-failure" : ""}>
                      <td className="audit-when">{dateTime.format(new Date(entry.createdAt))}</td>
                      <td>
                        <StatusBadge tone={entry.outcome === "failure" ? "danger" : "success"}>{actionLabel(entry.action)}</StatusBadge>
                      </td>
                      <td><strong>{entry.actorName || "—"}</strong>{entry.actorRole && <span className="audit-muted"> · {roleLabel(entry.actorRole)}</span>}</td>
                      <td className="audit-summary">{summary(entry) || <span className="audit-muted">{entry.targetType} {entry.targetId}</span>}</td>
                      <td>
                        <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : entry._id)}>
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {expanded ? t("audit.hide") : t("audit.show")}
                        </Button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="audit-detail-row">
                        <td colSpan={5}>
                          <dl className="audit-detail">
                            <div><dt>{t("audit.target")}</dt><dd>{entry.targetType || "—"} {entry.targetId && <code>{entry.targetId}</code>}</dd></div>
                            <div><dt>{t("audit.ip")}</dt><dd>{entry.ip || "—"}</dd></div>
                            <div><dt>{t("audit.before")}</dt><dd><Value value={entry.before} /></dd></div>
                            <div><dt>{t("audit.after")}</dt><dd><Value value={entry.after} /></dd></div>
                            <div><dt>{t("audit.more")}</dt><dd><Value value={entry.details} /></dd></div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {result && result.data.length === 0 && <EmptyState title={t("audit.empty")} />}
        {pagination && pagination.totalPages > 1 && (
          <div className="audit-pager">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>{t("audit.previous")}</Button>
            <span>{t("audit.page", { page: pagination.page, pages: pagination.totalPages })}</span>
            <Button variant="secondary" size="sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(page + 1)}>{t("audit.next")}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
