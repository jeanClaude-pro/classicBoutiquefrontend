// Single source of truth for user-facing module names. Sidebar, mobile
// navigation, the "Plus" sheet, page headers and the permission editor all
// read from here, so one module can never carry several names.
// Paths and ids stay stable: they are stored in user permissions.
// Names live in the dictionaries (modules.<id>.*); `label`, `shortLabel` and
// `description` are read in the current language each time they are used.
import { t } from "../i18n/index.ts";

export interface ModuleDefinition {
  id: string;
  path: string;
  labelKey: string;
  shortLabelKey?: string;
  descriptionKey: string;
  /** Canonical name used everywhere a module is listed. */
  readonly label: string;
  /** Compact name for the mobile tab bar only. */
  readonly shortLabel?: string;
  /** One short sentence explaining what the page actually does. */
  readonly description: string;
}

function defineModule(id: string, path: string, hasShortLabel: boolean): ModuleDefinition {
  const labelKey = `modules.${id}.label`;
  const shortLabelKey = hasShortLabel ? `modules.${id}.short` : undefined;
  const descriptionKey = `modules.${id}.description`;
  return {
    id, path, labelKey, shortLabelKey, descriptionKey,
    get label() { return t(labelKey); },
    get shortLabel() { return shortLabelKey ? t(shortLabelKey) : undefined; },
    get description() { return t(descriptionKey); },
  };
}

export const MODULES = {
  pos: defineModule("pos", "/", true),
  sales: defineModule("sales", "/sales", true),
  products: defineModule("products", "/products", true),
  entry: defineModule("entry", "/entry", true),
  sortie: defineModule("sortie", "/sortie", true),
  entryhistory: defineModule("entryhistory", "/entryhistory", false),
  historicsortie: defineModule("historicsortie", "/sortiehistory", false),
  rate: defineModule("rate", "/rate", true),
  remboursements: defineModule("remboursements", "/remboursements", true),
  reports: defineModule("reports", "/reports", true),
  customers: defineModule("customers", "/customers", false),
  admin: defineModule("admin", "/admin", true),
} satisfies Record<string, ModuleDefinition>;

export type ModuleId = keyof typeof MODULES;

/** Modules whose access can be granted per user in the permission editor. */
export const PERMISSION_MODULE_IDS: ModuleId[] = [
  "pos", "sales", "products", "entry", "sortie",
  "entryhistory", "historicsortie", "rate", "reports", "customers",
];

export function moduleForPath(path: string): ModuleDefinition | undefined {
  return Object.values(MODULES).find((module) => module.path === path);
}
