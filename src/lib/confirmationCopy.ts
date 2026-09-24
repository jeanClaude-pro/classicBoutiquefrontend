// Confirmation texts for important actions. Each text describes what the
// server actually does for that action (see the referenced route) — no
// invented consequences. Pure functions: covered by unit tests.

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

const CATEGORY_LABEL: Record<string, string> = { CLOTHES: "VÊTEMENTS", SHOES: "CHAUSSURES" };

export function formatMoneyUSD(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} $`;
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

export const EXPENSE_TYPE_LABEL: Record<string, string> = {
  COMPANY_EXPENSE: "Dépense de l'entreprise",
  GOODS_PURCHASE: "Achat de marchandises",
  REPAYMENT: "Remboursement de dette",
  repayment: "Remboursement de dette",
  LEGACY_UNCLASSIFIED: "Sortie historique non classée",
  normal: "Sortie historique non classée",
};

export function expenseTypeLabel(type?: string): string {
  return EXPENSE_TYPE_LABEL[type || ""] ?? "Sortie historique non classée";
}

function expenseDetails(expense: ExpenseLike): CopyDetail[] {
  const details: CopyDetail[] = [
    { label: "Opération", value: expenseTypeLabel(expense.expenseType) },
    { label: "Montant", value: formatMoneyUSD(expense.amountUSD ?? expense.amount) },
  ];
  if (expense.category) details.push({ label: "Catégorie", value: CATEGORY_LABEL[expense.category] ?? expense.category });
  if (expense.reason) details.push({ label: "Motif", value: expense.reason });
  if (expense.recipientName) details.push({ label: "Bénéficiaire", value: expense.recipientName });
  return details;
}

/** PATCH /expenses/:id/validate */
export function expenseValidationCopy(expense: ExpenseLike): ConfirmationCopy {
  const category = CATEGORY_LABEL[expense.category || ""] ?? "";
  const base = { details: expenseDetails(expense), pendingLabel: "Validation…", variant: "primary" as const };
  if (expense.expenseType === "COMPANY_EXPENSE") {
    return {
      ...base,
      title: "Valider cette dépense ?",
      message: expense.category === "SHOES"
        ? `Cette dépense sera enregistrée comme dépense de l'entreprise et affectera le résultat de la catégorie ${category}. Elle est déduite avant le partage du bénéfice entre les deux actionnaires.`
        : `Cette dépense sera enregistrée comme dépense de l'entreprise et affectera le résultat de la catégorie ${category}.`,
      consequences: ["Une fois validée, elle ne peut plus être modifiée ni supprimée : seule une contre-passation l'annule."],
      confirmLabel: "Valider la dépense",
      successMessage: "Dépense validée avec succès.",
    };
  }
  if (expense.expenseType === "GOODS_PURCHASE") {
    return {
      ...base,
      title: "Valider cet achat de marchandises ?",
      message: expense.category === "SHOES"
        ? `Le montant sera prélevé sur les fonds de réapprovisionnement ${category} disponibles. Le bénéfice des actionnaires ne sera pas utilisé.`
        : `Le montant sera prélevé sur les fonds de réapprovisionnement ${category} : d'abord sur le capital récupéré, puis, si nécessaire, sur le bénéfice disponible.`,
      consequences: [
        "Si les fonds disponibles sont insuffisants, la validation est refusée et rien n'est enregistré.",
        "Le stock n'est pas modifié : les articles reçus s'ajoutent dans « Articles & stock ».",
        "Une fois validé, l'achat ne peut plus être modifié ni supprimé : seule une contre-passation l'annule.",
      ],
      confirmLabel: "Valider l'achat",
      successMessage: "Achat de marchandises validé avec succès.",
    };
  }
  if (expense.expenseType === "REPAYMENT" || expense.expenseType === "repayment") {
    const creditor = expense.creditorSnapshot?.name || expense.recipientName || "le créancier";
    return {
      ...base,
      title: "Valider ce remboursement ?",
      message: `La dette envers ${creditor} sera réduite de ${formatMoneyUSD(expense.amountUSD ?? expense.amount)}.`,
      consequences: ["Si le montant dépasse la dette restante, la validation est refusée."],
      confirmLabel: "Valider le remboursement",
      successMessage: "Remboursement validé avec succès.",
    };
  }
  return {
    ...base,
    title: "Validation impossible",
    message: "Cette sortie historique n'est pas classée (dépense de l'entreprise ou achat de marchandises). Elle ne peut pas être validée.",
    consequences: ["Rejetez-la, puis enregistrez un nouveau décaissement avec le bon type et la bonne catégorie."],
    confirmLabel: "Valider",
    successMessage: "",
    blockedReason: "Sortie historique non classée : rejetez-la puis enregistrez un nouveau décaissement.",
  };
}

