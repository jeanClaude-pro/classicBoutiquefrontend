/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, LockKeyhole, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../../components/LanguageToggle";

import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi, register as registerApi } from "../../services/authService";
import { checkApiReachability } from "../../offline/connectivity";
import { toApiError } from "../../lib/apiError";
import { disableOfflineAccessForEmail, listOfflineProfiles, verifyOfflinePin } from "../../offline/offlineAuth";
import type { OfflineAuthProfile } from "../../offline/types";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

type Mode = "login" | "signup";

const LoginPage = () => {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<Mode>("login");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Signup-only fields
  const [username, setUsername] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const { setAuth, setOfflineAuth } = useAuth();
  const [offlineProfiles, setOfflineProfiles] = React.useState<OfflineAuthProfile[]>([]);
  const [offlineAvailable, setOfflineAvailable] = React.useState(false);
  const [offlineUserId, setOfflineUserId] = React.useState("");
  const [offlinePin, setOfflinePin] = React.useState("");
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
    void Promise.all([listOfflineProfiles(), checkApiReachability(true)]).then(([profiles, reachable]) => {
      setOfflineProfiles(profiles);
      setOfflineUserId(profiles[0]?.userId || "");
      setOfflineAvailable(!reachable && profiles.length > 0);
    });
  }, []);

  const handleOfflineLogin = async () => {
    setError(""); setLoading(true);
    try {
      const profile = await verifyOfflinePin(offlineUserId, offlinePin);
      setOfflineAuth(profile.user, profile.offlineAccessExpiresAt);
      navigate(getReturnTo(), { replace: true });
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "PIN_INVALID";
      setError(t(`offline.errors.${code}`));
    } finally { setLoading(false); }
  };

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

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async () => {
    let result: Awaited<ReturnType<typeof loginApi>>;
    try {
      result = await loginApi({ email, password });
    } catch (failure) {
      // The server says this account is disabled: this device must stop
      // offering offline access to it (its queued sales are kept).
      if (toApiError(failure).status === 403) await disableOfflineAccessForEmail(email).catch(() => undefined);
      throw failure;
    }
    const { user, token } = result;
    setAuth({ token, user });
    toast.success(t("login.success"));
    const destination = user.role === "admin"
      ? (user.permissions?.find((path) => ["/sales", "/reports", "/products"].includes(path)) || "/sales")
      : getReturnTo();
    navigate(destination, { replace: true });
  };

  const handleSignup = async () => {
    if (!username.trim()) {
      throw new Error(t("login.usernameRequired"));
    }
    if (password.length < 10) {
      throw new Error(t("login.passwordTooShort"));
    }
    if (password !== confirmPassword) {
      throw new Error(t("login.passwordMismatch"));
    }

    await registerApi({
      username: username.trim(),
      email,
      password,
    });
    // No session is opened: a superadministrator must activate the account.
    toast.success(t("login.accountPendingActivation"), { autoClose: 8000 });
    setUsername("");
    switchMode("login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        (mode === "login" ? t("login.invalidCredentials") : t("login.signupFailed"));
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">DOUBLE M</h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">Classic Boutique</p>
          <span className="mx-auto mt-3 block h-0.5 w-10 bg-accent" aria-hidden="true" />
          <p className="text-gray-600 text-sm mt-3">{t("login.tagline")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary-soft/40"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t("login.signIn")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "text-primary border-b-2 border-primary bg-primary-soft/40"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t("login.createAccount")}
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                {mode === "login" ? <LockKeyhole className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === "login" ? t("login.signIn") : t("login.createAccount")}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {mode === "login"
                ? t("login.signInHint")
                : t("login.signupHint")}
            </p>

            {/* autoComplete="off" discourages browsers from saving or
                pre-filling credentials on this shared terminal; a browser's
                own password manager may still ignore it. */}
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {mode === "signup" && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("login.username")}
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder={t("login.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                    maxLength={80}
                    autoComplete="username"
                  />
                </div>
              )}

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                    minLength={mode === "signup" ? 10 : undefined}
                    maxLength={128}
                    autoComplete={mode === "login" ? "off" : "new-password"}
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
                {mode === "signup" && (
                  <p className="text-xs text-gray-400 mt-1">{t("login.minLength")}</p>
                )}
              </div>

              {mode === "signup" && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("login.confirmPassword")}
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === "login" ? t("login.signingIn") : t("login.creating")}
                  </span>
                ) : mode === "login" ? (
                  t("login.submitSignIn")
                ) : (
                  t("login.submitSignup")
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {mode === "login" ? (
                <>
                  {t("login.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {t("login.createAccount")}
                  </button>
                </>
              ) : (
                <>
                  {t("login.haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {t("login.submitSignIn")}
                  </button>
                </>
              )}
            </p>
            {offlineAvailable && mode === "login" && <div className="mt-4 border-t pt-4 text-left">
              <p className="mb-3 text-sm font-semibold text-slate-800">{t("offline.login")}</p>
              <select aria-label={t("offline.login")} className="mb-2 w-full rounded-lg border px-3 py-2" value={offlineUserId} onChange={(event) => setOfflineUserId(event.target.value)}>{offlineProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{profile.user.username}</option>)}</select>
              <input aria-label={t("offline.pin")} className="mb-2 w-full rounded-lg border px-3 py-2" type="password" inputMode="numeric" placeholder={t("offline.pin")} value={offlinePin} onChange={(event) => setOfflinePin(event.target.value.replace(/\D/g, "").slice(0, 12))} />
              <button type="button" disabled={loading || offlinePin.length < 6} onClick={() => void handleOfflineLogin()} className="w-full rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{t("offline.login")}</button>
            </div>}
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
