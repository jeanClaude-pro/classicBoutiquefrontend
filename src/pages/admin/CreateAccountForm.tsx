import { useState, type FormEvent } from "react";
import { UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { serverUrl } from "../../utils/constants";
import { requestJson, toApiError } from "../../lib/apiError";
import { MODULES, PERMISSION_MODULE_IDS } from "../../config/modules";
import { ROLE_LABELS } from "../../config/roles";
import { SecretInput } from "../../components/SecretInput";

// Shareholder (admin) accounts can only read these modules (same rule as the server).
const SHAREHOLDER_MODULES = new Set(["/sales", "/reports", "/products"]);
const ROLE_CHOICES = ["staff", "cashier_supervisor", "inventory_manager", "manager", "admin:CLOTHES", "admin:SHOES", "superadmin"] as const;
type RoleChoice = typeof ROLE_CHOICES[number];

/**
 * Account creation, superadmin only (Administration > Users). This replaces
 * the public sign-up: an account exists only if a superadministrator creates
 * it here, with its role and modules. The server re-checks every rule.
 */
export function CreateAccountForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [choice, setChoice] = useState<RoleChoice>("staff");
  const [modules, setModules] = useState<string[]>(["/"]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [role, category] = choice.split(":") as [string, "CLOTHES" | "SHOES" | undefined];
  const grantable = PERMISSION_MODULE_IDS
    .map((id) => MODULES[id])
    .filter((module) => role !== "admin" || SHAREHOLDER_MODULES.has(module.path));

  const toggle = (path: string, on: boolean) =>
    setModules((current) => (on ? [...new Set([...current, path])] : current.filter((value) => value !== path)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (password.length < 10) { setError(t("admin.create.passwordTooShort")); return; }
    if (password !== confirm) { setError(t("admin.create.passwordMismatch")); return; }
    setSaving(true);
    try {
      await requestJson(`${serverUrl}/users`, {
        method: "POST",
        body: {
          username: username.trim(),
          email: email.trim(),
          password,
          role,
          ...(category ? { assignedCategory: category } : {}),
          permissions: role === "superadmin" ? [] : modules.filter((path) => role !== "admin" || SHAREHOLDER_MODULES.has(path)),
        },
      });
      setPassword("");
      setConfirm("");
      onCreated();
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  return (
    <form onSubmit={submit} autoComplete="off" className="border-b border-gray-100 bg-gray-50 px-5 py-5 space-y-4" aria-labelledby="create-account-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="create-account-title" className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            {t("admin.create.title")}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t("admin.create.hint")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t("common.cancel")} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium text-gray-700">
          {t("admin.create.username")}
          <input className={`${field} mt-1`} value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={80} autoComplete="off" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          {t("admin.create.email")}
          <input className={`${field} mt-1`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="off" data-lpignore="true" data-1p-ignore="true" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          {t("admin.create.password")}
          <SecretInput className={`${field} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} maxLength={128} />
          <span className="mt-1 block text-xs font-normal text-gray-500">{t("admin.create.passwordHint")}</span>
        </label>
        <label className="text-sm font-medium text-gray-700">
          {t("admin.create.confirmPassword")}
          <SecretInput className={`${field} mt-1`} value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={128} />
        </label>
        <label className="text-sm font-medium text-gray-700 sm:col-span-2">
          {t("admin.create.role")}
          <select className={`${field} mt-1`} value={choice} onChange={(e) => setChoice(e.target.value as RoleChoice)}>
            {ROLE_CHOICES.map((option) => {
              const [optionRole, optionCategory] = option.split(":");
              return (
                <option key={option} value={option}>
                  {ROLE_LABELS[optionRole]}{optionCategory ? ` · ${t(`accounting.categoryTitles.${optionCategory}`)}` : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {role !== "superadmin" && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">{t("admin.create.modules")}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {grantable.map((module) => (
              <label key={module.path} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                <input type="checkbox" checked={modules.includes(module.path)} onChange={(e) => toggle(module.path, e.target.checked)} />
                {t(module.labelKey)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">{t("common.cancel")}</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? t("admin.create.creating") : t("admin.create.submit")}
        </button>
      </div>
    </form>
  );
}