/** PATCH /expenses/:id/reject — the record stays in history as "rejected". */
export function expenseRejectionCopy(expense: ExpenseLike): ConfirmationCopy {
  return {
    title: "Rejeter ce décaissement ?",
    message: "Le décaissement restera visible dans l'historique avec le statut « Rejeté ». Il n'aura aucun effet sur la caisse, la comptabilité ni les dettes.",
    consequences: ["Un décaissement rejeté ne peut plus être validé."],
    details: expenseDetails(expense),
    confirmLabel: "Rejeter",
    pendingLabel: "Rejet…",
    successMessage: "Décaissement rejeté.",
    variant: "danger",
  };
}

/** DELETE /expenses/:id(/admin) — only non-validated records; permanent. */
export function expenseDeletionCopy(expense: ExpenseLike): ConfirmationCopy {
  const copy: ConfirmationCopy = {
    title: "Supprimer définitivement ce décaissement ?",
    message: expense.status === "rejected"
      ? "Ce décaissement rejeté sera effacé de l'historique."
      : "Ce décaissement en attente sera effacé de l'historique avant toute validation.",
    consequences: ["Cette action est irréversible."],
    details: expenseDetails(expense),
    confirmLabel: "Supprimer définitivement",
    pendingLabel: "Suppression…",
    successMessage: "Décaissement supprimé.",
    variant: "danger",
  };
  if (expense.status === "validated") {
    copy.blockedReason = "Un décaissement validé ne peut pas être supprimé. Utilisez une contre-passation pour l'annuler.";
  }
  return copy;
}

/** POST /expenses/:id/reverse — auditable counter-entry, superadmin only. */
export function expenseReversalCopy(expense: ExpenseLike): ConfirmationCopy {
  const category = CATEGORY_LABEL[expense.category || ""] ?? "";
  return {
    title: "Contre-passer cette opération ?",
    message: expense.expenseType === "GOODS_PURCHASE"
      ? `Une opération inverse sera enregistrée : les ${formatMoneyUSD(expense.amountUSD ?? expense.amount)} reviennent dans les fonds de réapprovisionnement ${category}, selon la même répartition capital / bénéfice que l'achat initial.`
      : `Une opération inverse sera enregistrée : la dépense de ${formatMoneyUSD(expense.amountUSD ?? expense.amount)} ne réduira plus le résultat de la catégorie ${category}.`,
    consequences: ["L'opération initiale et sa contre-passation restent toutes deux visibles dans l'historique.", "Une opération ne peut être contre-passée qu'une seule fois."],
    details: expenseDetails(expense),
    confirmLabel: "Contre-passer",
    pendingLabel: "Contre-passation…",
    successMessage: "Contre-passation enregistrée.",
    variant: "warning",
  };
}

