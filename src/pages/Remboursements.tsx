import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, Landmark, Plus, ReceiptText } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { Button, Card, EmptyState, ErrorState, PageHeader, StatusBadge } from "../components/ui";
import { requestJson, toApiError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notify";
import { loanCopy } from "../lib/confirmationCopy";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { MODULES } from "../config/modules";

type Creditor = { _id: string; name: string; type: "person" | "bank" | "company"; phone: string; address: string; isActive: boolean; totalBorrowed: number; totalRepaid: number; remainingBalance: number };
type Loan = { _id: string; amountUSD: number; borrowedAt: string; reference?: string };
type Repayment = { _id: string; amountUSD: number; status: string; createdAt?: string };
type History = { creditor: Creditor; loans: Loan[]; repayments: Repayment[]; reconciliation: { borrowed: number; repaid: number; storedOutstanding: number } };
type CreditorForm = { name: string; type: Creditor["type"]; phone: string; address: string };
type LoanForm = { enteredAmount: string; enteredCurrency: "USD" | "FC"; exchangeRate: string; borrowedAt: string; reference: string; note: string };

const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value || 0);
const initialCreditor: CreditorForm = { name: "", type: "person", phone: "", address: "" };
const initialLoan = (): LoanForm => ({ enteredAmount: "", enteredCurrency: "USD", exchangeRate: "", borrowedAt: new Date().toISOString().slice(0, 10), reference: "", note: "" });

