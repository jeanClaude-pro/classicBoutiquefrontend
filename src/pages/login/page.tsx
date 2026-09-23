/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, LockKeyhole, UserPlus } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi, register as registerApi } from "../../services/authService";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

type Mode = "login" | "signup";

const LoginPage = () => {
  const [mode, setMode] = React.useState<Mode>("login");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Signup-only fields
  const [username, setUsername] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.", {
        toastId: SESSION_EXPIRED_TOAST_ID,
      });
    }
    // Only ever read on the initial mount of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async () => {
    const { user, token } = await loginApi({ email, password });
    setAuth({ token, user });
    toast.success("Connexion réussie !");
    const destination = user.role === "admin"
      ? (user.permissions?.find((path) => ["/sales", "/reports", "/products"].includes(path)) || "/sales")
      : getReturnTo();
    navigate(destination, { replace: true });
  };

  const handleSignup = async () => {
    if (!username.trim()) {
      throw new Error("Le nom d'utilisateur est requis");
    }
    if (password.length < 10) {
      throw new Error("Le mot de passe doit comporter au moins 10 caractères");
    }
    if (password !== confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    const { user, token } = await registerApi({
      username: username.trim(),
      email,
      password,
    });
    setAuth({ token, user });
    toast.success("Compte créé avec succès !");
    navigate(getReturnTo(), { replace: true });
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
        (mode === "login" ? "Email ou mot de passe incorrect" : "Impossible de créer le compte");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(56,189,248,0.18),transparent_30rem),linear-gradient(135deg,#020617_0%,#0f2942_48%,#0f172a_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl shadow-black/30 mb-5 overflow-hidden ring-1 ring-white/20">
            <img src="/newlogo.png" alt="DOUBLE M" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">DOUBLE M</h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Classic Boutique</p>
          <p className="text-amber-100/75 text-sm mt-2">Vêtements · Chaussures · Élégance</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl shadow-black/25 overflow-hidden border border-white/80">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/40"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/40"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Créer un compte
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                {mode === "login" ? <LockKeyhole className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === "login" ? "Connexion" : "Créer un compte"}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {mode === "login"
                ? "Entrez vos identifiants pour accéder au système"
                : "Renseignez vos informations pour créer votre compte"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom d'utilisateur
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="ex: Jean Claude"
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
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ex: utilisateur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                    minLength={mode === "signup" ? 10 : undefined}
                    maxLength={128}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="text-xs text-gray-400 mt-1">Au moins 10 caractères</p>
                )}
              </div>

              {mode === "signup" && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
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
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === "login" ? "Connexion en cours..." : "Création en cours..."}
                  </span>
                ) : mode === "login" ? (
                  "Se connecter"
                ) : (
                  "Créer mon compte"
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Vous avez déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
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
