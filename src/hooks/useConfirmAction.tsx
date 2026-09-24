import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { ConfirmDialog, type ConfirmDetail, type ConfirmVariant } from "../components/ConfirmDialog";
import { t } from "../i18n";
import { toApiError, type ApiError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notify";

export interface ConfirmActionRequest<T = unknown> {
  title: string;
  message?: ReactNode;
  details?: ConfirmDetail[];
  consequences?: string[];
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  reason?: { label: string; placeholder?: string; required?: boolean };
  /** Performs the mutation. Must throw (ideally an ApiError) on failure. */
  action: (reason: string) => Promise<T>;
  successMessage?: string | ((result: T) => string);
  /** Runs after a success, once the dialog is closed (e.g. refresh a list). */
  onSuccess?: (result: T) => void | Promise<void>;
  /** Runs after a failure; conflicts should refresh the data here. */
  onError?: (error: ApiError) => void | Promise<void>;
}

export interface ConfirmActionController {
  request: <T>(request: ConfirmActionRequest<T>) => void;
  busy: boolean;
  dialog: ReactElement;
}

/**
 * One confirmation workflow for every important action:
 * confirm → loading (button disabled, repeated clicks ignored) → request →
 * success toast + refresh, or an inline French error with the dialog still
 * usable. Nothing thrown by the action can escape into React rendering.
 */
export function useConfirmAction(): ConfirmActionController {
  const [current, setCurrent] = useState<ConfirmActionRequest<unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [reason, setReason] = useState("");
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const request = useCallback(<T,>(next: ConfirmActionRequest<T>) => {
    if (running.current) return;
    setCurrent(next as ConfirmActionRequest<unknown>);
    setError(null);
    setReason("");
  }, []);

  const cancel = useCallback(() => {
    if (running.current) return;
    setCurrent(null);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    const pending = current;
    if (!pending || running.current) return;
    if (pending.reason?.required && !reason.trim()) {
      setError({ title: t("system.missingInfo"), message: t("system.fieldRequired", { field: pending.reason.label }) });
      return;
    }
    running.current = true;
    setLoading(true);
    setError(null);
    // Follow-ups (list refreshes) run only after loading is released: a slow
    // or hanging refresh must never hold the dialog in its pending state.
    let followUp: (() => void | Promise<void>) | null = null;
    try {
      const result = await pending.action(reason.trim());
      if (!mounted.current) return;
      setCurrent(null);
      const success = typeof pending.successMessage === "function" ? pending.successMessage(result) : pending.successMessage;
      if (success) notifySuccess(success);
      if (pending.onSuccess) followUp = () => pending.onSuccess!(result);
    } catch (caught) {
      const apiError = toApiError(caught);
      if (import.meta.env.DEV) console.warn("[action failed]", pending.title, apiError.status, apiError.code ?? "", caught);
      if (mounted.current) setError({ title: apiError.title, message: apiError.message });
      if (pending.onError) followUp = () => pending.onError!(apiError);
    } finally {
      running.current = false;
      if (mounted.current) setLoading(false);
    }
    if (followUp) {
      try { await followUp(); } catch (followUpError) { notifyError(followUpError); }
    }
  }, [current, reason]);

  const dialog = (
    <ConfirmDialog
      open={current !== null}
      title={current?.title ?? ""}
      message={current?.message}
      details={current?.details}
      consequences={current?.consequences}
      confirmLabel={current?.confirmLabel ?? t("common.confirm")}
      pendingLabel={current?.pendingLabel}
      cancelLabel={error ? t("common.close") : current?.cancelLabel}
      variant={current?.variant}
      loading={loading}
      error={error}
      reason={current?.reason ? { ...current.reason, value: reason, onChange: setReason } : undefined}
      onConfirm={() => { void confirm(); }}
      onCancel={cancel}
    />
  );

  return { request, busy: loading, dialog };
}
