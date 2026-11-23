import { useEffect, useId, useState, type InputHTMLAttributes } from "react";

/**
 * Password field that must be typed every time, and that browsers never save.
 *
 * - Never pre-filled: it starts empty and read-only until it gets the focus,
 *   so a browser cannot autofill a saved password into it.
 * - Never offered for saving. Browsers ignore autocomplete="off" when they
 *   decide to propose "Save password?": they only ever offer it for a field
 *   of type="password". On computers (Chrome, Edge, Safari and Firefox, which
 *   all support `-webkit-text-security`) the field is therefore a text field
 *   whose characters are drawn as dots: there is nothing a password manager
 *   recognises, so nothing is proposed or saved.
 * - On touch screens the field stays type="password": there, an on-screen
 *   keyboard would otherwise learn the typed password as a word and suggest
 *   it to the next person. It still carries every "do not save" hint:
 *   autocomplete="new-password", a different field name on every visit and
 *   the password managers' own "ignore" attributes (LastPass, 1Password,
 *   Bitwarden, Dashlane).
 * - The value only lives in the parent's state; callers clear it after use.
 */
function canMaskTextField(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  if (!CSS.supports("-webkit-text-security", "disc")) return false;
  return !(window.matchMedia?.("(pointer: coarse)").matches ?? false);
}

export function SecretInput({ onFocus, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "autoComplete" | "name" | "readOnly" | "type"> & { visible?: boolean }) {
  const { visible, ...rest } = props;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  // A field name browsers have never seen, so nothing is matched or saved.
  const [name] = useState(() => `f${id}${Math.random().toString(36).slice(2, 10)}`);
  const [masked] = useState(canMaskTextField);
  const [armed, setArmed] = useState(false);
  // A re-mount (another visit to the page) starts read-only again.
  useEffect(() => () => setArmed(false), []);
  return (
    <input
      {...rest}
      type={visible || masked ? "text" : "password"}
      // .secret-masked (design-system.css) draws the characters as dots.
      className={masked && !visible ? [className, "secret-masked"].filter(Boolean).join(" ") : className}
      name={name}
      autoComplete={masked ? "off" : "new-password"}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      readOnly={!armed}
      onFocus={(event) => { setArmed(true); onFocus?.(event); }}
      data-lpignore="true"
      data-1p-ignore="true"
      data-bwignore="true"
      data-form-type="other"
    />
  );
}
