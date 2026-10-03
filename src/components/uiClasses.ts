// Class-name helpers of the shared primitives (kept apart from ui.tsx so that
// file only exports components).
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/** Class names of a button, for links styled as buttons (router <Link>). */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = ""): string {
  return `ui-button ui-button--${variant}${size === "md" ? "" : ` ui-button--${size}`} ${className}`.trim();
}
