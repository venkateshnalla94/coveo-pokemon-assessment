import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// This project doesn't enable vitest's `globals: true` (kept explicit
// per-file `import { describe, it, expect } from "vitest"` throughout, see
// the existing tests/unit/coveo/*.test.ts style), so Testing Library's
// auto-cleanup (which detects a global `afterEach`) doesn't kick in on its
// own — wire it explicitly instead.
afterEach(() => {
  cleanup();
});
