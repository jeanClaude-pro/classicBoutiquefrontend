// Structural guards of the visual system: one token source with the official
// palette, a flat interface (no elevation, gradient or blur utilities), no
// leftovers of the previous burgundy theme, and the report routes in place.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
function files(dir: string, extensions: string[], out: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) files(relative, extensions, out);
    else if (extensions.some((extension) => entry.name.endsWith(extension))) out.push(relative);
  }
  return out;
}

const OFFICIAL_TOKENS: Record<string, string> = {
  "--color-background": "#fafaf7",
  "--color-surface": "#ffffff",
  "--color-sidebar": "#f5f5f0",
  "--color-foreground": "#27272a",
  "--color-muted-foreground": "#71717a",
  "--color-border": "#e4e4de",
  "--color-primary": "#166534",
  "--color-primary-hover": "#14532d",
  "--color-primary-soft": "#f0fdf4",
  "--color-accent": "#166534",
  "--color-success": "#15803d",
  "--color-warning": "#b45309",
  "--color-danger": "#dc2626",
  "--color-info": "#0369a1",
};

test("the official palette is defined once, as Tailwind theme tokens", () => {
  const css = read("src/index.css");
  assert.match(css, /@theme static \{/);
  for (const [token, value] of Object.entries(OFFICIAL_TOKENS)) {
    const match = new RegExp(`${token}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
    assert.ok(match, `${token} is defined`);
    assert.equal(match[1].toLowerCase(), value, token);
  }
  // Every legacy neutral resolves to the charcoal / muted / border system.
  for (const family of ["gray", "slate", "stone", "neutral"]) {
    assert.match(css, new RegExp(`--color-${family}-900: #27272a`), family);
    assert.match(css, new RegExp(`--color-${family}-500: #71717a`), family);
    assert.match(css, new RegExp(`--color-${family}-200: #e4e4de`), family);
  }
});

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi)!.map((part) => parseInt(part, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("core text and action combinations meet WCAG AA contrast", () => {
  assert.ok(contrast("#27272a", "#fafaf7") >= 4.5, "charcoal on ivory");
  assert.ok(contrast("#52525b", "#ffffff") >= 4.5, "secondary text on cards");
  assert.ok(contrast("#71717a", "#ffffff") >= 4.5, "muted text on cards");
  assert.ok(contrast("#ffffff", "#166534") >= 4.5, "inverse text on primary");
  assert.ok(contrast("#ffffff", "#14532d") >= 4.5, "inverse text on primary hover");
  assert.ok(contrast("#b45309", "#fffbeb") >= 4.5, "warning text on warning surface");
  assert.ok(contrast("#dc2626", "#ffffff") >= 4.5, "danger action on white");
  assert.ok(contrast("#0369a1", "#f0f9ff") >= 4.5, "information text on information surface");
});

// Class tokens such as shadow-sm, hover:shadow-lg, drop-shadow, backdrop-blur,
// bg-gradient-to-r or from-blue-600 inside className strings.
const FORBIDDEN_CLASS = /(?<=[\s"'`{])(?:[a-z0-9-]+:)*(?:(?:drop-)?shadow(?:-[a-z0-9/.[\]_-]+)?|backdrop-blur(?:-[a-z0-9]+)?|bg-gradient-to-[a-z]+|bg-\[(?:radial|linear)-gradient[^\]]*\])(?=[\s"'`}])/g;

test("application components carry no shadow, gradient or blur utilities", () => {
  const offenders: string[] = [];
  for (const file of files("src", [".tsx"])) {
    const found = read(file).match(FORBIDDEN_CLASS);
    if (found) offenders.push(`${file}: ${[...new Set(found)].join(", ")}`);
  }
  assert.deepEqual(offenders, []);
});

test("application stylesheets are flat: no box-shadow, gradient or backdrop blur", () => {
  for (const file of ["src/index.css", "src/design-system.css"]) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const declaration of css.match(/box-shadow\s*:[^;]+;/g) ?? []) assert.match(declaration, /box-shadow\s*:\s*none/, `${file}: ${declaration}`);
    assert.doesNotMatch(css, /(?:linear|radial)-gradient\(/, file);
    for (const declaration of css.match(/backdrop-filter\s*:[^;]+;/g) ?? []) assert.match(declaration, /backdrop-filter\s*:\s*none/, `${file}: ${declaration}`);
  }
});

test("the previous burgundy theme and serif headings are gone", () => {
  const sources = [...files("src", [".tsx", ".ts", ".css"])].map((file) => [file, read(file)] as const);
  for (const [file, text] of sources) {
    assert.doesNotMatch(text, /#5a173f|#6b214d|#351026|#54183c|#f8edf4/i, file);
  }
  for (const file of ["src/index.css", "src/design-system.css"]) assert.doesNotMatch(read(file), /Georgia|ui-serif/, file);
});

test("receipt printing keeps its own styles (not touched by the screen theme)", () => {
  const receipt = read("src/lib/saleReceipt.ts");
  assert.match(receipt, /80mm/);
  assert.doesNotMatch(read("src/design-system.css"), /@media print/);
});

test("report pages stay routed and the stock sheet stays reachable from Products", () => {
  const app = read("src/App.tsx");
  assert.match(app, /path="\/reports\/products-sold"/);
  assert.match(app, /path="\/products\/:id\/stock-sheet"/);
  const products = read("src/pages/products/products.tsx");
  assert.match(products, /\/products\/\$\{product\._id\}\/stock-sheet/);
  assert.match(products, /<ActionMenu /);
});

test("shared primitives exist for every screen to reuse", () => {
  const ui = read("src/components/ui.tsx");
  for (const name of ["Button", "Card", "Page", "PageHeader", "SectionHeader", "FilterBar", "StatusBadge", "EmptyState", "ErrorState", "Skeleton"]) {
    assert.match(ui, new RegExp(`export function ${name}\\b`), name);
  }
  assert.match(read("src/components/ActionMenu.tsx"), /aria-haspopup="menu"/);
});
