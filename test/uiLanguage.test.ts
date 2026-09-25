import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describeTimeframeFr } from "../src/utils/dateUtils.ts";
import { entryStatusLabel, expenseStatusLabel, paymentMethodLabel, saleStatusLabel, saleTypeLabel } from "../src/lib/labels.ts";
import { roleChangeCopy, shareholderCategoryCopy } from "../src/lib/confirmationCopy.ts";
import { ROLE_LABELS, roleLabel } from "../src/config/roles.ts";

const clientRoot = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, clientRoot), "utf8");

test("the document opts out of browser page translation (it crashed React updates)", () => {
  // Chrome/Edge translation swaps React's text nodes for <font> elements;
  // the next update then throws NotFoundError (removeChild/insertBefore).
  const html = read("index.html");
  assert.match(html, /<html[^>]*\blang="fr"/);
  assert.match(html, /<html[^>]*\btranslate="no"/);
  assert.match(html, /<meta name="google" content="notranslate"/);
});

test("server period descriptions are shown in French", () => {
  assert.equal(describeTimeframeFr("Today (default)"), "Aujourd'hui");
  assert.equal(describeTimeframeFr(undefined), "Aujourd'hui");
  assert.equal(describeTimeframeFr("All history"), "Tout l'historique");
  assert.equal(describeTimeframeFr("Day: 2026-09-24"), "Journée du 24/09/2026");
  assert.equal(describeTimeframeFr("Month: 2026-09"), "Septembre 2026");
  assert.equal(describeTimeframeFr("Year: 2026"), "Année 2026");
  assert.equal(describeTimeframeFr("Custom range: 2026-09-01 to 2026-09-24"), "Du 01/09/2026 au 24/09/2026");
  assert.equal(describeTimeframeFr("Custom range: 2026-09-01 to Now"), "Depuis le 01/09/2026");
  assert.equal(describeTimeframeFr("Custom range: Beginning to 2026-09-24"), "Jusqu'au 24/09/2026");
});

test("stored enum values are displayed with French labels", () => {
  assert.equal(paymentMethodLabel("cash"), "Espèces");
  assert.equal(paymentMethodLabel("mpesa"), "M-Pesa");
  assert.equal(paymentMethodLabel("transfer"), "Virement");
  assert.equal(saleStatusLabel("completed"), "Terminée");
  assert.equal(saleStatusLabel("voided"), "Annulée");
  assert.equal(saleTypeLabel("reservation"), "Réservation");
  assert.equal(expenseStatusLabel("validated"), "Validé");
  assert.equal(entryStatusLabel("deleted"), "Supprimée");
  // Unknown values stay readable; missing values never render "undefined".
  assert.equal(paymentMethodLabel("crypto"), "crypto");
  assert.equal(saleStatusLabel(undefined), "—");
});

test("a role change explains what the account will be able to do", () => {
  const toShareholder = roleChangeCopy({ username: "awa", role: "manager" }, { role: "admin", assignedCategory: "SHOES" }, roleLabel);
  const text = [toShareholder.title, toShareholder.message, ...toShareholder.consequences].join(" ");
  assert.match(text, /« awa » passera de « Responsable » à « Actionnaire · CHAUSSURES »/);
  assert.match(text, /lecture seule/);
  assert.match(text, /permissions d'actions sont retirées/);

  const toSuperadmin = roleChangeCopy({ username: "awa", role: "staff" }, { role: "superadmin" }, roleLabel);
  assert.equal(toSuperadmin.variant, "warning");
  assert.match(toSuperadmin.consequences.join(" "), /accès complet/);

  const category = shareholderCategoryCopy({ username: "awa", assignedCategory: "CLOTHES" }, "SHOES");
  assert.match(category.message, /CHAUSSURES au lieu de VÊTEMENTS/);
});

test("roles have one set of names, shared by navigation and administration", () => {
  const admin = read("src/pages/admin/AdminPanel.tsx");
  assert.match(admin, /from "\.\.\/\.\.\/config\/roles"/);
  for (const label of Object.values(ROLE_LABELS)) assert.ok(label.length > 0);
  // The historical duplicates that swapped "Responsable" and "Gestionnaire".
  for (const stale of ["Responsable Stock", "Superviseur Caisse", 'manager: "Gestionnaire"']) {
    assert.ok(!admin.includes(stale), `AdminPanel still defines "${stale}"`);
  }
});

test("routed pages no longer show the English interface strings found in the audit", () => {
  const pages = fileURLToPath(new URL("src/pages/", clientRoot));
  const files: string[] = [];
  (function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      // pages/pos/Pos.tsx is not routed (see App.tsx).
      else if (/\.tsx$/.test(name) && !path.includes(join("pos", "Pos.tsx"))) files.push(path);
    }
  })(pages);
  const english = [
    "Show Filters", "Hide Filters", "Clear Filters", "Advanced Filters", "Search sales", "Summary Statistics",
    "Logged in as", "Timeframe Type", "Specific Day", "Custom Range", "All Types", "All Status", "Filter by phone",
    "Applied filters", "Refresh Products", "Loading products", "Updating...", "Edit Sale", ">Cash<", "Revenue Totale",
    '"Unknown"', "Cannot edit a deleted entry", "Total Records", "Total Sales", "Total Expenses",
  ];
  for (const file of files) {
    // Only code and markup count; comments may keep their English wording.
    const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const phrase of english) assert.ok(!source.includes(phrase), `${file} still shows "${phrase}"`);
  }
});

test("the history pages read their interface text from the dictionaries", () => {
  const pages = ["src/pages/history/SalesHistory.tsx", "src/pages/EntryHistory.tsx", "src/pages/SortieHistory.tsx"];
  const french = [
    "Synthèse de la période", "Chargement des ventes", "Toutes les ventes", "Identifiant de vente", "Détails de la vente",
    "Toutes les entrées", "Information sur l'Expéditeur", "Statistiques des Entrées", "Détails de l'Entrée",
    "Décaissements du jour", "Motif et type", "Synthèse des décaissements", "Historique du décaissement",
    "Filtres appliqués", "Réinitialiser les filtres", "Précédent", "Aucun détail de modification disponible",
  ];
  for (const page of pages) {
    const source = read(page).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.match(source, /useTranslation\(\)/, `${page} does not use the translation hook`);
    for (const phrase of french) assert.ok(!source.includes(phrase), `${page} still hardcodes "${phrase}"`);
  }
});
