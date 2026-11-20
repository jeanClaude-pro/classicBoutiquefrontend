import { useState, type FormEvent } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmPassword } from "../lib/reportsReauth";

/**
 * Password confirmation screen of the Reports module. The password is checked
 * by the server (POST /auth/reauth), which returns a short proof that the
 * reports API requires; nothing here can be skipped by editing the page.
 */
export function ReauthGate({ onConfirmed }: { onConfirmed: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await confirmPassword(password);
      if (result === "confirmed") {
        setPassword("");
        onConfirmed();
        return;
      }
      setPassword("");
      setError(t(result === "locked" ? "reports.reauth.locked" : result === "unavailable" ? "reports.reauth.unavailable" : "reports.wrongPasswordAccess"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t("reports.verificationRequired")}</h2>
          <p className="text-gray-500 text-sm mt-1">{t("reports.enterPassword")}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="analytics-mot-de-passe" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("reports.adminPassword")}
            </label>
            <input
              id="analytics-mot-de-passe"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder={t("reports.passwordPlaceholder")}
              autoFocus
              required
            />
          </div>
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {busy ? t("reports.verifying") : t("reports.access")}
          </button>
        </form>
      </div>
    </div>
  );
}
