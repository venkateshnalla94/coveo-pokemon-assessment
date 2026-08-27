import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
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