export default function Remboursements() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCreditor, setSavingCreditor] = useState(false);
  const [form, setForm] = useState<CreditorForm>(initialCreditor);
  const [loan, setLoan] = useState<LoanForm>(initialLoan);
  const confirmAction = useConfirmAction();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try { setCreditors(await requestJson<Creditor[]>(`${serverUrl}/creditors`)); }
    catch (error) { setLoadError(toApiError(error).message); }
    finally { setLoading(false); }
  }, []);
  const loadHistory = useCallback(async (id: string) => {
    setSelected(id);
    try { setHistory(await requestJson<History>(`${serverUrl}/creditors/${id}/history`)); }
    catch (error) { setHistory(null); notifyError(error); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const createCreditor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingCreditor) return;
    setSavingCreditor(true);
    try {
      await requestJson(`${serverUrl}/creditors`, { method: "POST", body: form });
      notifySuccess("Créancier ajouté avec succès.");
      setForm(initialCreditor);
      await load();
    } catch (error) {
      notifyError(error);
    } finally {
      setSavingCreditor(false);
    }
  };
  const addLoan = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(loan.enteredAmount);
    const rate = loan.enteredCurrency === "FC" ? Number(loan.exchangeRate) : (Number(loan.exchangeRate) || 1);
    if (!(amount > 0) || !(rate > 0)) { notifyError(new Error("Montant ou taux de change invalide.")); return; }
    const body = { ...loan, enteredAmount: amount, exchangeRate: rate, amount, amountUSD: loan.enteredCurrency === "FC" ? amount / rate : amount, amountFC: loan.enteredCurrency === "FC" ? amount : amount * rate };
    const creditor = creditors.find((item) => item._id === selected);
    const amountLabel = loan.enteredCurrency === "FC"
      ? `${new Intl.NumberFormat("fr-FR").format(amount)} FC (${money(body.amountUSD)})`
      : money(amount);
    confirmAction.request({
      ...loanCopy(creditor?.name || "ce créancier", amountLabel),
      action: () => requestJson(`${serverUrl}/creditors/${selected}/loans`, { method: "POST", body }),
      onSuccess: async () => { setLoan(initialLoan()); await load(); await loadHistory(selected); },
    });
  };

  return <div className="p-6 max-w-7xl mx-auto">
    <PageHeader title={MODULES.remboursements.label} description={MODULES.remboursements.description} />
    {loadError && <div className="mb-5"><ErrorState message={loadError} action={<Button variant="secondary" className="mt-3" onClick={() => void load()}>Réessayer</Button>} /></div>}

    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-blue-700" /><h2 className="font-semibold">Ajouter un créancier</h2></div>
      <form onSubmit={createCreditor} className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div><label htmlFor="creditor-name" className="block mb-1.5">Nom *</label><input id="creditor-name" required className="w-full px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label htmlFor="creditor-type" className="block mb-1.5">Type</label><select id="creditor-type" className="w-full px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Creditor["type"] })}><option value="person">Personne</option><option value="bank">Banque</option><option value="company">Entreprise</option></select></div>
        <div><label htmlFor="creditor-phone" className="block mb-1.5">Téléphone</label><input id="creditor-phone" className="w-full px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label htmlFor="creditor-address" className="block mb-1.5">Adresse</label><input id="creditor-address" className="w-full px-3 py-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="flex items-end"><Button className="w-full" type="submit" disabled={savingCreditor}><Plus className="w-4 h-4" />{savingCreditor ? "Ajout…" : "Ajouter"}</Button></div>
      </form>
    </Card>

    <div className="grid lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.6fr)] gap-5 items-start">
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2"><Building2 className="w-5 h-5 text-gray-500" /><h2 className="font-semibold">Créanciers</h2><span className="ml-auto text-xs text-gray-500">{creditors.length}</span></div>
        {loading ? <div className="p-6 text-sm text-gray-500">Chargement…</div> : creditors.length === 0 ? <EmptyState title="Aucun créancier" description="Ajoutez votre premier créancier ci-dessus." /> : <div className="max-h-[620px] overflow-y-auto">{creditors.map((creditor) => <button key={creditor._id} onClick={() => void loadHistory(creditor._id)} className={`creditor-row w-full text-left p-4 border-b ${selected === creditor._id ? "is-selected" : ""}`}>
          <div className="flex items-center gap-2"><strong className="truncate">{creditor.name}</strong>{!creditor.isActive && <StatusBadge>Archivé</StatusBadge>}</div>
          <div className="mt-2 flex justify-between gap-3 text-xs text-gray-600"><span>Dette <b className="block text-gray-900">{money(creditor.remainingBalance)}</b></span><span className="text-right">Emprunté <b className="block text-gray-900">{money(creditor.totalBorrowed)}</b></span></div>
        </button>)}</div>}
      </Card>

      <div className="space-y-5">
        {!selected ? <Card><EmptyState title="Sélectionnez un créancier" description="Son historique et la saisie d’un nouvel emprunt apparaîtront ici." /></Card> : <>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><Landmark className="w-5 h-5 text-blue-700" /><h2 className="font-semibold">Nouvel emprunt</h2></div>
            <form onSubmit={addLoan} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div><label htmlFor="loan-amount" className="block mb-1.5">Montant *</label><input id="loan-amount" required type="number" min="0.01" step="0.01" className="w-full px-3 py-2" value={loan.enteredAmount} onChange={(e) => setLoan({ ...loan, enteredAmount: e.target.value })} /></div>
              <div><label htmlFor="loan-currency" className="block mb-1.5">Devise</label><select id="loan-currency" className="w-full px-3 py-2" value={loan.enteredCurrency} onChange={(e) => setLoan({ ...loan, enteredCurrency: e.target.value as LoanForm["enteredCurrency"] })}><option>USD</option><option>FC</option></select></div>
              <div><label htmlFor="loan-rate" className="block mb-1.5">Taux USD/FC {loan.enteredCurrency === "FC" && "*"}</label><input id="loan-rate" required={loan.enteredCurrency === "FC"} type="number" className="w-full px-3 py-2" value={loan.exchangeRate} onChange={(e) => setLoan({ ...loan, exchangeRate: e.target.value })} /></div>
              <div><label htmlFor="loan-date" className="block mb-1.5">Date</label><input id="loan-date" type="date" className="w-full px-3 py-2" value={loan.borrowedAt} onChange={(e) => setLoan({ ...loan, borrowedAt: e.target.value })} /></div>
              <div><label htmlFor="loan-reference" className="block mb-1.5">Référence</label><input id="loan-reference" className="w-full px-3 py-2" value={loan.reference} onChange={(e) => setLoan({ ...loan, reference: e.target.value })} /></div>
              <div className="flex items-end"><Button className="w-full" type="submit" disabled={confirmAction.busy}><Landmark className="w-4 h-4" />Enregistrer l'emprunt</Button></div>
            </form>
          </Card>
          {history && <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><ReceiptText className="w-5 h-5 text-gray-500" /><h2 className="font-semibold">Historique — {history.creditor.name}</h2></div>
            <div className="debt-kpis grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5"><div><span>Emprunté</span><strong>{money(history.reconciliation.borrowed)}</strong></div><div><span>Remboursé</span><strong>{money(history.reconciliation.repaid)}</strong></div><div><span>Solde actuel</span><strong>{money(history.reconciliation.storedOutstanding)}</strong></div></div>
            <div className="space-y-2">{history.loans.map((item) => <div key={item._id} className="debt-event"><span className="debt-event-icon is-loan"><Landmark /></span><div><strong>Emprunt · {money(item.amountUSD)}</strong><span><CalendarDays />{new Date(item.borrowedAt).toLocaleDateString("fr-FR")}</span></div></div>)}{history.repayments.map((item) => <div key={item._id} className="debt-event"><span className="debt-event-icon is-payment"><ReceiptText /></span><div><strong>Remboursement · {money(item.amountUSD)}</strong><StatusBadge tone={item.status === "validated" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status}</StatusBadge></div></div>)}</div>
          </Card>}
        </>}
      </div>
    </div>
    {confirmAction.dialog}
  </div>;
}
