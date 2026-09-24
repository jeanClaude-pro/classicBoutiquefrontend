import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MODULES, PERMISSION_MODULE_IDS, moduleForPath } from "../src/config/modules.ts";
import { navigationSections } from "../src/config/navigation.ts";

const src = new URL("../src/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, src), "utf8");

test("navigation labels are exactly the canonical module labels", () => {
  for (const item of navigationSections.flatMap((section) => section.items)) {
    const module = moduleForPath(item.path);
    assert.ok(module, `no module for ${item.path}`);
    assert.equal(item.label, module.label, item.path);
    assert.equal(item.shortLabel, module.shortLabel, item.path);
  }
});

test("every module has a unique name and a short description", () => {
  const modules = Object.values(MODULES);
  assert.equal(new Set(modules.map((module) => module.label)).size, modules.length);
  assert.equal(new Set(modules.map((module) => module.path)).size, modules.length);
  for (const module of modules) assert.ok(module.description.length > 20 && module.description.length < 170, module.id);
});

test("every routed page has a module and every module has a route", () => {
  const app = read("App.tsx");
  const routed = [...app.matchAll(/path="([^"]+)"/g)].map((match) => match[1]).filter((path) => !["/login", "/new-sale"].includes(path));
  for (const path of routed) assert.ok(moduleForPath(path), `route ${path} has no module name`);
  for (const module of Object.values(MODULES)) assert.ok(routed.includes(module.path), `${module.label} is not routed`);
});

test("the permission editor lists the same names and only real pages", () => {
  const admin = read("pages/admin/AdminPanel.tsx");
  assert.match(admin, /PERMISSION_MODULE_IDS\.map/);
  assert.doesNotMatch(admin, /"\/dashboard"/);
  for (const id of PERMISSION_MODULE_IDS) assert.ok(MODULES[id]);
});

test("the misleading historical names are gone from user-facing text", () => {
  assert.equal(MODULES.sortie.label, "Décaissements");
  assert.equal(MODULES.historicsortie.label, "Historique des décaissements");
  assert.equal(MODULES.remboursements.label, "Dettes & emprunts");
  for (const file of ["config/navigation.ts", "pages/Sortie.tsx", "pages/SortieHistory.tsx", "pages/admin/AdminPanel.tsx"]) {
    const text = read(file);
    assert.doesNotMatch(text, /Sortie de caisse|Sorties de Caisse|Historique des sorties|Historique de Sortie/i, file);
  }
});

test("page headers read their title from the registry", () => {
  const expectations: Record<string, string> = {
    "pages/Sortie.tsx": "MODULES.sortie.label",
    "pages/SortieHistory.tsx": "MODULES.historicsortie.label",
    "pages/history/SalesHistory.tsx": "MODULES.sales.label",
    "pages/ReservationHistory.tsx": "MODULES.reservationhistory.label",
    "pages/EntryHistory.tsx": "MODULES.entryhistory.label",
    "pages/products/products.tsx": "MODULES.products.label",
    "pages/customers/Customers.tsx": "MODULES.customers.label",
    "pages/Rate.tsx": "MODULES.rate.label",
    "pages/Remboursements.tsx": "MODULES.remboursements.label",
    "pages/analytics/Analytics.tsx": "MODULES.reports.label",
    "pages/NewSale.tsx": "MODULES.pos.label",
    "pages/Reservation.tsx": "MODULES.reservation.label",
    "pages/Entry.tsx": "MODULES.entry.label",
  };
  for (const [file, reference] of Object.entries(expectations)) assert.ok(read(file).includes(reference), file);
});

test("routed pages use the application dialog, never blocking browser dialogs", () => {
  const app = read("App.tsx");
  const pagesDir = fileURLToPath(new URL("pages/", src));
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name)) files.push(path);
    }
  };
  walk(pagesDir);
  let checked = 0;
  for (const file of files) {
    const component = file.split(/[\\/]/).pop()!.replace(/\.tsx?$/, "");
    // pos/Pos.tsx is not routed (App.tsx never imports it).
    if (!new RegExp(`/${component}["']`).test(app)) continue;
    checked += 1;
    assert.doesNotMatch(readFileSync(file, "utf8"), /(window\.)?\b(confirm|alert)\(/, file);
  }
  assert.ok(checked >= 14, `only ${checked} routed pages were checked`);
});
