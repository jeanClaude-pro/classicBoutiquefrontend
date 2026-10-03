import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { enableOfflineAccess } from "../offline/offlineAuth";
import { offlineDb } from "../offline/db";

export function OfflineAccessSetup() {
  const { user, token, offline } = useAuth();
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    void offlineDb.authProfiles.get(user.id).then((profile) => setEnabled(Boolean(profile?.enabled)));
  }, [user]);
  if (!user || !token || offline || enabled) return null;
  const save = async () => {
    setError("");
    try { await enableOfflineAccess(user, pin); setEnabled(true); setOpen(false); }
    catch { setError(t("offline.pinLength")); }
  };
  return <div className="mx-4 mt-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 sm:mx-6">
    {!open ? <div className="flex flex-wrap items-center justify-between gap-2"><span>{t("offline.enablePrompt")}</span><button className="ui-button ui-button--primary ui-button--sm" onClick={() => setOpen(true)}>{t("offline.enable")}</button></div>
      : <div className="flex flex-wrap items-end gap-2"><label className="min-w-48 flex-1"><span className="mb-1 block font-semibold">{t("offline.choosePin")}</span><input className="w-full rounded-lg border border-gray-300 px-3 py-2" inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 12))} /></label><button className="ui-button ui-button--primary" onClick={() => void save()}><KeyRound className="mr-1 inline h-4 w-4" />{t("pos.save")}</button>{error && <span className="w-full text-red-700">{error}</span>}</div>}
  </div>;
}
