/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../../components/LanguageToggle";

import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi } from "../../services/authService";
import { SecretInput } from "../../components/SecretInput";
import { checkApiReachability } from "../../offline/connectivity";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

const LoginPage = () => {
  const { t } = useTranslation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const { setAuth } = useAuth();
  // Every sign-in is checked by the server: without a connection the form
  // says so instead of offering a local (PIN) sign-in.
  const [serverUnreachable, setServerUnreachable] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "session-expired") {
      toast.error(t("login.sessionExpired"), {
        toastId: SESSION_EXPIRED_TOAST_ID,
      });
    } else if (reason === "idle") {
      toast.info(t("login.sessionIdle"), {
        toastId: SESSION_EXPIRED_TOAST_ID,
      });
    }
    // Only ever read on the initial mount of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let active = true;
    void checkApiReachability(true).then((reachable) => { if (active) setServerUnreachable(!reachable); });
    return () => { active = false; };
  }, []);

  // Only ever navigate to an internal path — never let a returnTo value
  // escape to an external origin.
  const isSafeInternalPath = (path: string | null | undefined): path is string =>
    !!path && path.startsWith("/") && !path.startsWith("//");

  const getReturnTo = () => {
    const stateFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const fromState = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ""}` : null;
    if (isSafeInternalPath(fromState)) return fromState;
    const returnTo = searchParams.get("returnTo");
    if (isSafeInternalPath(returnTo)) return returnTo;
    return "/";
  };

  // There is no sign-up here: accounts are created by a superadministrator
  // in Administration. The password is never kept: it is cleared as soon as
  // it has been sent, whatever the answer.
  const handleLogin = async () => {
    const submitted = password;
    setPassword("");
    const { user, expiresAt } = await loginApi({ email, password: submitted });
    setAuth({ user, expiresAt });
    toast.success(t("login.success"));
    const destination = user.role === "admin"
      ? (user.permissions?.find((path) => ["/sales", "/reports", "/products"].includes(path)) || "/sales")
      : getReturnTo();
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await handleLogin();
    } catch (err: any) {
      const msg = err?.message || t("login.invalidCredentials");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <LanguageToggle className="login-language" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-5 overflow-hidden border border-gray-200">
            <img src="/newlogo.png" alt="DOUBLE M" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-navy tracking-wide">DOUBLE M</h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">Classic Boutique</p>
          <span className="mx-auto mt-3 block h-0.5 w-10 bg-navy" aria-hidden="true" />
          <p className="text-gray-600 text-sm mt-3">{t("login.tagline")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("login.signIn")}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {t("login.signInHint")}
            </p>

            {/* Shared shop terminal: nothing is pre-filled or remembered. The
                password must be typed on every visit (see SecretInput). */}
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" data-lpignore="true" data-1p-ignore="true">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  required
                  maxLength={254}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("login.password")}
                </label>
                <div className="relative">
                  <SecretInput
                    id="password"
                    visible={showPassword}
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                    required
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("login.signingIn")}
                  </span>
                ) : (
                  t("login.submitSignIn")
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">{t("login.accountsByAdmin")}</p>
            {serverUnreachable && (
              <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900">
                {t("login.serverRequired")}
              </p>
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default LoginPage;
