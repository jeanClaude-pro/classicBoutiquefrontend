// Shared, flat UI primitives of the DOUBLE M visual system. Styling lives in
// design-system.css (.ui-*); these components only add structure and a11y.
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonClass, type ButtonSize, type ButtonVariant } from "./uiClasses";

export function Button({
  variant = "primary", size = "md", loading = false, className = "", disabled, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="ui-button-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ui-card ${className}`} {...props} />; }

/** Page container with the shared padding and vertical rhythm. */
export function Page({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ui-page ${className}`} {...props} />; }

export function PageHeader({ title, description, actions, children }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ui-page-header">
      <div><h1>{title}</h1>{description && <p>{description}</p>}{children}</div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  );
}

export function SectionHeader({ title, description, actions, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <div className="ui-section-header">
      <div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </div>
  );
}

export function FilterBar({ className = "", ...props }: HTMLAttributes<HTMLElement>) { return <section className={`ui-filter-bar ${className}`} {...props} />; }

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";
export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) { return <span className={`ui-status ui-status--${tone}`}><span aria-hidden="true" />{children}</span>; }

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="ui-empty"><Inbox aria-hidden="true" /><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>; }

export function ErrorState({ message, action, onRetry }: { message: string; action?: ReactNode; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="ui-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong>{t("system.errorOccurred")}</strong>
        <p>{message}</p>
        {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>{t("common.retry")}</Button>}
        {action}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) { return <span className={`ui-skeleton ${className}`} aria-hidden="true" />; }
