import { toast } from "react-toastify";
import { toApiError } from "./apiError";

// One notification style for the whole application: short success toasts,
// titled error toasts with a French explanation. No blocking alerts.

export function notifySuccess(message: string): void {
  toast.success(message, { autoClose: 3500 });
}

export function notifyInfo(message: string): void {
  toast.info(message, { autoClose: 4000 });
}

export function notifyError(error: unknown, fallbackTitle?: string): void {
  const apiError = toApiError(error);
  toast.error(
    <div>
      <strong className="block">{fallbackTitle && apiError.status === -1 ? fallbackTitle : apiError.title}</strong>
      <span className="block whitespace-pre-line text-sm">{apiError.message}</span>
    </div>,
    { autoClose: apiError.isNetwork ? 6000 : 5000 },
  );
}
