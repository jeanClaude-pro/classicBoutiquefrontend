import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { SaleCurrency } from "../utils/salePricing";

interface UnitPriceInputProps {
  id: string;
  /** The line's current unit price in `currency`. */
  value: number;
  currency: SaleCurrency;
  ariaLabel: string;
  /** Error for this line coming from the server (e.g. "Prix trop bas…"). */
  error?: string | null;
  disabled?: boolean;
  /** Width classes of the input (defaults to a compact cart cell). */
  className?: string;
  onCommit: (value: number) => void;
}

const displayValue = (value: number, currency: SaleCurrency) =>
  currency === "FC" ? String(Math.round(value)) : String(Number(value.toFixed(2)));

// An FC amount is a whole number of francs and a USD amount has at most two
// decimals: anything else would be displayed differently from what was typed.
function parseUnitPrice(text: string, currency: SaleCurrency): number | "invalid" {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return "invalid";
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return "invalid";
  if (currency === "FC" && !Number.isInteger(amount)) return "invalid";
  if (currency === "USD" && Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-9) return "invalid";
  return amount;
}

/**
 * Unit-price editor for one cart/sale line. While focused it only holds a
 * local draft string, so the field can be cleared and retyped without the line
 * being re-priced on every keystroke; the price is committed on blur or Enter
 * (Escape cancels). Rendered by React only — no DOM is touched directly.
 */
export default function UnitPriceInput({ id, value, currency, ariaLabel, error, disabled, className = "w-28", onCommit }: UnitPriceInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const initial = useRef("");
  const cancelled = useRef(false);
  const shown = draft ?? displayValue(value, currency);
  const message = invalid ? t(currency === "FC" ? "pos.invalidFcPrice" : "pos.invalidUsdPrice") : error;
  const messageId = `${id}-error`;

  const commit = () => {
    if (draft === null) return;
    const text = draft;
    setDraft(null);
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    // Unchanged, or emptied and left: the line keeps its current price.
    if (text.trim() === initial.current || text.trim() === "") return;
    const amount = parseUnitPrice(text, currency);
    if (amount === "invalid") {
      setInvalid(true);
      return;
    }
    onCommit(amount);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      cancelled.current = true;
      event.currentTarget.blur();
    }
  };

  return (
    <div className="unit-price-input">
      <div className="flex items-center justify-end gap-1">
        <input
          id={id}
          type="text"
          inputMode={currency === "FC" ? "numeric" : "decimal"}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          value={shown}
          disabled={disabled}
          onFocus={() => {
            const current = displayValue(value, currency);
            initial.current = current;
            cancelled.current = false;
            setInvalid(false);
            setDraft(current);
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`min-w-0 rounded-md border px-2 py-1.5 text-right tabular-nums ${message ? "border-red-500 bg-red-50" : "border-gray-300"} ${className}`}
        />
        <span className="text-xs font-medium text-gray-600">{currency}</span>
      </div>
      {message && (
        <p id={messageId} role="alert" className="mt-1 text-xs text-red-600 text-right">
          {message}
        </p>
      )}
    </div>
  );
}
