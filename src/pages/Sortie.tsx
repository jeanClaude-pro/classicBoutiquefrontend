import React, { useState, useEffect, useRef } from "react";
import { formatDateGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { Calculator, DollarSign, RefreshCw } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot, formatFC, formatUSD } from "../utils/salePricing";
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
  amount: string;
  amountInFC: string;
  paymentMethod: "cash" | "mpesa" | "bank" | "card" | "other";
  notes: string;
  currencyMode: "usd" | "fc";
}

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

export default function Sortie() {
  const [creditors, setCreditors] = useState<Array<{_id:string; name:string; type:string; phone?:string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
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
    amountInFC: "",
    paymentMethod: "cash",
    notes: "",
    currencyMode: "fc",
  });

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      } else {
        console.warn('Failed to load exchange rate');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    loadExchangeRate();
    fetch(`${API_BASE}/creditors/selector`, { headers: authHeader() }).then(r => r.ok ? r.json() : []).then(setCreditors).catch(() => setCreditors([]));
  }, []);

  useEffect(() => {
    if (form.expenseType === "REPAYMENT") { setFunds(null); return; }
    fetch(`${API_BASE}/expenses/funds/${form.category}`, { headers: authHeader() })
      .then(async (response) => response.ok ? response.json() : null)
      .then(setFunds)
      .catch(() => setFunds(null));
  }, [form.category, form.expenseType, fundsVersion]);

  // Calculate USD amount when FC amount changes
  useEffect(() => {
    if (form.currencyMode === "fc" && form.amountInFC && exchangeRate) {
      const fcAmount = parseFloat(form.amountInFC) || 0;
      const usdAmount = fcAmount / exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amount: usdAmount.toFixed(2)
      }));
    }
  }, [form.amountInFC, form.currencyMode, exchangeRate]);

  // Calculate FC amount when USD amount changes
  useEffect(() => {
    if (form.currencyMode === "usd" && form.amount && exchangeRate) {
      const usdAmount = parseFloat(form.amount) || 0;
      const fcAmount = usdAmount * exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amountInFC: Math.round(fcAmount).toString()
      }));
    }
  }, [form.amount, form.currencyMode, exchangeRate]);

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

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
      amount: "",
      amountInFC: ""
    }));
  };

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleSortie(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submissionInFlight.current) return;
    setMessage(null);
    setError(null);

    let amountSnapshot: ReturnType<typeof createAmountSnapshot>;
    try {
      amountSnapshot = createAmountSnapshot(
        parseFloat(form.currencyMode === "fc" ? form.amountInFC : form.amount),
        form.currencyMode === "fc" ? "FC" : "USD",
        exchangeRate?.rate
      );
    } catch {
      setError("Montant invalide ou taux de change indisponible. Vérifiez le montant saisi.");
      return;
    }
    const body = {
      expenseType: form.expenseType,
      category: form.expenseType === "REPAYMENT" ? undefined : form.category,
      creditorId: form.expenseType === "REPAYMENT" ? form.creditorId : undefined,
      reason: form.reason,
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone,
      amount: amountSnapshot.amountUSD,
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
      amountInFC: "",
      paymentMethod: "cash",
      notes: "",
      currencyMode: "fc",
    });
    const success = saved.status === "validated"
      ? "Décaissement enregistré et validé."
      : "Décaissement soumis avec succès.";
    notifySuccess(success);
    setMessage(saved.status === "validated"
      ? "✅ Décaissement enregistré et validé."
      : "✅ Décaissement soumis : il sera pris en compte après validation.");
    // This GET is triggered independently; it cannot keep the save button busy.
    setFundsVersion((version) => version + 1);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 pb-28 md:pb-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header with Exchange Rate */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{MODULES.sortie.label}</h2>
              <p className="text-gray-600 mt-1">{MODULES.sortie.description}</p>
            </div>
            
            {/* Exchange Rate Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full min-w-0 sm:w-auto sm:min-w-[280px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Taux du jour:</span>
                </div>
                {loadingRate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : exchangeRate ? (
                  <div className="text-right">
                    <div className="font-bold text-blue-800 text-lg">
                      1 USD = {new Intl.NumberFormat('fr-FR').format(exchangeRate.rate)} FC
                    </div>
                    <div className="text-xs text-blue-600">
                      Effectif depuis {formatDateGMT2(exchangeRate.effectiveFrom)}
                    </div>
                  </div>
                ) : (
                  <span className="text-red-600 text-sm">Taux non disponible</span>
                )}
              </div>
            </div>
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

        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h3 className="text-xl font-semibold text-white text-center">
              Nouveau décaissement
            </h3>
            <p className="text-blue-100 text-center mt-2">
              Choisissez le type d'opération, la catégorie et le montant.
            </p>
          </div>

          <form onSubmit={handleSortie} className="p-6 space-y-6">
            <fieldset>
              <legend className="mb-3 font-semibold text-gray-900">Type d'opération *</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  ["COMPANY_EXPENSE", "Dépense de l'entreprise", "Réduit le bénéfice de la catégorie"],
                  ["GOODS_PURCHASE", "Achat de marchandises", "Utilise les fonds de réapprovisionnement"],
                  ["REPAYMENT", "Remboursement de dette", "Réduit le solde d'un créancier"],
                ] as const).map(([value, label, description]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.expenseType === value ? "border-purple-600 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-purple-300"}`}>
                    <input type="radio" className="sr-only" checked={form.expenseType === value} onChange={() => setForm({ ...form, expenseType: value, creditorId: "" })} />
                    <span className="block font-semibold text-gray-900">{label}</span>
                    <span className="mt-1 block text-xs text-gray-600">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.expenseType !== "REPAYMENT" && <fieldset>
              <legend className="mb-3 font-semibold text-gray-900">Catégorie *</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["CLOTHES", "SHOES"] as const).map((category) => <label key={category} className={`cursor-pointer rounded-xl border-2 p-4 text-center font-semibold ${form.category === category ? "border-blue-600 bg-blue-50 text-blue-900" : "border-gray-200 text-gray-700"}`}><input type="radio" className="sr-only" checked={form.category === category} onChange={() => setForm({...form, category})}/>{category === "CLOTHES" ? "Vêtements" : "Chaussures"}</label>)}
              </div>
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {form.expenseType === "COMPANY_EXPENSE"
                  ? form.category === "CLOTHES" ? "Cette dépense sera déduite du bénéfice VÊTEMENTS." : "Cette dépense sera déduite du bénéfice CHAUSSURES avant le partage entre les deux actionnaires."
                  : form.category === "CLOTHES" ? "L'achat peut être financé par le capital récupéré et le bénéfice VÊTEMENTS disponibles." : "L'achat sera financé uniquement par le capital récupéré sur les ventes CHAUSSURES. Le bénéfice des actionnaires reste protégé."}
              </div>
            </fieldset>}

            {form.expenseType === "REPAYMENT" && <div><label htmlFor="sortie-creditor" className="block mb-2 font-medium text-gray-700">Créancier actif *</label><select id="sortie-creditor" required value={form.creditorId} onChange={(e) => { const c=creditors.find(x=>x._id===e.target.value); setForm({...form, creditorId:e.target.value, reason:c?`Remboursement dette — ${c.name}`:form.reason, recipientName:c?.name||form.recipientName, recipientPhone:c?.phone||form.recipientPhone}); }} className="w-full p-3 border rounded-lg"><option value="">Sélectionner...</option>{creditors.map(c=><option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}</select><p className="text-xs text-gray-500 mt-1">Le solde sera vérifié par le serveur.</p></div>}
            {/* Reason for Expense */}
            <div>
              <label htmlFor="sortie-reason" className="block mb-2 font-medium text-gray-700">
                Motif du décaissement *
              </label>
              <input
                id="sortie-reason"
                type="text"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Ex: Achat fournitures bureau, Transport, etc."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Recipient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortie-recipient-name" className="block mb-2 font-medium text-gray-700">
                  Nom du bénéficiaire *
                </label>
                <input
                  id="sortie-recipient-name"
                  type="text"
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="Nom complet"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="sortie-recipient-phone" className="block mb-2 font-medium text-gray-700">
                  Téléphone du bénéficiaire {form.expenseType !== "REPAYMENT" && "*"}
                </label>
                <input
                  id="sortie-recipient-phone"
                  type="tel"
                  name="recipientPhone"
                  value={form.recipientPhone}
                  onChange={handleChange}
                  placeholder="Numéro de téléphone"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required={form.expenseType !== "REPAYMENT"}
                />
              </div>
            </div>

            {/* Amount and Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="sortie-amount" className="block font-medium text-gray-700">
                    Montant *
                  </label>
                  <button
                    type="button"
                    onClick={toggleCurrencyMode}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Calculator className="w-3 h-3" />
                    {form.currencyMode === 'usd' ? 'USD → FC' : 'FC → USD'}
                  </button>
                </div>
                
                {form.currencyMode === 'usd' ? (
                  <input
                    id="sortie-amount"
                    type="number"
                    step="0.01"
                    name="amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    min="0.01"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                ) : (
                  <input
                    id="sortie-amount"
                    type="number"
                    name="amountInFC"
                    value={form.amountInFC}
                    onChange={(e) => setForm({ ...form, amountInFC: e.target.value })}
                    placeholder="0"
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                )}
                
                {/* Conversion Display */}
                {form.amount && form.currencyMode === 'usd' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatFC(parseFloat(form.amount) * exchangeRate.rate)}
                  </p>
                )}
                {form.amountInFC && form.currencyMode === 'fc' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatUSD(parseFloat(form.amountInFC) / exchangeRate.rate)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="sortie-payment-method" className="block mb-2 font-medium text-gray-700">
                  Méthode de paiement *
                </label>
                <select
                  id="sortie-payment-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="mpesa">M-Pesa ou Airtel Money</option>
                  <option value="bank">Transfert Bancaire</option>
                  <option value="card">Carte</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            {/* Amount Summary */}
            {form.amount && exchangeRate && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Montant en USD</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatUSD(parseFloat(form.amount))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Équivalent en FC</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatFC(parseFloat(form.amount) * exchangeRate.rate)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {form.expenseType === "GOODS_PURCHASE" && funds && (
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><p className="text-xs text-slate-300">{FUNDS_LABEL}</p><p className="text-lg font-bold">{formatUSD(funds.availablePurchaseFunds)}</p></div>
                  <div><p className="text-xs text-slate-300">Montant demandé</p><p className="text-lg font-bold">{formatUSD(Number(form.amount || 0))}</p></div>
                  <div><p className="text-xs text-slate-300">Solde après opération</p><p className={`text-lg font-bold ${funds.availablePurchaseFunds - Number(form.amount || 0) < 0 ? "text-red-300" : "text-emerald-300"}`}>{formatUSD(funds.availablePurchaseFunds - Number(form.amount || 0))}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-300">{FUNDS_DEFINITION} {FUNDS_RULE[form.category]}</p>
                {Number(funds.fundingShortfall || 0) > 0 && (
                  <p className="mt-2 text-xs text-red-300">Capital à reconstituer : {formatUSD(Number(funds.fundingShortfall))}. De nouvelles ventes doivent d'abord couvrir ce montant.</p>
                )}
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label htmlFor="sortie-notes" className="block mb-2 font-medium text-gray-700">
                Notes supplémentaires (optionnel)
              </label>
              <textarea
                id="sortie-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Détails supplémentaires…"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Recorded By */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span className="block mb-1 text-sm font-medium text-gray-600">
                Enregistré par
              </span>
              <p className="text-gray-900 font-medium">
                {currentUser?.username || "Utilisateur"}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all ${
                isFormValid && !isSubmitting
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </div>
              ) : (
                "Enregistrer le décaissement"
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
                  Information importante
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Un décaissement n'est jamais comptabilisé dans les ventes.
                    Son reçu s'imprime depuis l'Historique des décaissements une fois validé.
                  </p>
                  {exchangeRate && (
                    <p className="mt-2 font-medium">
                      💱 Taux utilisé: 1 USD = {new Intl.NumberFormat('fr-FR').format(exchangeRate.rate)} FC
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
