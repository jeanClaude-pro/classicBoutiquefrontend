// User-facing role names, shared by the sidebar, the mobile menu and administration.
export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadministrateur",
  admin: "Actionnaire",
  manager: "Responsable",
  inventory_manager: "Gestionnaire de stock",
  cashier_supervisor: "Superviseur de caisse",
  staff: "Équipe de vente",
};

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role]) || role || "";
}
