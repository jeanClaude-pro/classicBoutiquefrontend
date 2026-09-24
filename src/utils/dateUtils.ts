/**
 * GMT+2 (Central Africa Time) display utilities.
 * Use these functions for ALL visible date/time rendering in the UI.
 * Do NOT use these for business logic, API params, or stored values.
 */

// UTC+2, no DST — official business timezone for Lubumbashi.
const GMT2_TZ = "Africa/Lubumbashi";

/** Short date: "12 janv. 2025" */
export const formatDateGMT2 = (input: string | Date | null | undefined): string => {
  if (!input) return '—';
  try {
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: GMT2_TZ,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

/** Date + time: "12 janv. 2025 à 14:30" */
export const formatDateTimeGMT2 = (input: string | Date | null | undefined): string => {
  if (!input) return '—';
  try {
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: GMT2_TZ,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
};

/** Time only: "14:30" */
export const formatTimeGMT2 = (date: Date): string => {
  return date.toLocaleTimeString('fr-FR', {
    timeZone: GMT2_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** Full day label: "lundi 12 janvier" */
export const formatDayGMT2 = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    timeZone: GMT2_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/**
 * Current date/time as a locale string for receipts/prints.
 * Returns: "12/01/2025 14:30"
 */
export const formatNowGMT2 = (): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: GMT2_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
};

/** Month name from index (0–11): "janvier" */
export const formatMonthNameGMT2 = (monthIndex: number): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: GMT2_TZ,
    month: 'long',
  }).format(new Date(2000, monthIndex, 15));
};

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-09-24" → "24/09/2026"; anything else is returned unchanged. */
const frenchDay = (value: string): string => {
  const match = value.trim().match(ISO_DAY);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value.trim();
};

/**
 * The list endpoints describe their period in English with a fixed format
 * ("Today (default)", "Day: …", "Month: YYYY-MM", "Year: …",
 * "Custom range: A to B", "All history"). Shown to users in French.
 */
export const describeTimeframeFr = (description: string | null | undefined): string => {
  const text = (description || "").trim();
  if (!text || /^today/i.test(text)) return "Aujourd'hui";
  if (/^all history$/i.test(text)) return "Tout l'historique";
  let match = text.match(/^day:\s*(.+)$/i);
  if (match) return `Journée du ${frenchDay(match[1])}`;
  match = text.match(/^month:\s*(\d{4})-(\d{1,2})$/i);
  if (match) {
    const month = formatMonthNameGMT2(Number(match[2]) - 1);
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${match[1]}`;
  }
  match = text.match(/^year:\s*(\d{4})$/i);
  if (match) return `Année ${match[1]}`;
  match = text.match(/^custom range:\s*(.+?)\s+to\s+(.+)$/i);
  if (match) {
    const from = /^beginning$/i.test(match[1]) ? null : frenchDay(match[1]);
    const to = /^now$/i.test(match[2]) ? null : frenchDay(match[2]);
    if (from && to) return `Du ${from} au ${to}`;
    if (from) return `Depuis le ${from}`;
    if (to) return `Jusqu'au ${to}`;
    return "Tout l'historique";
  }
  return text;
};
