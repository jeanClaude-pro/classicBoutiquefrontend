import type { ComponentType } from "react";
import { BarChart3, CalendarClock, CircleDollarSign, Landmark, Package, Shield, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import type { User } from "../types/auth";

export interface NavigationItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  path: string;
  badge?: number;
  roles?: string[];
  mobilePrimary?: boolean;
}
export interface NavigationSection { title: string; items: NavigationItem[]; }

export const navigationSections: NavigationSection[] = [
  { title: "Opérations", items: [
    { id: "pos", label: "Point de vente", shortLabel: "Vente", icon: ShoppingCart, path: "/", roles: ["superadmin", "manager", "cashier_supervisor", "inventory_manager"], mobilePrimary: true },
    { id: "reservation", label: "Nouvelle réservation", shortLabel: "Réserver", icon: CalendarClock, path: "/reservation", roles: ["superadmin", "manager", "cashier_supervisor", "inventory_manager"] },
    { id: "sales", label: "Historique des ventes", shortLabel: "Ventes", icon: TrendingUp, path: "/sales", roles: ["superadmin", "admin", "manager", "cashier_supervisor", "inventory_manager"], mobilePrimary: true },
    { id: "reservationhistory", label: "Réservations", icon: CalendarClock, path: "/reservationhistory", roles: ["superadmin", "manager", "cashier_supervisor", "inventory_manager"] },
  ]},
  { title: "Inventaire", items: [
    { id: "products", label: "Articles & stock", shortLabel: "Stock", icon: Package, path: "/products", roles: ["superadmin", "admin", "manager", "inventory_manager"], mobilePrimary: true },
  ]},
  { title: "Finance", items: [
    { id: "entry", label: "Entrée de caisse", shortLabel: "Entrée", icon: CircleDollarSign, path: "/entry", roles: ["superadmin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "sortie", label: "Sortie de caisse", icon: Wallet, path: "/sortie", roles: ["superadmin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "entryhistory", label: "Historique des entrées", icon: CircleDollarSign, path: "/entryhistory", roles: ["superadmin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "historicsortie", label: "Historique des sorties", icon: Wallet, path: "/sortiehistory", roles: ["superadmin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "rate", label: "Taux de change", shortLabel: "Taux", icon: CircleDollarSign, path: "/rate", roles: ["superadmin"] },
    { id: "remboursements", label: "Dettes & remboursements", shortLabel: "Dettes", icon: Landmark, path: "/remboursements", roles: ["superadmin"] },
  ]},
  { title: "Pilotage", items: [
    { id: "reports", label: "Rapports & analyses", icon: BarChart3, path: "/reports", roles: ["superadmin", "admin"] },
    { id: "customers", label: "Clients", icon: Users, path: "/customers", roles: ["superadmin", "manager", "cashier_supervisor"] },
    { id: "admin", label: "Administration", shortLabel: "Admin", icon: Shield, path: "/admin", roles: ["superadmin"] },
  ]},
];

const fixedRolePaths = new Set(["/admin"]);
export function canAccessNavigationItem(item: NavigationItem, user: User | null): boolean {
  if (!item.roles) return true;
  if (!user?.role) return false;
  if (user.role === "superadmin") return item.roles.includes("superadmin");
  if (fixedRolePaths.has(item.path)) return item.roles.includes(user.role);
  if (user.role === "admin") {
    return item.roles.includes("admin") && Boolean(user.permissions?.includes(item.path));
  }
  if (user.permissions && user.permissions.length > 0) return user.permissions.includes(item.path);
  return item.roles.includes(user.role);
}
export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.id === "pos") return pathname === "/" || pathname === "/new-sale";
  return pathname === item.path;
}
