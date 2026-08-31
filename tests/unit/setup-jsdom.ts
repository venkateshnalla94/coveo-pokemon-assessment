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

// jsdom has no ResizeObserver — embla-carousel-react (SimilarPokemon.tsx,
// first consumer) calls `new ResizeObserver(...)` unconditionally on mount,
// which throws a real ReferenceError under jsdom with no polyfill. A no-op
// stub is enough: this suite never asserts on resize-driven carousel
// behavior (that's e2e's job, with a real browser), just that the component
// renders through its four states.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver;
}

// Same gap, same reason, for IntersectionObserver — embla-carousel also
// uses one internally (its slide-in-view tracking).
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

// jsdom also has no `window.matchMedia` — embla-carousel calls it directly
// during setup (its reduced-motion / breakpoint option resolution) and
// throws a real `TypeError` without this, same class of gap as
// ResizeObserver above.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
