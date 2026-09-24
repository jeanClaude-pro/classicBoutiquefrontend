import type { ComponentType } from "react";
import { BarChart3, CalendarClock, CircleDollarSign, Landmark, Package, Shield, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import type { User } from "../types/auth";
import { MODULES, type ModuleDefinition, type ModuleId } from "./modules.ts";

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

// Labels and paths come from the module registry; this file only decides
// grouping, icons, roles and which modules appear in the mobile tab bar.
const item = (id: ModuleId, icon: NavigationItem["icon"], roles: string[], mobilePrimary = false): NavigationItem => {
  const module: ModuleDefinition = MODULES[id];
  return { id, label: module.label, shortLabel: module.shortLabel, path: module.path, icon, roles, ...(mobilePrimary ? { mobilePrimary } : {}) };
};

const OPERATORS = ["superadmin", "manager", "cashier_supervisor", "inventory_manager"];

export const navigationSections: NavigationSection[] = [
  { title: "Opérations", items: [
    item("pos", ShoppingCart, OPERATORS, true),
    item("reservation", CalendarClock, OPERATORS),
    item("sales", TrendingUp, ["superadmin", "admin", ...OPERATORS.slice(1)], true),
    item("reservationhistory", CalendarClock, OPERATORS),
  ]},
  { title: "Inventaire", items: [
    item("products", Package, ["superadmin", "admin", "manager", "inventory_manager"], true),
  ]},
  { title: "Finance", items: [
    item("entry", CircleDollarSign, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("sortie", Wallet, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("entryhistory", CircleDollarSign, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("historicsortie", Wallet, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("rate", CircleDollarSign, ["superadmin"]),
    item("remboursements", Landmark, ["superadmin"]),
  ]},
  { title: "Pilotage", items: [
    item("reports", BarChart3, ["superadmin", "admin"]),
    item("customers", Users, ["superadmin", "manager", "cashier_supervisor"]),
    item("admin", Shield, ["superadmin"]),
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
