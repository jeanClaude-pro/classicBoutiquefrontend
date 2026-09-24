import "@testing-library/jest-dom/vitest";

// Vitest runs without globals, so Testing Library cannot register its
// automatic unmount; do it explicitly so each test starts from an empty DOM.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(() => cleanup());
