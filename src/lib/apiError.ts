// Turns any failed request into a controlled, user-facing error in the
// selected language. Pages never render raw backend payloads, error codes or
// stack traces. Behavior depends on the HTTP status and error code only.
import { currentLanguage, currentLocale, t } from "../i18n/index.ts";

export interface ApiErrorInit {
  status: number;
  title: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor({ status, title, message, code, details }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.code = code;
    this.details = details;
  }

  /** Network failure or timeout: the operation may or may not have reached the server. */
  get isNetwork(): boolean { return this.status === 0; }
  /** The record changed meanwhile: callers should refresh their data. */
  get isConflict(): boolean { return this.status === 409 && this.code !== "INSUFFICIENT_PURCHASE_FUNDS"; }
}

/** An error raised by page code whose message is already user-facing (and translated). */
export function userError(message: string, title = t("apiErrors.titles.impossible")): ApiError {
  return new ApiError({ status: -1, title, message });
}

const MESSAGE_KEYS = ["network", "timeout", "unauthorized", "forbidden", "notFound", "conflict", "invalid", "tooLarge", "rateLimited", "server", "unavailable", "unexpected"] as const;
type MessageKey = (typeof MESSAGE_KEYS)[number];

/** Generic messages, read in the language active at the moment of use. */
export const MESSAGES = Object.defineProperties({} as Record<MessageKey, string>, Object.fromEntries(
  MESSAGE_KEYS.map((key) => [key, { enumerable: true, get: () => t(`apiErrors.messages.${key}`) }]),
));

const TITLE_KEYS: Record<number, string> = {
  0: "connection", 400: "invalid", 401: "sessionExpired", 403: "forbidden", 404: "notFound",
  409: "impossible", 413: "tooLarge", 422: "invalid", 429: "rateLimited",
};
const title = (status: number): string | undefined => (TITLE_KEYS[status] ? t(`apiErrors.titles.${TITLE_KEYS[status]}`) : undefined);

// Stable server error codes: used when the server wording cannot be shown.
const CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_EXPENSE_ID: "apiErrors.codes.duplicateExpenseId",
  IDEMPOTENCY_CONFLICT: "apiErrors.codes.idempotencyConflict",
  DUPLICATE_KEY: "apiErrors.codes.duplicateKey",
};

