// User-facing role names, shared by the sidebar, the mobile menu and administration.
// The role ids are stored values; only their displayed names are translated.
import { t } from "../i18n/index.ts";

const ROLE_IDS = ["superadmin", "admin", "manager", "inventory_manager", "cashier_supervisor", "staff"] as const;

/** Read in the current language on every access. */
export const ROLE_LABELS: Record<string, string> = Object.defineProperties({} as Record<string, string>, Object.fromEntries(
  ROLE_IDS.map((role) => [role, { enumerable: true, get: () => t(`roles.${role}`) }]),
));

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role]) || role || "";
}
