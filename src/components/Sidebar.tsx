import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Languages, LogOut, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { formatDayGMT2, formatTimeGMT2 } from "../utils/dateUtils";
import { canAccessNavigationItem, isNavigationItemActive, navigationSections } from "../config/navigation";
import { roleLabel } from "../config/roles";
import { LanguageToggle } from "./LanguageToggle";



export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1180);
  const [now, setNow] = useState(new Date());
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const sections = useMemo(() => navigationSections
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccessNavigationItem(item, user)) }))
    .filter((section) => section.items.length), [user]);

  if (!token || !user) return null;
  const logout = () => { clearAuth(); window.location.href = "/login"; };

  return (
    <aside className={`desktop-tablet-sidebar app-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo"><img src="/newlogo.png" alt="" /></div>
        {!collapsed && <div className="sidebar-brand-copy"><strong>DOUBLE M</strong><span>Classic Boutique</span></div>}
        <button type="button" className="sidebar-collapse" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? t("navigation.expand") : t("navigation.collapse")}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      {!collapsed && <div className="sidebar-context" aria-label={t("navigation.localTime")}><Clock3 aria-hidden="true" /><div><strong>{formatTimeGMT2(now)}</strong><span>{formatDayGMT2(now)}</span></div></div>}
      <nav className="sidebar-nav" aria-label={t("navigation.main")}>
        {sections.map((section) => <section className="sidebar-section" key={section.titleKey}>
          {!collapsed && <h2>{t(section.titleKey)}</h2>}
          <ul>{section.items.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(location.pathname, item);
            return <li key={item.id}><Link to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} title={collapsed ? t(item.labelKey) : undefined}><Icon aria-hidden="true" />{!collapsed && <span>{t(item.labelKey)}</span>}</Link></li>;
          })}</ul>
        </section>)}
      </nav>
      <div className="sidebar-language">
        {!collapsed && <span><Languages aria-hidden="true" />{t("language.short")}</span>}
        <LanguageToggle tone="dark" />
      </div>
      <div className="sidebar-account">
        <div className="sidebar-avatar"><UserRound aria-hidden="true" /></div>
        {!collapsed && <div className="sidebar-user"><strong>{user.username}</strong><span>{roleLabel(user.role)}</span></div>}
        <button type="button" onClick={logout} title={t("navigation.logout")} aria-label={t("navigation.logout")}><LogOut /></button>
      </div>
    </aside>
  );
}
