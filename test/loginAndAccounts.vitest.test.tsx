// Login page (no sign-up, nothing remembered) and account creation by the
// superadmin in Administration.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, renderPage, signIn } from "./helpers/pageHarness";
import LoginPage from "../src/pages/login/page";
import AdminPanel from "../src/pages/admin/AdminPanel";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("the login page has no sign-up and never pre-fills or keeps the password", async () => {
  const api = mockApi([
    { match: /^\/health$/, reply: { body: { ok: true } } },
    { method: "POST", match: /^\/auth\/login$/, reply: { status: 401, body: { message: "Invalid email or password" } } },
  ]);
  const user = userEvent.setup();
  renderPage(<LoginPage />, "/login");

  expect(screen.queryByRole("button", { name: /Créer un compte/ })).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Confirmer/)).not.toBeInTheDocument();
  expect(screen.getByText(/créés uniquement par l'administrateur/)).toBeInTheDocument();

  const password = screen.getByLabelText("Mot de passe") as HTMLInputElement;
  expect(password.value).toBe("");
  expect(password).toHaveAttribute("autocomplete", "new-password");
  expect(password).toHaveAttribute("readonly"); // nothing can be autofilled before the user focuses it
  expect(password.getAttribute("name")).not.toMatch(/password/i);
  expect(password).toHaveAttribute("data-lpignore", "true");
  expect(screen.getByLabelText("Adresse email")).toHaveAttribute("autocomplete", "off");

  await user.type(screen.getByLabelText("Adresse email"), "caisse@test.local");
  await user.type(password, "mauvais-mot-de-passe");
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
  await waitFor(() => expect(api.calls.some((call) => call.url.endsWith("/auth/login"))).toBe(true));
  // The typed password is gone from the field once sent, and never stored.
  await waitFor(() => expect(password.value).toBe(""));
  expect(JSON.stringify(localStorage)).not.toMatch(/mauvais-mot-de-passe/);
  expect(JSON.stringify(sessionStorage)).not.toMatch(/mauvais-mot-de-passe/);
  const login = api.calls.find((call) => call.url.endsWith("/auth/login"))!;
  expect(login.body).toEqual({ email: "caisse@test.local", password: "mauvais-mot-de-passe" });
});

test("on a computer the password is a dot-masked text field, so no browser offers to save it", async () => {
  mockApi([{ match: /^\/health$/, reply: { body: { ok: true } } }]);
  vi.stubGlobal("CSS", { supports: (property: string, value: string) => property === "-webkit-text-security" && value === "disc" });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
  const user = userEvent.setup();
  renderPage(<LoginPage />, "/login");

  const password = screen.getByLabelText("Mot de passe") as HTMLInputElement;
  // Browsers only propose "Save password?" for type="password" fields.
  expect(password).toHaveAttribute("type", "text");
  expect(password).toHaveAttribute("autocomplete", "off");
  expect(password).toHaveClass("secret-masked");
  expect(document.querySelector('input[type="password"]')).toBeNull();

  // "Show" reveals the characters; "hide" masks them again — still never type="password".
  await user.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
  expect(password).not.toHaveClass("secret-masked");
  await user.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
  expect(password).toHaveClass("secret-masked");
  expect(password).toHaveAttribute("type", "text");
});

test("a successful login stores no token: the session is the server's httpOnly cookie", async () => {
  mockApi([
    { match: /^\/health$/, reply: { body: { ok: true } } },
    { method: "POST", match: /^\/auth\/login$/, reply: { body: { user: { id: "u1", username: "Awa", email: "awa@test.local", role: "staff", permissions: ["/"] }, expiresAt: new Date(Date.now() + 3600_000).toISOString() } } },
  ]);
  const user = userEvent.setup();
  renderPage(<LoginPage />, "/login");
  await user.type(screen.getByLabelText("Adresse email"), "awa@test.local");
  await user.type(screen.getByLabelText("Mot de passe"), "bon-mot-de-passe");
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
  await waitFor(() => expect(localStorage.getItem("sessionExpiresAt")).not.toBeNull());
  expect(localStorage.getItem("token")).toBeNull();
  expect(JSON.stringify(localStorage)).not.toMatch(/bon-mot-de-passe|eyJ/);
});

test("the superadmin creates an account from Administration", async () => {
  signIn({ role: "superadmin" });
  let users: Array<Record<string, unknown>> = [];
  const api = mockApi([
    { match: /^\/users$/, reply: () => ({ body: users }) },
    { match: /^\/settings\/receipt/, reply: { body: {} } },
    { method: "POST", match: /^\/users$/, reply: ({ body }) => {
      const account = body as Record<string, unknown>;
      users = [{ _id: "new1", username: account.username, email: account.email, role: account.role, isActive: true, permissions: account.permissions, createdAt: new Date().toISOString() }];
      return { status: 201, body: users[0] };
    } },
  ]);
  const user = userEvent.setup();
  renderPage(<AdminPanel />, "/admin");

  await user.click(await screen.findByRole("button", { name: "Créer un compte" }));
  const form = screen.getByRole("form", { name: "Nouveau compte" });
  await user.type(within(form).getByLabelText("Nom d'utilisateur"), "Nouvelle caissière");
  await user.type(within(form).getByLabelText("Adresse email"), "caisse2@test.local");
  await user.type(within(form).getByLabelText(/^Mot de passe/), "court");
  await user.type(within(form).getByLabelText("Confirmer le mot de passe"), "court");
  await user.click(within(form).getByRole("button", { name: "Créer le compte" }));
  expect(within(form).getByRole("alert")).toHaveTextContent("au moins 10 caractères");
  expect(api.calls.some((call) => call.method === "POST")).toBe(false);

  await user.clear(within(form).getByLabelText(/^Mot de passe/));
  await user.type(within(form).getByLabelText(/^Mot de passe/), "un-mot-de-passe-solide");
  await user.clear(within(form).getByLabelText("Confirmer le mot de passe"));
  await user.type(within(form).getByLabelText("Confirmer le mot de passe"), "un-mot-de-passe-solide");
  await user.selectOptions(within(form).getByLabelText("Rôle"), "admin:SHOES");
  await user.click(within(form).getByRole("button", { name: "Créer le compte" }));

  await waitFor(() => expect(api.calls.some((call) => call.method === "POST" && call.url.endsWith("/users"))).toBe(true));
  const created = api.calls.find((call) => call.method === "POST")!.body as Record<string, unknown>;
  expect(created).toMatchObject({ username: "Nouvelle caissière", email: "caisse2@test.local", password: "un-mot-de-passe-solide", role: "admin", assignedCategory: "SHOES" });
  // A shareholder account only receives the modules it may read.
  expect((created.permissions as string[]).every((path) => ["/sales", "/reports", "/products"].includes(path))).toBe(true);
  expect(await screen.findByText("Nouvelle caissière")).toBeInTheDocument();
});
