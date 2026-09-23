import test from "node:test";
import assert from "node:assert/strict";
import { canAccessNavigationItem, navigationSections } from "../src/config/navigation.ts";
import type { Role, User } from "../src/types/auth.ts";

const item = (path: string) => navigationSections.flatMap((section) => section.items).find((entry) => entry.path === path)!;
const user = (role: Role, permissions: string[] = []): User => ({ id: role, username: role, email: `${role}@example.com`, role, permissions });

test("only superadmin has fixed administration access", () => {
  assert.equal(canAccessNavigationItem(item("/admin"), user("manager", ["/admin"])), false);
  assert.equal(canAccessNavigationItem(item("/admin"), user("admin", ["/admin"])), false);
  assert.equal(canAccessNavigationItem(item("/admin"), user("superadmin")), true);
});

test("custom page permissions drive ordinary module visibility", () => {
  const manager = user("manager", ["/sales"]);
  assert.equal(canAccessNavigationItem(item("/sales"), manager), true);
  assert.equal(canAccessNavigationItem(item("/entry"), manager), false);
});

test("shareholder navigation is explicit while operational roles retain defaults", () => {
  assert.equal(canAccessNavigationItem(item("/"), user("admin")), false);
  assert.equal(canAccessNavigationItem(item("/sales"), user("admin", ["/sales"])), true);
  assert.equal(canAccessNavigationItem(item("/reports"), user("admin", ["/sales"])), false);
  assert.equal(canAccessNavigationItem(item("/products"), user("manager")), true);
  assert.equal(canAccessNavigationItem(item("/sales"), user("cashier_supervisor")), true);
  assert.equal(canAccessNavigationItem(item("/products"), user("inventory_manager")), true);
  assert.equal(canAccessNavigationItem(item("/sales"), user("staff")), false);
});
