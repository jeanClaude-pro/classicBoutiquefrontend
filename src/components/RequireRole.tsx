import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/auth";

export const RequireRole: React.FC<
  React.PropsWithChildren<{ roles: Role[] }>
> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="route-loading" role="status"><span className="route-loading-spinner" />{t("common.loading")}</div>;
  if (!user || !roles.includes(user.role))
    return (
      <div className="p-8">
        <h1 className="text-2xl font-black text-red-700">{t("system.accessDeniedTitle")}</h1>
        <p className="mt-2">{t("system.accessDenied")}</p>
      </div>
    );
  return <>{children}</>;
};