/** POST /expenses — superadmin records are validated immediately. */
export function expenseCreationCopy(expense: ExpenseLike & { autoValidate: boolean }): ConfirmationCopy {
  const validation = expense.expenseType ? expenseValidationCopy(expense) : null;
  const message = expense.autoValidate
    ? `Votre compte valide directement ce décaissement. ${validation?.message ?? ""}`.trim()
    : "Le décaissement sera soumis pour validation. Il n'aura aucun effet tant qu'un responsable ne l'a pas validé.";
  return {
    title: expense.autoValidate ? "Enregistrer et valider ce décaissement ?" : "Soumettre ce décaissement ?",
    message,
    consequences: expense.autoValidate ? (validation?.consequences ?? []) : [],
    details: expenseDetails(expense),
    confirmLabel: expense.autoValidate ? "Enregistrer et valider" : "Soumettre",
    pendingLabel: "Enregistrement…",
    successMessage: expense.autoValidate ? "Décaissement enregistré et validé." : "Décaissement soumis avec succès.",
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
  if (sale.saleId) details.push({ label: "Référence", value: sale.saleId });
  if (sale.customer?.name) details.push({ label: "Client", value: sale.customer.name });
  details.push({ label: "Montant", value: formatMoneyUSD(sale.total) });
  const count = units(sale);
  if (count > 0) details.push({ label: "Articles", value: `${count} pièce${count > 1 ? "s" : ""}` });
  return details;
}

/** PATCH /sales/:id/void — superadmin only; stock returned, record kept as "voided". */
export function voidSaleCopy(sale: SaleLike): ConfirmationCopy {
  const isReservation = sale.type === "reservation";
  const recognized = sale.status === "completed";
  const consequences: string[] = [];
  if (units(sale) > 0) consequences.push(`Les ${units(sale)} pièce(s) seront remises en stock.`);
  if (recognized) consequences.push("Elle ne comptera plus dans le chiffre d'affaires, le coût des articles vendus ni le bénéfice.");
  consequences.push("Les statistiques du client seront recalculées.", "L'annulation est définitive : elle ne peut pas être défaite.");
  return {
    title: isReservation ? "Annuler cette réservation ?" : "Annuler cette vente ?",
    message: `${isReservation ? "La réservation" : "La vente"} restera dans l'historique avec le statut « Annulée ».`,
    consequences,
    details: saleDetails(sale),
    confirmLabel: isReservation ? "Annuler la réservation" : "Annuler la vente",
    pendingLabel: "Annulation…",
    successMessage: isReservation ? "Réservation annulée." : "Vente annulée.",
    variant: "danger",
  };
}

/** PATCH /sales/:id/complete — stock was already reserved at creation. */
export function completeReservationCopy(sale: SaleLike): ConfirmationCopy {
  return {
    title: "Terminer cette réservation ?",
    message: "La réservation devient une vente terminée : le client reçoit ses articles.",
    consequences: [
      "La vente sera comptabilisée aujourd'hui dans le chiffre d'affaires et le bénéfice.",
      "Le stock ne change pas : les articles ont été réservés à la création.",
      "Un reçu de remise sera imprimé.",
    ],
    details: saleDetails(sale),
    confirmLabel: "Terminer la réservation",
    pendingLabel: "Enregistrement…",
    successMessage: "Réservation terminée avec succès.",
    variant: "primary",
  };
}

/** PATCH /sales/:id/pending — superadmin only; reversible by completing again. */
export function revertReservationCopy(sale: SaleLike): ConfirmationCopy {
  return {
    title: "Remettre cette réservation en attente ?",
    message: "La vente redevient une réservation en attente.",
    consequences: [
      "Elle ne comptera plus dans le chiffre d'affaires ni dans le bénéfice jusqu'à ce qu'elle soit de nouveau terminée.",
      "Le stock reste réservé.",
      "Si son capital a déjà servi à un achat de marchandises, un « capital à reconstituer » apparaîtra dans les rapports.",
    ],
    details: saleDetails(sale),
    confirmLabel: "Remettre en attente",
    pendingLabel: "Enregistrement…",
    successMessage: "Réservation remise en attente.",
    variant: "warning",
  };
}

/** DELETE /sales/:id — superadmin only; refused for completed records. */
export function deleteSaleCopy(sale: SaleLike): ConfirmationCopy {
  const isReservation = sale.type === "reservation";
  const noun = isReservation ? "cette réservation" : "cette vente";
  const consequences: string[] = [];
  if (sale.status !== "voided" && units(sale) > 0) consequences.push(`Les ${units(sale)} pièce(s) seront remises en stock.`);
  consequences.push("Elle disparaîtra définitivement de l'historique. Cette action est irréversible.");
  return {
    title: `Supprimer définitivement ${noun} ?`,
    message: isReservation && sale.status === "pending" ? "Cette réservation en attente n'a jamais été comptabilisée." : `${isReservation ? "Cette réservation" : "Cette vente"} n'est plus comptabilisée.`,
    consequences,
    details: saleDetails(sale),
    confirmLabel: "Supprimer définitivement",
    pendingLabel: "Suppression…",
    successMessage: isReservation ? "Réservation supprimée." : "Vente supprimée.",
    variant: "danger",
    ...(sale.status === "completed" ? { blockedReason: `Une ${isReservation ? "réservation terminée" : "vente terminée"} est comptabilisée : elle ne peut pas être supprimée. Annulez-la d'abord.` } : {}),
  };
}

// ------------------------------------------------------------------ autres modules

/** DELETE /entries/:id — superadmin only; soft delete (status "deleted"). */
export function deleteEntryCopy(entry: { entryId?: string; amount?: number; amountUSD?: number; source?: string }): ConfirmationCopy {
  return {
    title: "Supprimer cette entrée de caisse ?",
    message: "L'entrée sera marquée comme supprimée et ne sera plus comptée dans les entrées de caisse. L'enregistrement est conservé pour le contrôle.",
    consequences: [],
    details: [
      ...(entry.entryId ? [{ label: "Référence", value: entry.entryId }] : []),
      { label: "Montant", value: formatMoneyUSD(entry.amountUSD ?? entry.amount) },
      ...(entry.source ? [{ label: "Source", value: entry.source }] : []),
    ],
    confirmLabel: "Supprimer l'entrée",
    pendingLabel: "Suppression…",
    successMessage: "Entrée de caisse supprimée.",
    variant: "danger",
  };
}

/** DELETE /products/:id — permanent; past sales keep their own snapshots. */
export function deleteProductCopy(product: { name?: string; stock?: number }): ConfirmationCopy {
  return {
    title: "Supprimer définitivement cet article ?",
    message: `« ${product.name || "Article"} » sera retiré du catalogue${Number(product.stock) > 0 ? ` avec son stock de ${product.stock} pièce(s)` : ""}.`,
    consequences: ["Les ventes passées conservent leur nom, prix et coût enregistrés.", "Cette action est irréversible."],
    details: [],
    confirmLabel: "Supprimer définitivement",
    pendingLabel: "Suppression…",
    successMessage: "Article supprimé.",
    variant: "danger",
  };
}

/** DELETE /users/:id — permanent; history keeps the author's name. */
export function deleteUserCopy(user: { username?: string; email?: string }): ConfirmationCopy {
  return {
    title: "Supprimer définitivement ce compte ?",
    message: `Le compte « ${user.username || user.email || "utilisateur"} » ne pourra plus se connecter.`,
    consequences: ["Les opérations déjà enregistrées par cet utilisateur restent dans l'historique.", "Cette action est irréversible. Pour une suspension temporaire, désactivez plutôt le compte."],
    details: user.email ? [{ label: "Email", value: user.email }] : [],
    confirmLabel: "Supprimer le compte",
    pendingLabel: "Suppression…",
    successMessage: "Utilisateur supprimé.",
    variant: "danger",
  };
}

/** PUT /users/:id/status */
export function toggleUserStatusCopy(user: { username?: string; isActive?: boolean }): ConfirmationCopy {
  const deactivate = user.isActive !== false;
  return {
    title: deactivate ? "Désactiver ce compte ?" : "Réactiver ce compte ?",
    message: deactivate
      ? `« ${user.username || "Utilisateur"} » sera bloqué dès sa prochaine action et ne pourra plus se connecter tant que le compte n'est pas réactivé.`
      : `« ${user.username || "Utilisateur"} » pourra de nouveau se connecter avec ses droits actuels.`,
    consequences: [],
    details: [],
    confirmLabel: deactivate ? "Désactiver" : "Réactiver",
    pendingLabel: "Enregistrement…",
    successMessage: deactivate ? "Compte désactivé." : "Compte réactivé.",
    variant: deactivate ? "danger" : "primary",
  };
}

/** POST /exchange-rates — new operations only; history keeps its own rate. */
export function exchangeRateCopy(rate: number, current?: number): ConfirmationCopy {
  const format = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
  return {
    title: "Appliquer ce nouveau taux ?",
    message: `1 USD = ${format(rate)} FC sera utilisé pour les nouvelles ventes, réservations, entrées et décaissements.`,
    consequences: ["Les opérations déjà enregistrées gardent le taux en vigueur au moment de leur saisie."],
    details: current ? [{ label: "Taux actuel", value: `1 USD = ${format(current)} FC` }, { label: "Nouveau taux", value: `1 USD = ${format(rate)} FC` }] : [],
    confirmLabel: "Appliquer le taux",
    pendingLabel: "Enregistrement…",
    successMessage: "Taux de change mis à jour avec succès.",
    variant: "primary",
  };
}

/** POST /creditors/:id/loans — increases the outstanding debt; no delete route. */
export function loanCopy(creditorName: string, amountLabel: string): ConfirmationCopy {
  return {
    title: "Enregistrer cet emprunt ?",
    message: `La dette envers ${creditorName} augmentera de ${amountLabel}.`,
    consequences: ["Un emprunt enregistré ne peut pas être supprimé. Vérifiez le montant et la devise."],
    details: [],
    confirmLabel: "Enregistrer l'emprunt",
    pendingLabel: "Enregistrement…",
    successMessage: "Emprunt enregistré avec succès.",
    variant: "primary",
  };
}

/** PUT /users/:id/role — the role is re-read on every request, so it applies at once. */
export function roleChangeCopy(
  user: { username?: string; role?: string; assignedCategory?: string },
  next: { role: string; assignedCategory?: string },
  roleName: (role?: string) => string,
): ConfirmationCopy {
  const name = user.username || "Utilisateur";
  const toShareholder = next.role === "admin";
  const target = toShareholder ? `${roleName("admin")} · ${CATEGORY_LABEL[next.assignedCategory || "CLOTHES"]}` : roleName(next.role);
  const consequences = ["Le changement s'applique dès sa prochaine action ; il n'a pas besoin de se reconnecter."];
  if (toShareholder) {
    consequences.push(
      `Il ne verra que les données de la catégorie ${CATEGORY_LABEL[next.assignedCategory || "CLOTHES"]}, en lecture seule.`,
      "Ses accès aux pages sont limités à ceux autorisés aux actionnaires et ses permissions d'actions sont retirées.",
    );
  } else if (next.role === "superadmin") {
    consequences.push("Il aura un accès complet, y compris l'administration des comptes.");
  } else {
    consequences.push("Ses permissions personnalisées éventuelles sont conservées.");
  }
  return {
    title: "Changer le rôle de ce compte ?",
    message: `« ${name} » passera de « ${roleName(user.role)} » à « ${target} ».`,
    consequences,
    details: [],
    confirmLabel: "Changer le rôle",
    pendingLabel: "Enregistrement…",
    successMessage: "Rôle mis à jour.",
    variant: next.role === "superadmin" ? "warning" : "primary",
  };
}

/** PUT /users/:id/role with role "admin" — changes which category a shareholder sees. */
export function shareholderCategoryCopy(user: { username?: string; assignedCategory?: string }, category: string): ConfirmationCopy {
  return {
    title: "Changer la catégorie de cet actionnaire ?",
    message: `« ${user.username || "Actionnaire"} » verra désormais les données de la catégorie ${CATEGORY_LABEL[category] ?? category} au lieu de ${CATEGORY_LABEL[user.assignedCategory || "CLOTHES"] ?? "—"}.`,
    consequences: ["Le changement s'applique dès sa prochaine action."],
    details: [],
    confirmLabel: "Changer la catégorie",
    pendingLabel: "Enregistrement…",
    successMessage: "Catégorie de l'actionnaire mise à jour.",
    variant: "primary",
  };
}
