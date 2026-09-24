// Single source of truth for user-facing module names. Sidebar, mobile
// navigation, the "Plus" sheet, page headers and the permission editor all
// read from here, so one module can never carry several names.
// Paths and ids stay stable: they are stored in user permissions.

export interface ModuleDefinition {
  id: string;
  path: string;
  /** Canonical name used everywhere a module is listed. */
  label: string;
  /** Compact name for the mobile tab bar only. */
  shortLabel?: string;
  /** One short sentence explaining what the page actually does. */
  description: string;
}

export const MODULES = {
  pos: { id: "pos", path: "/", label: "Point de vente", shortLabel: "Vente", description: "Enregistrez une vente encaissée et imprimez le reçu du client." },
  reservation: { id: "reservation", path: "/reservation", label: "Nouvelle réservation", shortLabel: "Réserver", description: "Réservez des articles pour un client. Le stock est bloqué immédiatement ; la vente est comptabilisée lorsque la réservation est terminée." },
  sales: { id: "sales", path: "/sales", label: "Historique des ventes", shortLabel: "Ventes", description: "Consultez, corrigez ou annulez les ventes enregistrées." },
  reservationhistory: { id: "reservationhistory", path: "/reservationhistory", label: "Suivi des réservations", shortLabel: "Réservations", description: "Terminez, modifiez ou supprimez les réservations en attente et consultez celles déjà remises." },
  products: { id: "products", path: "/products", label: "Articles & stock", shortLabel: "Stock", description: "Gérez les articles, leurs prix, leur coût d'achat et le stock disponible." },
  entry: { id: "entry", path: "/entry", label: "Entrée de caisse", shortLabel: "Entrée", description: "Enregistrez l'argent reçu en dehors des ventes." },
  sortie: { id: "sortie", path: "/sortie", label: "Décaissements", shortLabel: "Décaisser", description: "Enregistrez une dépense de l'entreprise, un achat de marchandises ou un remboursement de dette." },
  entryhistory: { id: "entryhistory", path: "/entryhistory", label: "Historique des entrées", description: "Consultez, corrigez ou supprimez les entrées de caisse enregistrées." },
  historicsortie: { id: "historicsortie", path: "/sortiehistory", label: "Historique des décaissements", description: "Suivez, validez ou rejetez les décaissements et consultez leur statut." },
  rate: { id: "rate", path: "/rate", label: "Taux de change", shortLabel: "Taux", description: "Définissez le taux USD → FC appliqué aux nouvelles opérations. Les opérations passées gardent leur taux." },
  remboursements: { id: "remboursements", path: "/remboursements", label: "Dettes & emprunts", shortLabel: "Dettes", description: "Suivez les créanciers, les emprunts reçus et le solde restant dû. Les remboursements se saisissent dans Décaissements." },
  reports: { id: "reports", path: "/reports", label: "Rapports & analyses", shortLabel: "Rapports", description: "Analysez les ventes, la rentabilité par catégorie et les fonds de réapprovisionnement." },
  customers: { id: "customers", path: "/customers", label: "Clients", description: "Consultez les clients et leurs achats. Un client est créé automatiquement lors d'une vente avec ses coordonnées." },
  admin: { id: "admin", path: "/admin", label: "Administration", shortLabel: "Admin", description: "Gérez les comptes utilisateurs, leurs droits et les réglages du reçu." },
} as const satisfies Record<string, ModuleDefinition>;

export type ModuleId = keyof typeof MODULES;

/** Modules whose access can be granted per user in the permission editor. */
export const PERMISSION_MODULE_IDS: ModuleId[] = [
  "pos", "reservation", "sales", "reservationhistory", "products", "entry", "sortie",
  "entryhistory", "historicsortie", "rate", "reports", "customers",
];

export function moduleForPath(path: string): ModuleDefinition | undefined {
  return Object.values(MODULES).find((module) => module.path === path);
}
