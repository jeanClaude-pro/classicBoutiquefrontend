import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { isChunkLoadError, reloadForNewVersion } from "../lib/chunkRecovery";

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the route) clears a previous error. */
  resetKey?: string;
  /** "page" keeps the navigation usable; "app" is the last line of defence. */
  scope?: "page" | "app";
}

interface State {
  error: Error | null;
}

/**
 * Fallback protection only: a rendering error in one page must never blank
 * the whole application. Root causes are fixed where they occur.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      // A new version was deployed: one guarded reload loads it.
      if (reloadForNewVersion()) return;
    }
    if (import.meta.env.DEV) {
      console.error(`[${this.props.scope ?? "page"} error boundary]`, error, info.componentStack);
    } else {
      console.error(`[${this.props.scope ?? "page"} error boundary]`, error.name, error.message);
    }
  }

  componentDidUpdate(previous: Props): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const outdated = isChunkLoadError(error);
    return (
      <div className="app-error-fallback" role="alert">
        <div className="app-error-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-hidden="true">
            {outdated ? <RefreshCw className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </span>
          <h1>{outdated ? "Une nouvelle version est disponible" : "Une erreur inattendue est survenue"}</h1>
          <p>
            {outdated
              ? "Cette page appartient à une version précédente de l'application. Rechargez pour utiliser la version à jour."
              : "Cette page n'a pas pu s'afficher. Vos données enregistrées ne sont pas affectées. Réessayez ou revenez à l'accueil."}
          </p>
          {import.meta.env.DEV && !outdated && (
            <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-slate-50 p-2 text-left text-xs text-slate-600">{error.message}</pre>
          )}
          <div className="app-error-actions">
            {outdated ? (
              <button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => window.location.reload()}>Recharger l'application</button>
            ) : (
              <>
                <button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={this.retry}>Réessayer</button>
                <a href="/" className="border border-slate-300 bg-white text-slate-800 hover:bg-slate-50">Retour à l'accueil</a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}
