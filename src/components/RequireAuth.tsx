import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const RequireAuth: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { token, user, offline, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // If not logged in, show toast once
  useEffect(() => {
    if (!loading && !token && !offline) {
      toast.error(t("system.loginRequired"), { toastId: "login-required" });
    }
  }, [loading, token, offline, t]);

  if (loading) return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading-spinner" /><span>{t("common.loading")}</span>
    </div>
  );
  if (!token && !offline)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (offline && !["/", "/new-sale", "/sales", "/offline-sales"].includes(location.pathname)) {
    return (
      <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-xl font-bold">{t("offline.restrictedTitle")}</h1>
        <p className="mt-2">{t("offline.restricted")}</p>
      </div>
    );
  }
  if (user?.role === "admin" && !user.permissions?.includes(location.pathname)) {
    return (
      <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-xl font-bold">{t("system.moduleNotAllowedTitle")}</h1>
        <p className="mt-2">{t("system.moduleNotAllowed")}</p>
      </div>
    );
  }
  return <>{children}</>;
};
