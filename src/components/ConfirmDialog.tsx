import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

export type ConfirmVariant = "primary" | "danger" | "warning";

export interface ConfirmDetail {
  label: string;
  value: ReactNode;
}

export interface ConfirmReasonField {
  label: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  details?: ConfirmDetail[];
  consequences?: string[];
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  disabled?: boolean;
  error?: { title: string; message: string } | null;
  reason?: ConfirmReasonField;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT = {
  primary: { icon: CheckCircle2, iconClass: "bg-emerald-100 text-emerald-700", button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500" },
  warning: { icon: Info, iconClass: "bg-amber-100 text-amber-700", button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500" },
  danger: { icon: AlertTriangle, iconClass: "bg-red-100 text-red-700", button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500" },
} as const;

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open, title, message, details, consequences, confirmLabel, pendingLabel, cancelLabel = "Annuler",
  variant = "primary", loading = false, disabled = false, error, reason, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const reasonId = useId();
  const latest = useRef({ loading, onCancel });
  latest.current = { loading, onCancel };

  // Focus management: remember the trigger, focus the safest control, restore on close.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const target = reason ? reasonRef.current : variant === "danger" ? cancelRef.current : confirmRef.current;
    target?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      const trigger = returnFocusRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
    // Focus is chosen once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!latest.current.loading) latest.current.onCancel();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Disabled buttons lose focus while the action runs; bring it back inside.
  useEffect(() => {
    if (!open || loading || !panelRef.current) return;
    if (!panelRef.current.contains(document.activeElement)) (error ? cancelRef.current : confirmRef.current)?.focus();
  }, [open, loading, error]);

  if (!open || typeof document === "undefined") return null;
  const style = VARIANT[variant];
  const Icon = style.icon;
  const reasonMissing = Boolean(reason?.required && !reason.value.trim());

  return createPortal(
    <div className="confirm-dialog-layer notranslate" translate="no" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}>
      <div
        ref={panelRef}
        className="confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        aria-busy={loading || undefined}
      >
        <div className="confirm-dialog-header">
          <span className={`confirm-dialog-icon ${style.iconClass}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="confirm-dialog-close" onClick={onCancel} disabled={loading} aria-label="Fermer la fenêtre"><X className="h-5 w-5" /></button>
        </div>

        <div className="confirm-dialog-body" id={bodyId}>
          {message && <div className="text-sm leading-relaxed text-gray-700">{message}</div>}
          {details && details.length > 0 && (
            <dl className="confirm-dialog-details">
              {details.map((detail) => (
                <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>
              ))}
            </dl>
          )}
          {consequences && consequences.length > 0 && (
            <ul className="confirm-dialog-consequences">
              {consequences.map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
          {reason && (
            <div className="mt-4">
              <label htmlFor={reasonId} className="mb-1.5 block text-sm font-medium text-gray-800">
                {reason.label}{reason.required && " *"}
              </label>
              <textarea
                id={reasonId}
                ref={reasonRef}
                rows={3}
                value={reason.value}
                placeholder={reason.placeholder}
                onChange={(event) => reason.onChange(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {error && (
            <div className="confirm-dialog-error" role="alert">
              <strong>{error.title}</strong>
              <p>{error.message}</p>
            </div>
          )}
        </div>

        <div className="confirm-dialog-actions">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="confirm-dialog-cancel">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading || disabled || reasonMissing}
            aria-label={loading ? pendingLabel ?? `${confirmLabel}…` : confirmLabel}
            className={`confirm-dialog-confirm ${style.button}`}
          >
            {/* Keep the child structure stable while pending. Browser translation
                tools can replace raw text nodes; inserting a spinner before such
                a replaced node makes ReactDOM throw NotFoundError/insertBefore. */}
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : "hidden"}`} aria-hidden="true" />
            <span data-confirm-label="idle" hidden={loading}>{confirmLabel}</span>
            <span data-confirm-label="pending" hidden={!loading}>{pendingLabel ?? `${confirmLabel}…`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
