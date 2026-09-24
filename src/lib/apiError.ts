// Turns any failed request into a controlled, French, user-facing error.
// Pages never render raw backend payloads, error codes or stack traces.

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

export const MESSAGES = {
  network: "Impossible de contacter le serveur. Vérifiez votre connexion puis réessayez.",
  timeout: "Le serveur met trop de temps à répondre. Vérifiez la liste avant de réessayer : l'opération a peut-être été enregistrée.",
  unauthorized: "Votre session a expiré. Veuillez vous reconnecter.",
  forbidden: "Vous n'avez pas l'autorisation d'effectuer cette opération.",
  notFound: "Cet élément est introuvable. Il a peut-être été supprimé ou n'est plus accessible.",
  conflict: "Cette opération a été modifiée entre-temps. Les données ont été actualisées. Veuillez vérifier puis réessayer.",
  invalid: "Certaines informations sont invalides. Vérifiez le formulaire puis réessayez.",
  tooLarge: "La demande est trop volumineuse.",
  rateLimited: "Trop de tentatives. Patientez quelques instants puis réessayez.",
  server: "Une erreur interne est survenue. L'opération n'a pas été effectuée. Réessayez ; si le problème persiste, contactez l'administrateur.",
  unavailable: "Le service est momentanément indisponible. Réessayez dans quelques instants.",
  unexpected: "Une erreur inattendue est survenue. Réessayez.",
} as const;

const TITLES: Record<number, string> = {
  0: "Connexion impossible",
  400: "Données invalides",
  401: "Session expirée",
  403: "Accès refusé",
  404: "Élément introuvable",
  409: "Opération impossible",
  413: "Demande trop volumineuse",
  422: "Données invalides",
  429: "Trop de tentatives",
};

// Known English server messages, translated. Keys are matched case-insensitively
// as prefixes so messages with an appended identifier still match.
const TRANSLATIONS: Array<[RegExp, string]> = [
  [/^insufficient stock for (.+?)\. available: (\d+)/i, "Stock insuffisant pour $1 (disponible : $2)."],
  [/status changed; refresh and retry|reservation status changed/i, MESSAGES.conflict],
  [/^sale is already voided/i, "Cette vente est déjà annulée."],
  [/^reservation already completed/i, "Cette réservation est déjà terminée."],
  [/^only a completed reservation can return to pending/i, "Seule une réservation terminée peut être remise en attente."],
  [/^this is not a reservation/i, "Cette opération ne concerne que les réservations."],
  [/^cannot edit a voided or corrected sale/i, "Une vente annulée ou corrigée ne peut plus être modifiée."],
  [/^transaction type cannot be changed/i, "Le type d'opération ne peut pas être modifié."],
  [/^cannot validate a rejected expense/i, "Une dépense rejetée ne peut plus être validée."],
  [/^cannot reject a validated expense/i, "Une dépense validée ne peut pas être rejetée. Utilisez une contre-passation."],
  [/^expense is already rejected/i, "Cette dépense est déjà rejetée."],
  [/^rejection reason is required/i, "Indiquez le motif du rejet."],
  [/^reversal reason is required/i, "Indiquez le motif de la contre-passation."],
  [/^transaction already reversed/i, "Cette opération a déjà été contre-passée."],
  [/^only validated company expenses or goods purchases can be reversed/i, "Seules les dépenses d'entreprise et les achats de marchandises validés peuvent être contre-passés."],
  [/^validated accounting transactions are immutable|^validated accounting transactions cannot be deleted/i, "Une opération comptable validée ne peut être ni modifiée ni supprimée. Utilisez une contre-passation."],
  [/^validated cash-outs cannot be deleted/i, "Un décaissement validé ne peut pas être supprimé."],
  [/^the amount of a validated cash-out is immutable/i, "Le montant d'un décaissement validé ne peut pas être modifié."],
  [/^repayment expenses are immutable/i, "Un remboursement ne peut pas être modifié. Rejetez-le puis créez-en un nouveau."],
  [/^applied repayments cannot be deleted/i, "Un remboursement appliqué ne peut pas être supprimé."],
  [/^repayment exceeds the available debt/i, "Le remboursement dépasse la dette restante de ce créancier."],
  [/^repayment was already applied/i, "Ce remboursement a déjà été appliqué."],
  [/^selected creditor is unavailable/i, "Le créancier sélectionné n'est plus disponible."],
  [/^you can only (edit|delete) your own pending expenses/i, "Vous ne pouvez modifier ou supprimer que vos propres décaissements en attente."],
  [/^only (admin|admins|administrators) can/i, MESSAGES.forbidden],
  [/^insufficient permissions/i, MESSAGES.forbidden],
  [/^access denied|^forbidden|^superadministrator access required/i, MESSAGES.forbidden],
  [/^customer name is required/i, "Le nom du client est obligatoire."],
  [/^sale must contain at least one item/i, "Ajoutez au moins un article."],
  [/^each item requires/i, "Chaque article doit avoir une quantité et un prix valides."],
  [/^(sale|expense|product|entry|user) not found|^not found/i, MESSAGES.notFound],
  [/^invalid (sale|expense|product|entry|user) id/i, MESSAGES.notFound],
  [/^username already (taken|exists)|^user already exists|^email already/i, "Ce nom d'utilisateur ou cet email est déjà utilisé."],
  [/^invalid role/i, "Rôle invalide."],
  [/^missing credentials|^invalid email or password/i, "Email ou mot de passe incorrect."],
];

