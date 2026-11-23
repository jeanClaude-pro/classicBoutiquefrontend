import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot, formatFC } from "../utils/salePricing";
import { FUNDS_DEFINITION, FUNDS_LABEL, FUNDS_RULE } from "./analytics/accountingPresentation";
import { requestJson, toApiError } from "../lib/apiError";
import { notifySuccess } from "../lib/notify";
import { MODULES } from "../config/modules";

// One key per submission: a repeated click or a retry after a network error
// returns the already-recorded expense instead of creating a second one.
const newRequestKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface SortieForm {
  expenseType: "COMPANY_EXPENSE" | "GOODS_PURCHASE" | "REPAYMENT";
  category: "CLOTHES" | "SHOES";
  creditorId: string;
  reason: string;
  recipientName: string;
  recipientPhone: string;
  /** Amount in FC, the shop's only currency. */
  amount: string;
  paymentMethod: "cash" | "mpesa" | "bank" | "card" | "other";
  notes: string;
}

const API_BASE = serverUrl;

export default function Sortie() {
  const { t } = useTranslation();
  const [creditors, setCreditors] = useState<Array<{_id:string; name:string; type:string; phone?:string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [funds, setFunds] = useState<{ availablePurchaseFunds: number; fundingShortfall?: number | null } | null>(null);
  const [fundsVersion, setFundsVersion] = useState(0);
  const requestKey = useRef(newRequestKey());
  const submissionInFlight = useRef(false);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

  const [form, setForm] = useState<SortieForm>({
    expenseType: "COMPANY_EXPENSE",
    category: "CLOTHES",
    creditorId: "",
    reason: "",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    fetch(`${API_BASE}/creditors/selector`, { headers: authHeader() }).then(r => r.ok ? r.json() : []).then(setCreditors).catch(() => setCreditors([]));
  }, []);

  useEffect(() => {
    if (form.expenseType === "REPAYMENT") { setFunds(null); return; }
    fetch(`${API_BASE}/expenses/funds/${form.category}`, { headers: authHeader() })
      .then(async (response) => response.ok ? response.json() : null)
      .then(setFunds)
      .catch(() => setFunds(null));
  }, [form.category, form.expenseType, fundsVersion]);

  const isFormValid =
    (form.expenseType !== "REPAYMENT" || form.creditorId !== "") &&
    form.reason.trim() !== "" &&
    form.recipientName.trim() !== "" &&
    (form.expenseType === "REPAYMENT" || form.recipientPhone.trim() !== "") &&
    parseFloat(form.amount) > 0;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // The session is the httpOnly cookie the browser sends by itself.
  function authHeader(): Record<string, string> {
    return {};
  }

  async function handleSortie(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submissionInFlight.current) return;
    setMessage(null);
    setError(null);

    let amountSnapshot: ReturnType<typeof createAmountSnapshot>;
    try {
      amountSnapshot = createAmountSnapshot(parseFloat(form.amount));
    } catch {
      setError(t("expenses.invalidAmount"));
      return;
    }
    const body = {
      expenseType: form.expenseType,
      category: form.expenseType === "REPAYMENT" ? undefined : form.category,
      creditorId: form.expenseType === "REPAYMENT" ? form.creditorId : undefined,
      reason: form.reason,
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone,
      amount: amountSnapshot.amountFC,
      ...amountSnapshot,
      paymentMethod: form.paymentMethod,
      notes: form.notes || "",
      recordedBy: currentUser?.username || "unknown",
      // Same key for every retry of this submission: a repeated or retried
      // request returns the already-recorded operation instead of a duplicate.
      requestKey: requestKey.current,
    };
    let saved: { status?: string };
    submissionInFlight.current = true;
    setIsSubmitting(true);
    try {
      saved = await requestJson<{ status?: string }>(`${API_BASE}/expenses`, { method: "POST", body });
    } catch (caught) {
      const failure = toApiError(caught);
      setError(`${failure.title} — ${failure.message}`);
      // A network/timeout result is unknown, so keep the key for a safe retry.
      // A definite HTTP refusal did not save this request and gets a new key.
      if (!failure.isNetwork) requestKey.current = newRequestKey();
      if (failure.code === "INSUFFICIENT_PURCHASE_FUNDS") setFundsVersion((version) => version + 1);
      return;
    } finally {
      // Only the POST controls the primary loading state. Balance refreshes
      // and all other follow-up UI work happen after the button is released.
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }

    requestKey.current = newRequestKey();
    setForm({
      expenseType: "COMPANY_EXPENSE",
      category: "CLOTHES",
      creditorId: "",
      reason: "",
      recipientName: "",
      recipientPhone: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
    });
    const success = saved.status === "validated"
      ? t("expenses.savedValidated")
      : t("expenses.submitted");
    notifySuccess(success);
    setMessage(saved.status === "validated"
      ? t("expenses.savedValidatedBanner")
      : t("expenses.submittedBanner"));
    // This GET is triggered independently; it cannot keep the save button busy.
    setFundsVersion((version) => version + 1);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 pb-28 md:pb-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{MODULES.sortie.label}</h2>
              <p className="text-gray-600 mt-1">{MODULES.sortie.description}</p>
            </div>
            <span className="self-start sm:self-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700">
              {t("common.currencyFC")}
            </span>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 whitespace-pre-line p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t("expenses.newExpense")}
            </h3>
            <p className="text-gray-600 mt-1">
              {t("expenses.newExpenseHint")}
            </p>
          </div>

          <form onSubmit={handleSortie} className="p-6 space-y-6">
            <fieldset>
              <legend className="mb-3 font-semibold text-gray-900">{t("expenses.operationType")}</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  ["COMPANY_EXPENSE", t("enums.expenseType.companyExpense"), t("expenses.types.companyExpenseHint")],
                  ["GOODS_PURCHASE", t("enums.expenseType.goodsPurchase"), t("expenses.types.goodsPurchaseHint")],
                  ["REPAYMENT", t("enums.expenseType.repayment"), t("expenses.types.repaymentHint")],
                ] as const).map(([value, label, description]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.expenseType === value ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                    <input type="radio" className="sr-only" checked={form.expenseType === value} onChange={() => setForm({ ...form, expenseType: value, creditorId: "" })} />
                    <span className="block font-semibold text-gray-900">{label}</span>
                    <span className="mt-1 block text-xs text-gray-600">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.expenseType !== "REPAYMENT" && <fieldset>
              <legend className="mb-3 font-semibold text-gray-900">{t("expenses.category")}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["CLOTHES", "SHOES"] as const).map((category) => <label key={category} className={`cursor-pointer rounded-xl border-2 p-4 text-center font-semibold ${form.category === category ? "border-primary bg-primary-soft text-primary" : "border-gray-200 text-gray-700"}`}><input type="radio" className="sr-only" checked={form.category === category} onChange={() => setForm({...form, category})}/>{t(`accounting.categoryTitles.${category}`)}</label>)}
              </div>
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {form.expenseType === "COMPANY_EXPENSE"
                  ? form.category === "CLOTHES" ? t("expenses.categoryNote.companyClothes") : t("expenses.categoryNote.companyShoes")
                  : form.category === "CLOTHES" ? t("expenses.categoryNote.purchaseClothes") : t("expenses.categoryNote.purchaseShoes")}
              </div>
            </fieldset>}

            {form.expenseType === "REPAYMENT" && <div><label htmlFor="sortie-creditor" className="block mb-2 font-medium text-gray-700">{t("expenses.activeCreditor")}</label><select id="sortie-creditor" required value={form.creditorId} onChange={(e) => { const c=creditors.find(x=>x._id===e.target.value); setForm({...form, creditorId:e.target.value, reason:c?t("expenses.repaymentReason", { name: c.name }):form.reason, recipientName:c?.name||form.recipientName, recipientPhone:c?.phone||form.recipientPhone}); }} className="w-full p-3 border rounded-lg"><option value="">{t("expenses.select")}</option>{creditors.map(c=><option key={c._id} value={c._id}>{c.name} ({t(`debts.types.${c.type}`, { defaultValue: c.type })})</option>)}</select><p className="text-xs text-gray-500 mt-1">{t("expenses.balanceChecked")}</p></div>}
            {/* Reason for Expense */}
            <div>
              <label htmlFor="sortie-reason" className="block mb-2 font-medium text-gray-700">
                {t("expenses.reasonLabel")}
              </label>
              <input
                id="sortie-reason"
                type="text"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder={t("expenses.reasonPlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Recipient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortie-recipient-name" className="block mb-2 font-medium text-gray-700">
                  {t("expenses.beneficiaryName")}
                </label>
                <input
                  id="sortie-recipient-name"
                  type="text"
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder={t("expenses.fullName")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="sortie-recipient-phone" className="block mb-2 font-medium text-gray-700">
                  {t("expenses.beneficiaryPhone")} {form.expenseType !== "REPAYMENT" && "*"}
                </label>
                <input
                  id="sortie-recipient-phone"
                  type="tel"
                  name="recipientPhone"
                  value={form.recipientPhone}
                  onChange={handleChange}
                  placeholder={t("expenses.phoneNumber")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required={form.expenseType !== "REPAYMENT"}
                />
              </div>
            </div>

            {/* Amount and Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortie-amount" className="block mb-2 font-medium text-gray-700">
                  {t("expenses.amountLabelFC")}
                </label>
                <input
                  id="sortie-amount"
                  type="number"
                  inputMode="numeric"
                  name="amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="sortie-payment-method" className="block mb-2 font-medium text-gray-700">
                  {t("expenses.paymentMethod")}
                </label>
                <select
                  id="sortie-payment-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="cash">{t("expenses.payment.cash")}</option>
                  <option value="mpesa">{t("expenses.payment.mpesa")}</option>
                  <option value="bank">{t("expenses.payment.bank")}</option>
                  <option value="card">{t("expenses.payment.card")}</option>
                  <option value="other">{t("expenses.payment.other")}</option>
                </select>
              </div>
            </div>

            {form.expenseType === "GOODS_PURCHASE" && funds && (
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><p className="text-xs text-slate-300">{FUNDS_LABEL}</p><p className="text-lg font-bold">{formatFC(funds.availablePurchaseFunds)}</p></div>
                  <div><p className="text-xs text-slate-300">{t("expenses.requestedAmount")}</p><p className="text-lg font-bold">{formatFC(Number(form.amount || 0))}</p></div>
                  <div><p className="text-xs text-slate-300">{t("expenses.balanceAfter")}</p><p className={`text-lg font-bold ${funds.availablePurchaseFunds - Number(form.amount || 0) < 0 ? "text-red-300" : "text-emerald-300"}`}>{formatFC(funds.availablePurchaseFunds - Number(form.amount || 0))}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-300">{FUNDS_DEFINITION} {FUNDS_RULE[form.category]}</p>
                {Number(funds.fundingShortfall || 0) > 0 && (
                  <p className="mt-2 text-xs text-red-300">{t("expenses.shortfall", { amount: formatFC(Number(funds.fundingShortfall)) })}</p>
                )}
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label htmlFor="sortie-notes" className="block mb-2 font-medium text-gray-700">
                {t("expenses.notes")}
              </label>
              <textarea
                id="sortie-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder={t("expenses.notesPlaceholder")}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Recorded By */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span className="block mb-1 text-sm font-medium text-gray-600">
                {t("expenses.recordedBy")}
              </span>
              <p className="text-gray-900 font-medium">
                {currentUser?.username || t("expenses.user")}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all ${
                isFormValid && !isSubmitting
                  ? "bg-primary hover:bg-primary-hover"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t("expenses.saving")}
                </div>
              ) : (
                t("expenses.save")
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="bg-blue-50 border-t border-blue-200 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {t("expenses.importantInfo")}
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    {t("expenses.infoText")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
