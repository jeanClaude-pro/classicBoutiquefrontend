import test from "node:test";
import assert from "node:assert/strict";
import { CHUNK_RELOAD_KEY, claimChunkReload, isChunkLoadError } from "../src/lib/chunkRecovery.ts";

const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), values };
};

test("recognizes the ways browsers report an outdated or missing chunk", () => {
  for (const message of [
    "Failed to fetch dynamically imported module: https://app/assets/Sortie-abc.js",
    "error loading dynamically imported module",
    "Importing a module script failed.",
    "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of \"text/html\".",
    "'text/html' is not a valid JavaScript MIME type.",
    "Unable to preload CSS for /assets/index.css",
  ]) {
    assert.equal(isChunkLoadError(new TypeError(message)), true, message);
  }
  assert.equal(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'length')")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("the automatic reload happens at most once per window, so it can never loop", () => {
  const storage = memory();
  const start = 1_000_000;
  assert.equal(claimChunkReload(storage, start), true);
  assert.equal(storage.values.get(CHUNK_RELOAD_KEY), String(start));
  assert.equal(claimChunkReload(storage, start + 5_000), false, "second failure right after reload: no loop");
  assert.equal(claimChunkReload(storage, start + 59_999), false);
  assert.equal(claimChunkReload(storage, start + 60_000), true, "a later deployment may reload again");
});

test("no storage or a throwing storage never triggers a reload", () => {
  assert.equal(claimChunkReload(null), false);
  assert.equal(claimChunkReload({ getItem: () => { throw new Error("denied"); }, setItem: () => {} }), false);
});
