import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(import.meta.dirname, "./src"),
};

export default defineConfig({
  test: {
    // Two projects, one node (existing src/coveo + api route tests), one
    // jsdom (new component tests, docs/standards-adoption.md #12b) — kept
    // in a single vitest.config.mts via `test.projects` rather than a
    // separate vitest.workspace file, since both projects share the same
    // path alias and coverage configuration.
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "jsdom",
          environment: "jsdom",
          // useControllerState.test.tsx lives under tests/unit/coveo/ (it's
          // not a component) but needs the DOM environment renderHook
          // requires, hence the explicit second glob entry rather than a
          // component-only directory match.
          include: ["tests/unit/components/**/*.test.tsx", "tests/unit/coveo/useControllerState.test.tsx"],
          setupFiles: ["./tests/unit/setup-jsdom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Narrow, honest scope — files that hold real logic, named explicitly
      // rather than a blanket repo-wide number. See docs/standards-adoption.md #12.
      include: [
        "src/coveo/mapPokemonResult.ts",
        "src/coveo/applicationError.ts",
        "src/coveo/searchRenderState.ts",
        "src/coveo/config.ts",
        "src/coveo/typeColors.ts",
        "src/app/api/token/route.ts",
        "src/app/api/passages/route.ts",
        "src/app/api/similar/route.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
