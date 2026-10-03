// Row "Actions ▾" menu. A menu button (WAI-ARIA menu pattern): Enter/Space or
// ArrowDown opens it on the first item, ArrowUp on the last; arrows, Home and
// End move between items; Escape or Tab closes it and focus returns to the
// trigger. The list is fixed-positioned and clamped so it never leaves the
// viewport or sits under the phone tab bar. Availability of each action is
// decided by the caller (permissions are unchanged).
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Router destination: rendered as a link. */
  to?: string;
  onSelect?: () => void;
  danger?: boolean;
  /** Accessible name when the visible label is not specific enough. */
  ariaLabel?: string;
}

const PHONE_TAB_BAR = 76;

export function ActionMenu({ items, label, triggerLabel }: { items: ActionMenuItem[]; label?: string; triggerLabel?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusIndex = useRef(0);
  const menuId = useId();
  const visible = items.filter(Boolean);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const itemElements = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const focusItem = (index: number) => {
    const elements = itemElements();
    if (!elements.length) return;
    focusIndex.current = (index + elements.length) % elements.length;
    elements[focusIndex.current].focus();
  };

  function openMenu(startAt: "first" | "last") {
    focusIndex.current = startAt === "first" ? 0 : visible.length - 1;
    setOpen(true);
  }

  // Place the list under (or above) the trigger, inside the viewport.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !listRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const list = listRef.current.getBoundingClientRect();
    const margin = 8;
    const viewportBottom = window.innerHeight - (window.innerWidth <= 640 ? PHONE_TAB_BAR : 0);
    let top = trigger.bottom + 4;
    if (top + list.height > viewportBottom - margin) top = Math.max(margin, trigger.top - 4 - list.height);
    let left = trigger.right - list.width;
    left = Math.min(Math.max(margin, left), window.innerWidth - list.width - margin);
    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    focusItem(focusIndex.current);
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!listRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    const onScrollOrResize = () => close(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
    // focusItem only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); openMenu("first"); }
    if (event.key === "ArrowUp") { event.preventDefault(); openMenu("last"); }
  }

  function onListKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); focusItem(focusIndex.current + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); focusItem(focusIndex.current - 1); }
    else if (event.key === "Home") { event.preventDefault(); focusItem(0); }
    else if (event.key === "End") { event.preventDefault(); focusItem(itemElements().length - 1); }
    else if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "Tab") { close(false); }
  }

  if (!visible.length) return null;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu("first"))}
        onKeyDown={onTriggerKeyDown}
      >
        {triggerLabel ?? t("common.actionsMenu")}
        <ChevronDown aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label ?? t("common.actionsMenu")}
          className="action-menu-list"
          style={{ top: position?.top ?? -9999, left: position?.left ?? -9999 }}
          onKeyDown={onListKeyDown}
        >
          {visible.map((item) => {
            const className = `action-menu-item${item.danger ? " is-danger" : ""}`;
            const content = <>{item.icon}<span>{item.label}</span></>;
            return item.to ? (
              <Link key={item.key} role="menuitem" tabIndex={-1} to={item.to} className={className} aria-label={item.ariaLabel} onClick={() => close(false)}>
                {content}
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={className}
                aria-label={item.ariaLabel}
                onClick={() => { close(); item.onSelect?.(); }}
              >
                {content}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
