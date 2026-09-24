import React, { useState, useEffect } from 'react';
import { formatDateTimeGMT2 } from "../utils/dateUtils";
import { serverUrl } from "../utils/constants";
import { requestJson } from "../lib/apiError";
import { exchangeRateCopy } from "../lib/confirmationCopy";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { MODULES } from "../config/modules";
import { 
  DollarSign, 
  RefreshCw, 
  History, 
  Save, 
  Edit, 
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TauxChange {
  _id: string;
  rate: number;
  effectiveFrom: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoriqueTaux {
  _id: string;
  rate: number;
  effectiveFrom: string;
  createdBy: {
    username: string;
    email: string;
  };
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

const API_BASE = serverUrl;

export default function TauxChange() {
  const [tauxActuel, setTauxActuel] = useState<TauxChange | null>(null);
  const [historiqueTaux, setHistoriqueTaux] = useState<HistoriqueTaux[]>([]);
  const [loading, setLoading] = useState(true);
  const confirmAction = useConfirmAction();
  const submitting = confirmAction.busy;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire
  const [form, setForm] = useState({
    rate: '',
    effectiveFrom: '',
    notes: ''
  });

  // Charger le taux actuel et l'historique
  const chargerTaux = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le taux actuel
      const reponseActuel = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (reponseActuel.ok) {
        const donneesActuel = await reponseActuel.json();
        // The endpoint returns a flat object whose `rate` is the number itself.
        setTauxActuel(typeof donneesActuel?.rate === "number" && donneesActuel.rate > 0 ? donneesActuel : null);
      } else {
        console.warn('Aucun taux actuel trouvé ou erreur de chargement');
        setTauxActuel(null);
      }

      // Charger l'historique des taux
      const reponseHistorique = await fetch(`${API_BASE}/exchange-rates/history?limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (reponseHistorique.ok) {
        const donneesHistorique = await reponseHistorique.json();
        setHistoriqueTaux(donneesHistorique.history || donneesHistorique || []);
      } else if (reponseHistorique.status === 403) {
        setError('Vous n\'avez pas la permission de voir l\'historique des taux');
      } else {
        setHistoriqueTaux([]);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des taux:', error);
      setError('Échec du chargement des taux de change');
      setTauxActuel(null);
      setHistoriqueTaux([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerTaux();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(form.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Veuillez entrer un taux de change valide');
      return;
    }
    setError(null);
    setMessage(null);
    confirmAction.request({
      ...exchangeRateCopy(rate, tauxActuel?.rate),
      action: () => requestJson(`${API_BASE}/exchange-rates`, {
        method: "POST",
        body: { rate, effectiveFrom: form.effectiveFrom || new Date().toISOString(), notes: form.notes },
      }),
      onSuccess: async () => {
        setForm({ rate: '', effectiveFrom: '', notes: '' });
        await chargerTaux();
      },
    });
  };

  const formaterDate = (dateString: string) => {
    const result = formatDateTimeGMT2(dateString);
    return result === '—' ? 'Date invalide' : result;
  };

  const formaterMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des taux de change...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                {MODULES.rate.label}
              </h1>
              <p className="text-gray-600 mt-2">
                {MODULES.rate.description}
              </p>
            </div>
            <button
              onClick={chargerTaux}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{message}</p>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Taux actuel et formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte du taux actuel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Taux de Change Actuel
                </h2>
                {tauxActuel?.isActive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </span>
                )}
              </div>

              {tauxActuel ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Taux FC → USD</p>
                      <p className="text-2xl font-bold text-blue-800">
                        1 USD = {formaterMontant(tauxActuel.rate)} FC
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Taux USD → FC</p>
                      <p className="text-2xl font-bold text-green-800">
                        1 FC = {new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 3 }).format(1 / tauxActuel.rate)} USD
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Effectif depuis: {formaterDate(tauxActuel.effectiveFrom)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Défini par: {tauxActuel.createdBy?.username || 'Inconnu'}</span>
                    </div>
                  </div>

                  {tauxActuel.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{tauxActuel.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun taux de change actif</p>
                  <p className="text-sm">Veuillez définir un taux de change</p>
                </div>
              )}
            </div>

            {/* Formulaire de mise à jour */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-600" />
                Mettre à Jour le Taux de Change
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rate-nouveau-taux" className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau Taux (1 USD = X FC) *
                    </label>
                    <input
                      id="rate-nouveau-taux"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      placeholder="Ex: 2500 pour 1 USD = 2500 FC"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Entrez combien de Francs Congolais valent 1 USD
                    </p>
                  </div>

                  <div>
                    <label htmlFor="rate-date-d-effet" className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'Effet
                    </label>
                    <input
                      id="rate-date-d-effet"
                      type="datetime-local"
                      value={form.effectiveFrom}
                      onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Laisser vide pour utiliser la date actuelle
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="rate-notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optionnel)
                  </label>
                  <textarea
                    id="rate-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Raison du changement, source du taux, etc."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.rate}
                  className={`w-full md:w-auto px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    submitting || !form.rate
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } transition-colors`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Appliquer le nouveau taux
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Colonne de droite - Historique */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                Historique des Taux
              </h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {historiqueTaux.length} entrées
              </span>
            </div>

            {historiqueTaux.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historiqueTaux.map((taux) => (
                  <div
                    key={taux._id}
                    className={`p-3 rounded-lg border ${
                      taux.isActive
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          1 USD = {formaterMontant(taux.rate)} FC
                        </span>
                        {taux.isActive && (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formaterDate(taux.effectiveFrom)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Par: {taux.createdBy?.username || 'Inconnu'}</span>
                      <span>{formaterDate(taux.createdAt)}</span>
                    </div>
                    {taux.notes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {taux.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun historique disponible</p>
                <p className="text-sm">Les changements de taux apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>

        {/* Section d'information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Comment utiliser les taux de change
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-2">Pour les ventes en FC:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Les prix saisis en FC seront convertis en USD</li>
                <li>Le système utilise toujours le taux actif</li>
                <li>Bien faire attention avant de definir un nouveau taux</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Bonnes pratiques:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Mettez à jour le taux régulièrement</li>
                <li>Notez la source du taux (banque, marché, etc.)</li>
                <li>Un seul taux peut être actif à la fois</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {confirmAction.dialog}
    </div>
  );
}
