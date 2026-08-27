import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Pre-commit guard: every staged file under a testable root (currently
 * src/coveo/ and src/app/api/, minus a small exempt list) must have a
 * matching test under tests/unit/, mirroring src/'s directory structure —
 * src/coveo/x.ts pairs with tests/unit/coveo/x.test.ts, src/app/api/x/
 * route.ts pairs with tests/unit/app/api/x/route.test.ts. Add a new root
 * here (e.g. "src/lib/") as the codebase grows; this keeps the mirror rule
 * generic rather than hardcoding "coveo" anywhere below.
 *
 * Scope is deliberately narrower than "everything" — React components stay
 * out (covered by the Playwright e2e suite, tests/e2e/, instead of a
 * unit-test requirement; most are thin controller wrappers or tightly
 * coupled to the Headless engine, and would need a jsdom/testing-library
 * harness this repo doesn't otherwise need). Server-side logic — src/coveo/
 * plus src/app/api/ route handlers — is unit-tested instead, since it's
 * plain functions with real branching and no rendering involved. See
 * docs/standards-adoption.md #1 and #12.
 *
 * Match isn't mirrored-path-only: if the mirrored path doesn't exist, this
 * also greps the whole tests/ tree for a reference to the module, so a
 * differently-organized test file that still imports/covers it still counts.
 */

const TESTABLE_ROOTS = [
  "src/coveo/", // pure logic: mappers, error normalization, render-state, config
  "src/app/api/", // Next.js route handlers: validation, rate limiting, upstream-call branching
];
// Files under a testable root that are intentionally not unit-tested, with why:
const EXEMPT = new Set([
  "engine.ts", // side-effecting singleton wrapping the Headless SDK, treated as a black box — see docs/standards-adoption.md #9
  "fields.ts", // pure string constants, no branching logic to assert
  "searchConfig.ts", // pure string constants, no branching logic to assert
]);

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const testsDir = path.join(repoRoot, "tests");

function stagedFiles() {
  const output = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
    encoding: "utf8",
    cwd: repoRoot,
  });
  return output.split("\n").filter(Boolean);
}

function listFilesRecursive(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    return statSync(fullPath).isDirectory() ? listFilesRecursive(fullPath) : [fullPath];
  });
}

function hasReferenceUnderTests(basename) {
  const testFiles = listFilesRecursive(testsDir);
  return testFiles.some((file) => readFileSync(file, "utf8").includes(basename));
}

const candidates = stagedFiles().filter(
  (file) =>
    TESTABLE_ROOTS.some((root) => file.startsWith(root)) &&
    file.endsWith(".ts") &&
    !file.endsWith(".test.ts") &&
    !EXEMPT.has(path.basename(file)),
);

const missing = candidates.filter((file) => {
  // src/coveo/mapPokemonResult.ts -> tests/unit/coveo/mapPokemonResult.test.ts
  const relativeToSrc = path.relative("src", file).replace(/\.ts$/, ".test.ts");
  const mirroredTest = path.join(testsDir, "unit", relativeToSrc);
  const basename = path.basename(file, ".ts");
  return !existsSync(mirroredTest) && !hasReferenceUnderTests(basename);
});

if (missing.length > 0) {
  console.error("pre-commit: missing test coverage for staged file(s):");
  for (const file of missing) {
    console.error(`  - ${file}`);
  }
  console.error(
    `\nAdd a test at tests/unit/<mirrored path>.test.ts (or a reference to the module in an existing ` +
      `test under tests/). If a file genuinely doesn't need a unit test, add it to EXEMPT in ` +
      `scripts/check-test-coverage.mjs with a reason.`,
  );
  process.exit(1);
}