// Known server messages (English, or French written by the server), each
// mapped to a dictionary entry. Matched case-insensitively as prefixes so
// messages with an appended identifier still match. Captured groups become
// the named interpolation values listed after the key.
const TRANSLATIONS: Array<[RegExp, string, string[]?]> = [
  [/^insufficient stock for (.+?)\. available: (\d+)/i, "server.insufficientStock", ["product", "available"]],
  [/status changed; refresh and retry|reservation status changed/i, "messages.conflict"],
  [/^sale is already voided/i, "server.saleAlreadyVoided"],
  [/^reservation already completed/i, "server.reservationAlreadyCompleted"],
  [/^only a completed reservation can return to pending/i, "server.onlyCompletedToPending"],
  [/^this is not a reservation/i, "server.notAReservation"],
  [/^cannot edit a voided or corrected sale/i, "server.cannotEditVoided"],
  [/^transaction type cannot be changed/i, "server.typeImmutable"],
  [/^cannot validate a rejected expense/i, "server.cannotValidateRejected"],
  [/^cannot reject a validated expense/i, "server.cannotRejectValidated"],
  [/^expense is already rejected/i, "server.alreadyRejected"],
  [/^rejection reason is required/i, "server.rejectionReasonRequired"],
  [/^reversal reason is required/i, "server.reversalReasonRequired"],
  [/^transaction already reversed/i, "server.alreadyReversed"],
  [/^only validated company expenses or goods purchases can be reversed/i, "server.onlyValidatedReversible"],
  [/^validated accounting transactions are immutable|^validated accounting transactions cannot be deleted/i, "server.validatedImmutable"],
  [/^validated cash-outs cannot be deleted/i, "server.validatedNotDeletable"],
  [/^the amount of a validated cash-out is immutable/i, "server.validatedAmountImmutable"],
  [/^repayment expenses are immutable/i, "server.repaymentImmutable"],
  [/^applied repayments cannot be deleted/i, "server.appliedRepaymentNotDeletable"],
  [/^repayment exceeds the available debt/i, "server.repaymentExceedsDebt"],
  [/^repayment was already applied/i, "server.repaymentAlreadyApplied"],
  [/^selected creditor is unavailable/i, "server.creditorUnavailable"],
  [/^you can only (edit|delete) your own pending expenses/i, "server.ownPendingOnly"],
  [/^only (admin|admins|administrators) can/i, "messages.forbidden"],
  [/^insufficient permissions/i, "messages.forbidden"],
  [/^access denied|^forbidden|^superadministrator access required/i, "messages.forbidden"],
  [/^customer name is required/i, "server.customerNameRequired"],
  [/^sale must contain at least one item/i, "server.saleNeedsItem"],
  [/^each item requires/i, "server.itemNeedsQuantityPrice"],
  [/^(sale|expense|product|entry|user) not found|^not found/i, "messages.notFound"],
  [/^invalid (sale|expense|product|entry|user) id/i, "messages.notFound"],
  [/^username already (taken|exists)|^user already exists|^email already/i, "server.userExists"],
  [/^invalid role/i, "server.invalidRole"],
  [/^missing credentials|^invalid email or password/i, "server.invalidCredentials"],
  // Messages the server writes in French.
  [/^les ventes à crédit ne sont pas prises en charge/i, "server.creditSalesUnsupported"],
  [/^une réservation nécessite les coordonnées du client/i, "server.reservationNeedsCustomer"],
  [/^réservation non trouvée/i, "messages.notFound"],
  [/^stock insuffisant pour modifier cette vente/i, "server.insufficientStockToEdit"],
  [/^une vente comptabilisée ne peut pas être supprimée/i, "server.recognizedSaleNotDeletable"],
  [/^cette dépense historique n'est pas classée/i, "server.legacyExpenseUnclassified"],
  [/^cette requête a déjà été utilisée/i, "codes.idempotencyConflict"],
  [/^fonds de réapprovisionnement insuffisants/i, "server.insufficientFunds"],
  [/^le nom d'utilisateur est requis/i, "server.usernameRequired"],
  [/^le nom d'utilisateur ne peut pas être vide/i, "server.usernameEmpty"],
  [/^le mot de passe doit comporter entre 10 et 128 caractères/i, "server.passwordLength"],
  [/^cet email est déjà utilisé/i, "server.emailTaken"],
  [/^vous ne pouvez pas modifier le rôle de votre propre compte/i, "server.ownRole"],
  [/^vous ne pouvez pas désactiver votre propre compte/i, "server.ownStatus"],
  [/^vous ne pouvez pas supprimer votre propre compte/i, "server.ownDelete"],
];

const TECHNICAL = /mongo|e11000|replica set|cast to|objectid|validationerror|stack|exception|\bat\s+\S+\s+\(|undefined|null|typeerror|econn|timeout|syntaxerror/i;
const FRENCH = /[àâçéèêëîïôûùüœ]|\b(le|la|les|des|une|un|est|pas|pour|de|du|au|aux|vous|cette|ce)\b/i;

function formatUSD(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat(currentLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} $`;
}

/** Picks a safe, user-facing message from a server-provided string, if possible. */
export function translateServerMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const message = raw.trim();
  if (!message || message.length > 300) return null;
  for (const [pattern, key, names = []] of TRANSLATIONS) {
    const match = message.match(pattern);
    if (match) return t(`apiErrors.${key}`, Object.fromEntries(names.map((name, index) => [name, match[index + 1] ?? ""])));
  }
  // The server writes some business messages in French for users. They are
  // shown as-is in French; in English the generic status message is used.
  if (currentLanguage() === "fr" && FRENCH.test(message) && !TECHNICAL.test(message)) return message;
  return null;
}

function fallbackMessage(status: number): string {
  if (status === 0) return MESSAGES.network;
  if (status === 400 || status === 422) return MESSAGES.invalid;
  if (status === 401) return MESSAGES.unauthorized;
  if (status === 403) return MESSAGES.forbidden;
  if (status === 404) return MESSAGES.notFound;
  if (status === 409) return MESSAGES.conflict;
  if (status === 413) return MESSAGES.tooLarge;
  if (status === 429) return MESSAGES.rateLimited;
  if (status === 502 || status === 503 || status === 504) return MESSAGES.unavailable;
  if (status >= 500) return MESSAGES.server;
  return MESSAGES.unexpected;
}

/** Builds the user-facing error for an HTTP status and its (possibly malformed) JSON body. */
export function apiErrorFromPayload(status: number, payload: unknown): ApiError {
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const code = typeof body.error === "string" && /^[A-Z][A-Z0-9_]+$/.test(body.error) ? body.error : undefined;

  if (code === "INSUFFICIENT_PURCHASE_FUNDS") {
    return new ApiError({
      status, code,
      title: t("apiErrors.titles.insufficientFunds"),
      message: t("apiErrors.insufficientFunds", { requested: formatUSD(body.requested), available: formatUSD(body.available) }),
      details: { requested: body.requested, available: body.available, category: body.category },
    });
  }

  // Authorization always gets the same explanation, whatever the server said.
  if (status === 401 || status === 403) {
    const deactivated = typeof body.message === "string" && /désactivé|deactivated/i.test(body.message);
    return new ApiError({ status, code, title: title(status)!, message: deactivated ? t("apiErrors.accountDeactivated") : fallbackMessage(status) });
  }

  // The server's own wording when it is known or already French (in French);
  // otherwise the message for its stable error code (e.g. in English).
  const translated = translateServerMessage(body.error) ?? translateServerMessage(body.message)
    ?? (code && CODE_MESSAGES[code] ? t(CODE_MESSAGES[code]) : null);
  const isConflictStatus = status === 409 && (!translated || translated === MESSAGES.conflict);
  return new ApiError({
    status, code,
    title: isConflictStatus ? t("apiErrors.titles.dataChanged") : title(status) ?? t(status >= 500 ? "apiErrors.titles.server" : "apiErrors.titles.impossible"),
    message: status >= 500 && status !== 503 ? fallbackMessage(status) : translated ?? fallbackMessage(status),
  });
}

/** Reads a failed Response without ever throwing on an empty or non-JSON body. */
export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let payload: unknown = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  return apiErrorFromPayload(response.status, payload);
}

/** Normalizes anything thrown (fetch TypeError, AbortError, ApiError, string) to an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error && typeof error === "object" && (error as { name?: string }).name === "AbortError") {
    return new ApiError({ status: 0, title: t("apiErrors.titles.timeout"), message: MESSAGES.timeout, code: "TIMEOUT" });
  }
  if (error instanceof TypeError) {
    return new ApiError({ status: 0, title: title(0)!, message: MESSAGES.network, code: "NETWORK" });
  }
  // A plain Error raised by page code may already carry a user-facing message.
  const translated = error instanceof Error ? translateServerMessage(error.message) : translateServerMessage(error);
  if (translated) return new ApiError({ status: -1, title: t("apiErrors.titles.impossible"), message: translated });
  return new ApiError({ status: -1, title: t("apiErrors.titles.unexpected"), message: MESSAGES.unexpected });
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

/**
 * fetch + authentication + timeout + JSON parsing. Resolves with the parsed
 * body on success; rejects with an ApiError otherwise. Never rejects with a
 * raw network or parsing exception.
 */
export async function requestJson<T = unknown>(url: string, { body, timeoutMs = 30_000, headers, ...init }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      headers: authHeaders((headers as Record<string, string>) || {}),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: init.signal ?? controller.signal,
    });
    if (!response.ok) throw await apiErrorFromResponse(response);
    const text = await response.text();
    try {
      return (text ? JSON.parse(text) : null) as T;
    } catch {
      return null as T;
    }
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timer);
  }
}
