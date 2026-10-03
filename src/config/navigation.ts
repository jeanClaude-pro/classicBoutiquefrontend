import type { ComponentType } from "react";
import { BarChart3, CircleDollarSign, ClipboardList, Landmark, Package, Shield, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import type { User } from "../types/auth";
import { t } from "../i18n/index.ts";
import { MODULES, type ModuleDefinition, type ModuleId } from "./modules.ts";

export interface NavigationItem {
  id: string;
  /** Translation keys: render with t(labelKey) so a language switch updates the menu. */
  labelKey: string;
  shortLabelKey?: string;
  /** Current-language names (read on access). */
  readonly label: string;
  readonly shortLabel?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  path: string;
  badge?: number;
  roles?: string[];
  mobilePrimary?: boolean;
  /** Permission (module path) that grants this page when it is a sub-page
   *  of another module, e.g. the Fiche des ventes belongs to /reports. */
  permissionPath?: string;
}
export interface NavigationSection { titleKey: string; readonly title: string; items: NavigationItem[]; }

// Labels and paths come from the module registry; this file only decides
// grouping, icons, roles and which modules appear in the mobile tab bar.
const item = (id: ModuleId, icon: NavigationItem["icon"], roles: string[], mobilePrimary = false, permissionPath?: string): NavigationItem => {
  const module: ModuleDefinition = MODULES[id];
  return {
    id, labelKey: module.labelKey, shortLabelKey: module.shortLabelKey, path: module.path, icon, roles,
    get label() { return module.label; },
    get shortLabel() { return module.shortLabel; },
    ...(mobilePrimary ? { mobilePrimary } : {}),
    ...(permissionPath ? { permissionPath } : {}),
  };
};
const section = (titleKey: string, items: NavigationItem[]): NavigationSection => ({ titleKey, get title() { return t(titleKey); }, items });

const OPERATORS = ["superadmin", "manager", "cashier_supervisor", "inventory_manager"];

export const navigationSections: NavigationSection[] = [
  section("navigation.sections.operations", [
    item("pos", ShoppingCart, OPERATORS, true),
    item("sales", TrendingUp, ["superadmin", "admin", ...OPERATORS.slice(1)], true),
  ]),
  section("navigation.sections.inventory", [
    item("products", Package, ["superadmin", "admin", "manager", "inventory_manager"], true),
  ]),
  section("navigation.sections.finance", [
    item("entry", CircleDollarSign, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("sortie", Wallet, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("entryhistory", CircleDollarSign, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("historicsortie", Wallet, ["superadmin", "cashier_supervisor", "inventory_manager", "manager"]),
    item("rate", CircleDollarSign, ["superadmin"]),
    item("remboursements", Landmark, ["superadmin"]),
  ]),
  section("navigation.sections.management", [
    item("reports", BarChart3, ["superadmin", "admin"]),
    // Products sold in a period (the sales counterpart of the Fiche de stock).
    // Same access as Reports, whose permission it uses.
    item("productsSold", ClipboardList, ["superadmin", "admin"], false, "/reports"),
    item("customers", Users, ["superadmin", "manager", "cashier_supervisor"]),
    item("admin", Shield, ["superadmin"]),
  ]),
];

const fixedRolePaths = new Set(["/admin"]);
export function canAccessNavigationItem(item: NavigationItem, user: User | null): boolean {
  if (!item.roles) return true;
  if (!user?.role) return false;
  if (user.role === "superadmin") return item.roles.includes("superadmin");
  if (fixedRolePaths.has(item.path)) return item.roles.includes(user.role);
  const permission = item.permissionPath ?? item.path;
  if (user.role === "admin") {
    return item.roles.includes("admin") && Boolean(user.permissions?.includes(permission));
  }
  if (user.permissions && user.permissions.length > 0) return user.permissions.includes(permission);
  return item.roles.includes(user.role);
}
export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.id === "pos") return pathname === "/" || pathname === "/new-sale";
  if (pathname === item.path) return true;
  if (item.path === "/" || !pathname.startsWith(`${item.path}/`)) return false;
  // A sub-page highlights its module, unless it has its own menu entry.
  const ownEntry = navigationSections.some((section) => section.items.some((other) => other !== item && (pathname === other.path || pathname.startsWith(`${other.path}/`)) && other.path.length > item.path.length));
  return !ownEntry;
}
