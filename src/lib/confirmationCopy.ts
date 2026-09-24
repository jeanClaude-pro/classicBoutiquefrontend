// Confirmation texts for important actions. Each text describes what the
// server actually does for that action (see the referenced route) — no
// invented consequences. Pure functions: covered by unit tests.
// Texts are read from the dictionaries in the current language when called.
import { currentLocale, t } from "../i18n/index.ts";

export interface CopyDetail { label: string; value: string }

export interface ConfirmationCopy {
  title: string;
  message: string;
  consequences: string[];
  details: CopyDetail[];
  confirmLabel: string;
  pendingLabel: string;
  successMessage: string;
  variant: "primary" | "danger" | "warning";
  /** When set, the action is refused by the server and must not be offered. */
  blockedReason?: string;
}

const CATEGORY_LABEL: Record<string, string> = Object.defineProperties({} as Record<string, string>, {
  CLOTHES: { enumerable: true, get: () => t("confirm.categories.CLOTHES") },
  SHOES: { enumerable: true, get: () => t("confirm.categories.SHOES") },
});

export function formatMoneyUSD(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat(currentLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} $`;
}

// ---------------------------------------------------------------- décaissements

export interface ExpenseLike {
  expenseId?: string;
  reason?: string;
  recipientName?: string;
  amount?: number;
  amountUSD?: number;
  expenseType?: string;
  category?: string;
  status?: string;
  creditorSnapshot?: { name?: string };
}

// Stored expense type → dictionary entry (the stored value never changes).
const EXPENSE_TYPE_KEY: Record<string, string> = {
  COMPANY_EXPENSE: "companyExpense",
  GOODS_PURCHASE: "goodsPurchase",
  REPAYMENT: "repayment",
  repayment: "repayment",
  LEGACY_UNCLASSIFIED: "legacy",
  normal: "legacy",
};

export const EXPENSE_TYPE_LABEL: Record<string, string> = Object.defineProperties({} as Record<string, string>, Object.fromEntries(
  Object.entries(EXPENSE_TYPE_KEY).map(([type, key]) => [type, { enumerable: true, get: () => t(`enums.expenseType.${key}`) }]),
));

export function expenseTypeLabel(type?: string): string {
  return EXPENSE_TYPE_LABEL[type || ""] ?? t("enums.expenseType.legacy");
}

function expenseDetails(expense: ExpenseLike): CopyDetail[] {
  const details: CopyDetail[] = [
    { label: t("confirm.details.operation"), value: expenseTypeLabel(expense.expenseType) },
    { label: t("confirm.details.amount"), value: formatMoneyUSD(expense.amountUSD ?? expense.amount) },
  ];
  if (expense.category) details.push({ label: t("confirm.details.category"), value: CATEGORY_LABEL[expense.category] ?? expense.category });
  if (expense.reason) details.push({ label: t("confirm.details.reason"), value: expense.reason });
  if (expense.recipientName) details.push({ label: t("confirm.details.beneficiary"), value: expense.recipientName });
  return details;
}

/** PATCH /expenses/:id/validate */
export function expenseValidationCopy(expense: ExpenseLike): ConfirmationCopy {
  const category = CATEGORY_LABEL[expense.category || ""] ?? "";
  const base = { details: expenseDetails(expense), pendingLabel: t("confirm.pending.validating"), variant: "primary" as const };
  if (expense.expenseType === "COMPANY_EXPENSE") {
    return {
      ...base,
      title: t("confirm.expense.companyTitle"),
      message: expense.category === "SHOES"
        ? t("confirm.expense.companyMessageShoes", { category })
        : t("confirm.expense.companyMessage", { category }),
      consequences: [t("confirm.expense.companyConsequence")],
      confirmLabel: t("confirm.expense.companyConfirm"),
      successMessage: t("confirm.expense.companySuccess"),
    };
  }
  if (expense.expenseType === "GOODS_PURCHASE") {
    return {
      ...base,
      title: t("confirm.expense.purchaseTitle"),
      message: expense.category === "SHOES"
        ? t("confirm.expense.purchaseMessageShoes", { category })
        : t("confirm.expense.purchaseMessage", { category }),
      consequences: [
        t("confirm.expense.purchaseInsufficient"),
        t("confirm.expense.purchaseStock"),
        t("confirm.expense.purchaseImmutable"),
      ],
      confirmLabel: t("confirm.expense.purchaseConfirm"),
      successMessage: t("confirm.expense.purchaseSuccess"),
    };
  }
  if (expense.expenseType === "REPAYMENT" || expense.expenseType === "repayment") {
    const creditor = expense.creditorSnapshot?.name || expense.recipientName || t("confirm.expense.theCreditor");
    return {
      ...base,
      title: t("confirm.expense.repaymentTitle"),
      message: t("confirm.expense.repaymentMessage", { creditor, amount: formatMoneyUSD(expense.amountUSD ?? expense.amount) }),
      consequences: [t("confirm.expense.repaymentConsequence")],
      confirmLabel: t("confirm.expense.repaymentConfirm"),
      successMessage: t("confirm.expense.repaymentSuccess"),
    };
  }
  return {
    ...base,
    title: t("confirm.expense.blockedTitle"),
    message: t("confirm.expense.blockedMessage"),
    consequences: [t("confirm.expense.blockedConsequence")],
    confirmLabel: t("confirm.expense.blockedConfirm"),
    successMessage: "",
    blockedReason: t("confirm.expense.blockedReason"),
  };
}

/** PATCH /expenses/:id/reject — the record stays in history as "rejected". */
export function expenseRejectionCopy(expense: ExpenseLike): ConfirmationCopy {
  return {
    title: t("confirm.expense.rejectTitle"),
    message: t("confirm.expense.rejectMessage"),
    consequences: [t("confirm.expense.rejectConsequence")],
    details: expenseDetails(expense),
    confirmLabel: t("confirm.expense.rejectConfirm"),
    pendingLabel: t("confirm.pending.rejecting"),
    successMessage: t("confirm.expense.rejectSuccess"),
    variant: "danger",
  };
}

/** DELETE /expenses/:id(/admin) — only non-validated records; permanent. */
export function expenseDeletionCopy(expense: ExpenseLike): ConfirmationCopy {
  const copy: ConfirmationCopy = {
    title: t("confirm.expense.deleteTitle"),
    message: expense.status === "rejected"
      ? t("confirm.expense.deleteRejected")
      : t("confirm.expense.deletePending"),
    consequences: [t("confirm.irreversible")],
    details: expenseDetails(expense),
    confirmLabel: t("confirm.deletePermanently"),
    pendingLabel: t("confirm.pending.deleting"),
    successMessage: t("confirm.expense.deleteSuccess"),
    variant: "danger",
  };
  if (expense.status === "validated") {
    copy.blockedReason = t("confirm.expense.deleteBlocked");
  }
  return copy;
}

/** POST /expenses/:id/reverse — auditable counter-entry, superadmin only. */
export function expenseReversalCopy(expense: ExpenseLike): ConfirmationCopy {
  const category = CATEGORY_LABEL[expense.category || ""] ?? "";
  return {
    title: t("confirm.expense.reverseTitle"),
    message: expense.expenseType === "GOODS_PURCHASE"
      ? t("confirm.expense.reversePurchase", { amount: formatMoneyUSD(expense.amountUSD ?? expense.amount), category })
      : t("confirm.expense.reverseCompany", { amount: formatMoneyUSD(expense.amountUSD ?? expense.amount), category }),
    consequences: [t("confirm.expense.reverseVisible"), t("confirm.expense.reverseOnce")],
    details: expenseDetails(expense),
    confirmLabel: t("confirm.expense.reverseConfirm"),
    pendingLabel: t("confirm.pending.reversing"),
    successMessage: t("confirm.expense.reverseSuccess"),
    variant: "warning",
  };
}

/** POST /expenses — superadmin records are validated immediately. */
export function expenseCreationCopy(expense: ExpenseLike & { autoValidate: boolean }): ConfirmationCopy {
  const validation = expense.expenseType ? expenseValidationCopy(expense) : null;
  const message = expense.autoValidate
    ? t("confirm.expense.createAutoMessage", { validation: validation?.message ?? "" }).trim()
    : t("confirm.expense.createPendingMessage");
  return {
    title: expense.autoValidate ? t("confirm.expense.createAutoTitle") : t("confirm.expense.createPendingTitle"),
    message,
    consequences: expense.autoValidate ? (validation?.consequences ?? []) : [],
    details: expenseDetails(expense),
    confirmLabel: expense.autoValidate ? t("confirm.expense.createAutoConfirm") : t("confirm.expense.createPendingConfirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: expense.autoValidate ? t("confirm.expense.createAutoSuccess") : t("confirm.expense.createPendingSuccess"),
    variant: "primary",
  };
}

// ----------------------------------------------------------------------- ventes

export interface SaleLike {
  saleId?: string;
  type?: string;
  status?: string;
  total?: number;
  customer?: { name?: string };
  items?: Array<{ quantity?: number; name?: string }>;
}

const units = (sale: SaleLike) => (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

function saleDetails(sale: SaleLike): CopyDetail[] {
  const details: CopyDetail[] = [];
  if (sale.saleId) details.push({ label: t("confirm.details.reference"), value: sale.saleId });
  if (sale.customer?.name) details.push({ label: t("confirm.details.customer"), value: sale.customer.name });
  details.push({ label: t("confirm.details.amount"), value: formatMoneyUSD(sale.total) });
  const count = units(sale);
  if (count > 0) details.push({ label: t("confirm.details.items"), value: t("confirm.pieces", { count }) });
  return details;
}

/** PATCH /sales/:id/void — superadmin only; stock returned, record kept as "voided". */
export function voidSaleCopy(sale: SaleLike): ConfirmationCopy {
  const isReservation = sale.type === "reservation";
  const recognized = sale.status === "completed";
  const consequences: string[] = [];
  if (units(sale) > 0) consequences.push(t("confirm.sale.unitsBackInStock", { units: units(sale) }));
  if (recognized) consequences.push(t("confirm.sale.voidRevenue"));
  consequences.push(t("confirm.sale.voidStats"), t("confirm.sale.voidFinal"));
  return {
    title: isReservation ? t("confirm.sale.voidReservationTitle") : t("confirm.sale.voidSaleTitle"),
    message: isReservation ? t("confirm.sale.voidReservationMessage") : t("confirm.sale.voidSaleMessage"),
    consequences,
    details: saleDetails(sale),
    confirmLabel: isReservation ? t("confirm.sale.voidReservationConfirm") : t("confirm.sale.voidSaleConfirm"),
    pendingLabel: t("confirm.pending.voiding"),
    successMessage: isReservation ? t("confirm.sale.voidReservationSuccess") : t("confirm.sale.voidSaleSuccess"),
    variant: "danger",
  };
}

/** DELETE /sales/:id — superadmin only; refused for completed records. */
export function deleteSaleCopy(sale: SaleLike): ConfirmationCopy {
  const isReservation = sale.type === "reservation";
  const consequences: string[] = [];
  if (sale.status !== "voided" && units(sale) > 0) consequences.push(t("confirm.sale.unitsBackInStock", { units: units(sale) }));
  consequences.push(t("confirm.sale.deleteGone"));
  return {
    title: isReservation ? t("confirm.sale.deleteReservationTitle") : t("confirm.sale.deleteSaleTitle"),
    message: isReservation && sale.status === "pending" ? t("confirm.sale.deletePendingReservation") : isReservation ? t("confirm.sale.deleteReservationMessage") : t("confirm.sale.deleteSaleMessage"),
    consequences,
    details: saleDetails(sale),
    confirmLabel: t("confirm.deletePermanently"),
    pendingLabel: t("confirm.pending.deleting"),
    successMessage: isReservation ? t("confirm.sale.deleteReservationSuccess") : t("confirm.sale.deleteSaleSuccess"),
    variant: "danger",
    ...(sale.status === "completed" ? { blockedReason: isReservation ? t("confirm.sale.deleteReservationBlocked") : t("confirm.sale.deleteSaleBlocked") } : {}),
  };
}

// ------------------------------------------------------------------ autres modules

/** DELETE /entries/:id — superadmin only; soft delete (status "deleted"). */
export function deleteEntryCopy(entry: { entryId?: string; amount?: number; amountUSD?: number; source?: string }): ConfirmationCopy {
  return {
    title: t("confirm.entry.deleteTitle"),
    message: t("confirm.entry.deleteMessage"),
    consequences: [],
    details: [
      ...(entry.entryId ? [{ label: t("confirm.details.reference"), value: entry.entryId }] : []),
      { label: t("confirm.details.amount"), value: formatMoneyUSD(entry.amountUSD ?? entry.amount) },
      ...(entry.source ? [{ label: t("confirm.details.source"), value: entry.source }] : []),
    ],
    confirmLabel: t("confirm.entry.deleteConfirm"),
    pendingLabel: t("confirm.pending.deleting"),
    successMessage: t("confirm.entry.deleteSuccess"),
    variant: "danger",
  };
}

/** DELETE /products/:id — permanent; past sales keep their own snapshots. */
export function deleteProductCopy(product: { name?: string; stock?: number }): ConfirmationCopy {
  return {
    title: t("confirm.product.deleteTitle"),
    message: Number(product.stock) > 0 ? t("confirm.product.deleteMessageWithStock", { name: product.name || t("confirm.product.fallbackName"), stock: product.stock }) : t("confirm.product.deleteMessage", { name: product.name || t("confirm.product.fallbackName") }),
    consequences: [t("confirm.product.pastSales"), t("confirm.irreversible")],
    details: [],
    confirmLabel: t("confirm.deletePermanently"),
    pendingLabel: t("confirm.pending.deleting"),
    successMessage: t("confirm.product.deleteSuccess"),
    variant: "danger",
  };
}

/** DELETE /users/:id — permanent; history keeps the author's name. */
export function deleteUserCopy(user: { username?: string; email?: string }): ConfirmationCopy {
  return {
    title: t("confirm.user.deleteTitle"),
    message: t("confirm.user.deleteMessage", { name: user.username || user.email || t("confirm.user.fallbackName") }),
    consequences: [t("confirm.user.deleteHistory"), t("confirm.user.deleteIrreversible")],
    details: user.email ? [{ label: t("confirm.details.email"), value: user.email }] : [],
    confirmLabel: t("confirm.user.deleteConfirm"),
    pendingLabel: t("confirm.pending.deleting"),
    successMessage: t("confirm.user.deleteSuccess"),
    variant: "danger",
  };
}

/** PUT /users/:id/status */
export function toggleUserStatusCopy(user: { username?: string; isActive?: boolean }): ConfirmationCopy {
  const deactivate = user.isActive !== false;
  return {
    title: deactivate ? t("confirm.user.deactivateTitle") : t("confirm.user.reactivateTitle"),
    message: deactivate
      ? t("confirm.user.deactivateMessage", { name: user.username || t("confirm.user.fallbackNameCapital") })
      : t("confirm.user.reactivateMessage", { name: user.username || t("confirm.user.fallbackNameCapital") }),
    consequences: [],
    details: [],
    confirmLabel: deactivate ? t("confirm.user.deactivateConfirm") : t("confirm.user.reactivateConfirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: deactivate ? t("confirm.user.deactivateSuccess") : t("confirm.user.reactivateSuccess"),
    variant: deactivate ? "danger" : "primary",
  };
}

/** POST /exchange-rates — new operations only; history keeps its own rate. */
export function exchangeRateCopy(rate: number, current?: number): ConfirmationCopy {
  const format = (value: number) => new Intl.NumberFormat(currentLocale()).format(value);
  return {
    title: t("confirm.rate.title"),
    message: t("confirm.rate.message", { rate: format(rate) }),
    consequences: [t("confirm.rate.history")],
    details: current ? [{ label: t("confirm.details.currentRate"), value: `1 USD = ${format(current)} FC` }, { label: t("confirm.details.newRate"), value: `1 USD = ${format(rate)} FC` }] : [],
    confirmLabel: t("confirm.rate.confirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: t("confirm.rate.success"),
    variant: "primary",
  };
}

/** POST /creditors/:id/loans — increases the outstanding debt; no delete route. */
export function loanCopy(creditorName: string, amountLabel: string): ConfirmationCopy {
  return {
    title: t("confirm.loan.title"),
    message: t("confirm.loan.message", { creditor: creditorName, amount: amountLabel }),
    consequences: [t("confirm.loan.consequence")],
    details: [],
    confirmLabel: t("confirm.loan.confirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: t("confirm.loan.success"),
    variant: "primary",
  };
}

/** PUT /users/:id/role — the role is re-read on every request, so it applies at once. */
export function roleChangeCopy(
  user: { username?: string; role?: string; assignedCategory?: string },
  next: { role: string; assignedCategory?: string },
  roleName: (role?: string) => string,
): ConfirmationCopy {
  const name = user.username || t("confirm.user.fallbackNameCapital");
  const toShareholder = next.role === "admin";
  const target = toShareholder ? `${roleName("admin")} · ${CATEGORY_LABEL[next.assignedCategory || "CLOTHES"]}` : roleName(next.role);
  const consequences = [t("confirm.role.immediate")];
  if (toShareholder) {
    consequences.push(
      t("confirm.role.shareholderScope", { category: CATEGORY_LABEL[next.assignedCategory || "CLOTHES"] }),
      t("confirm.role.shareholderAccess"),
    );
  } else if (next.role === "superadmin") {
    consequences.push(t("confirm.role.superadmin"));
  } else {
    consequences.push(t("confirm.role.keepPermissions"));
  }
  return {
    title: t("confirm.role.title"),
    message: t("confirm.role.message", { name, from: roleName(user.role), to: target }),
    consequences,
    details: [],
    confirmLabel: t("confirm.role.confirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: t("confirm.role.success"),
    variant: next.role === "superadmin" ? "warning" : "primary",
  };
}

/** PUT /users/:id/role with role "admin" — changes which category a shareholder sees. */
export function shareholderCategoryCopy(user: { username?: string; assignedCategory?: string }, category: string): ConfirmationCopy {
  return {
    title: t("confirm.shareholder.title"),
    message: t("confirm.shareholder.message", { name: user.username || t("confirm.shareholder.fallbackName"), category: CATEGORY_LABEL[category] ?? category, previous: CATEGORY_LABEL[user.assignedCategory || "CLOTHES"] ?? "—" }),
    consequences: [t("confirm.shareholder.immediate")],
    details: [],
    confirmLabel: t("confirm.shareholder.confirm"),
    pendingLabel: t("confirm.pending.saving"),
    successMessage: t("confirm.shareholder.success"),
    variant: "primary",
  };
}