const TECHNICAL = /mongo|e11000|replica set|cast to|objectid|validationerror|stack|exception|\bat\s+\S+\s+\(|undefined|null|typeerror|econn|timeout|syntaxerror/i;
const FRENCH = /[àâçéèêëîïôûùüœ]|\b(le|la|les|des|une|un|est|pas|pour|de|du|au|aux|vous|cette|ce)\b/i;

function formatUSD(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} $`;
}

/** Picks a safe, French message from a server-provided string, if possible. */
export function translateServerMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const message = raw.trim();
  if (!message || message.length > 300) return null;
  for (const [pattern, replacement] of TRANSLATIONS) {
    const match = message.match(pattern);
    if (match) return replacement.replace(/\$(\d)/g, (_, index: string) => match[Number(index)] ?? "");
  }
  // The server already writes some business messages in French for users.
  if (FRENCH.test(message) && !TECHNICAL.test(message)) return message;
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
      title: "Fonds insuffisants",
      message: `Montant demandé : ${formatUSD(body.requested)}\nFonds disponibles : ${formatUSD(body.available)}`,
      details: { requested: body.requested, available: body.available, category: body.category },
    });
  }

  // Authorization always gets the same explanation, whatever the server said.
  if (status === 401 || status === 403) {
    const deactivated = typeof body.message === "string" && /désactivé/i.test(body.message);
    return new ApiError({ status, code, title: TITLES[status], message: deactivated ? String(body.message) : fallbackMessage(status) });
  }

  const translated = translateServerMessage(body.error) ?? translateServerMessage(body.message);
  const isConflictStatus = status === 409 && (!translated || translated === MESSAGES.conflict);
  return new ApiError({
    status, code,
    title: isConflictStatus ? "Données modifiées" : TITLES[status] ?? (status >= 500 ? "Erreur du serveur" : "Opération impossible"),
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
    return new ApiError({ status: 0, title: "Délai dépassé", message: MESSAGES.timeout, code: "TIMEOUT" });
  }
  if (error instanceof TypeError) {
    return new ApiError({ status: 0, title: TITLES[0], message: MESSAGES.network, code: "NETWORK" });
  }
  // A plain Error raised by page code may already carry a French message.
  const translated = error instanceof Error ? translateServerMessage(error.message) : translateServerMessage(error);
  if (translated) return new ApiError({ status: -1, title: "Opération impossible", message: translated });
  return new ApiError({ status: -1, title: "Erreur inattendue", message: MESSAGES.unexpected });
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
