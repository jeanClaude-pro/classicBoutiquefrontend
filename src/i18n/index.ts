// Application language. The dictionaries are bundled with the app (no
// network, works offline in the PWA). The language the user picks with the
// FR/EN toggle is stored under `appLanguage` and always wins: there is no
// browser-language detection that could switch it back.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };

export const APP_LANGUAGE_KEY = "appLanguage";
export const DEFAULT_LANGUAGE = "fr";
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "fr" || value === "en";
}

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage can be blocked (private mode, disabled site data)
  }
}

/** The saved choice, or French when nothing valid is saved. */
export function readStoredLanguage(storage: Pick<Storage, "getItem"> | null = browserStorage()): AppLanguage {
  try {
    const value = storage?.getItem(APP_LANGUAGE_KEY);
    return isAppLanguage(value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function applyDocumentLanguage(language: AppLanguage): void {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

const initialLanguage = readStoredLanguage();

// Synchronous init: resources are inline, so translations are ready before
// the first render and in non-React code (tests, PDF generation).
void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});
applyDocumentLanguage(initialLanguage);

export function currentLanguage(): AppLanguage {
  return i18n.language === "en" ? "en" : "fr";
}

/** Locale for displayed dates and numbers. Stored values never depend on it. */
export function currentLocale(): "fr-FR" | "en-US" {
  return currentLanguage() === "en" ? "en-US" : "fr-FR";
}

/**
 * The only way the language changes: an explicit user choice. Updates every
 * mounted component in place (no reload, no remount) and remembers the choice.
 */
export function changeAppLanguage(language: AppLanguage): Promise<unknown> {
  try { browserStorage()?.setItem(APP_LANGUAGE_KEY, language); } catch { /* storage unavailable: still switch */ }
  applyDocumentLanguage(language);
  return i18n.changeLanguage(language);
}

// Another tab or window of the app (e.g. the installed PWA) changed the
// language: follow it so both stay on the user's choice.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== APP_LANGUAGE_KEY || !isAppLanguage(event.newValue) || event.newValue === currentLanguage()) return;
    applyDocumentLanguage(event.newValue);
    void i18n.changeLanguage(event.newValue);
  });
}

/** Translation for code outside React components (helpers, PDFs, errors). */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options) as string;
}

export default i18n;
