import { useTranslation } from "react-i18next";
import { changeAppLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from "../i18n";

// Each language is named in its own language, whatever the interface language.
const NATIVE_NAMES: Record<AppLanguage, string> = { fr: "Français", en: "English" };

/**
 * FR | EN switch. Every instance drives the same global i18n state; the choice
 * is saved and applied immediately without reloading or remounting anything.
 */
export function LanguageToggle({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { t, i18n } = useTranslation();
  const active: AppLanguage = i18n.language === "en" ? "en" : "fr";

  return (
    <div className={`language-toggle is-${tone} ${className}`} role="group" aria-label={t("language.label")}>
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          className={active === language ? "is-active" : ""}
          aria-pressed={active === language}
          aria-label={NATIVE_NAMES[language]}
          title={NATIVE_NAMES[language]}
          onClick={() => { if (language !== active) void changeAppLanguage(language); }}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
