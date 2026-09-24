import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { CHUNK_RELOAD_KEY } from "../src/lib/chunkRecovery";

const originalLocation = window.location;
let shouldThrow = true;

function Fragile({ error }: { error: Error }) {
  if (shouldThrow) throw error;
  return <p>Page rétablie</p>;
}

function Shell({ error }: { error: Error }) {
  const [route, setRoute] = useState("/sales");
  return (
    <div>
      <nav><button type="button" onClick={() => setRoute("/products")}>Articles & stock</button></nav>
      <AppErrorBoundary scope="page" resetKey={route}>
        {route === "/sales" ? <Fragile error={error} /> : <p>Page articles</p>}
      </AppErrorBoundary>
    </div>
  );
}

beforeEach(() => {
  shouldThrow = true;
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, reload: vi.fn() } });
});
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
});

test("a rendering error shows a French fallback while the navigation stays usable", async () => {
  const user = userEvent.setup();
  render(<Shell error={new TypeError("Cannot read properties of undefined (reading 'length')")} />);
  expect(screen.getByRole("heading", { name: "Une erreur inattendue est survenue" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");
  // Navigating elsewhere clears the error: the application was never blank.
  await user.click(screen.getByRole("button", { name: "Articles & stock" }));
  expect(screen.getByText("Page articles")).toBeInTheDocument();
});

test("Réessayer re-renders the page once the cause is gone", async () => {
  const user = userEvent.setup();
  render(<Shell error={new Error("boom")} />);
  shouldThrow = false;
  await user.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(screen.getByText("Page rétablie")).toBeInTheDocument();
});

test("an outdated chunk reloads once, then offers a manual reload instead of looping", () => {
  const chunkError = new TypeError("Failed to fetch dynamically imported module: https://app/assets/Sortie-abc.js");
  const first = render(<Shell error={chunkError} />);
  expect(window.location.reload).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).not.toBeNull();
  first.unmount();
  // Same failure right after the reload: no automatic reload loop.
  render(<Shell error={chunkError} />);
  expect(window.location.reload).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("heading", { name: "Une nouvelle version est disponible" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Recharger l'application" })).toBeInTheDocument();
});
