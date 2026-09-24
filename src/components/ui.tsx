import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) { return <button className={`ui-button ui-button--${variant} ${className}`} {...props} />; }
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ui-card ${className}`} {...props} />; }
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) { return <header className="ui-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ui-page-actions">{actions}</div>}</header>; }
export function StatusBadge({ tone = "neutral", children }: { tone?: "success" | "warning" | "danger" | "info" | "neutral"; children: ReactNode }) { return <span className={`ui-status ui-status--${tone}`}><span aria-hidden="true" />{children}</span>; }
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="ui-empty"><Inbox aria-hidden="true" /><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>; }
export function ErrorState({ message, action }: { message: string; action?: ReactNode }) { const { t } = useTranslation(); return <div className="ui-error" role="alert"><AlertCircle aria-hidden="true" /><div><strong>{t("system.errorOccurred")}</strong><p>{message}</p>{action}</div></div>; }
export function Skeleton({ className = "" }: { className?: string }) { return <span className={`ui-skeleton ${className}`} aria-hidden="true" />; }
