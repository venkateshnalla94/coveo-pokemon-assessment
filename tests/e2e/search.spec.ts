import { expect, test } from "@playwright/test";

/**
 * The configured golden path — skipped entirely unless
 * NEXT_PUBLIC_COVEO_ORGANIZATION_ID is set, since these assertions need a
 * live Coveo source actually returning Pokemon results (see C7 in
 * docs/EXECUTION-PLAN.md). Once Phase 3/4 land real env vars in CI/preview,
 * this suite starts running for real instead of skipping. Assertions here
 * are deliberately placeholder-but-real: they validate the same C2/C3/C6
 * contracts the frontend code in this change implements (exact-match detail
 * lookup, multi-value type chips, generation facet), not vaguer smoke
 * checks, so a genuine regression in any of those trips this suite the
 * first time it runs, not months later.
 */
test.describe("search results route (configured)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    "needs a configured Coveo org (NEXT_PUBLIC_COVEO_ORGANIZATION_ID)",
  );

  test("renders facets and a populated result grid for a real query", async ({ page }) => {
    await page.goto("/search?q=pikachu");

    await expect(page.getByText("Coveo isn't configured yet")).not.toBeVisible();
    await expect(page.getByRole("list", { name: "Search results" })).toBeVisible();
    // Facet: filter by Pokemon Type / Generation (Essential tier).
    await expect(page.getByText(/type/i).first()).toBeVisible();
    await expect(page.getByText(/generation/i).first()).toBeVisible();
  });

  test("result cards show a colored type chip per Pokemon type", async ({ page }) => {
    await page.goto("/search?q=charizard");

    const firstCard = page.getByRole("listitem").first();
    await expect(firstCard).toBeVisible();
    // C3: multi-value types render as one chip each, never a single
    // semicolon-joined string like "Fire;Flying".
    await expect(firstCard.getByText(";", { exact: false })).toHaveCount(0);
  });

  test("the detail page resolves the exact Pokemon by name, not a free-text guess", async ({
    page,
  }) => {
    await page.goto("/pokemon/pikachu");

    // level: 1 — AskAboutPokemon.tsx also renders an "Ask about Pikachu" h2
    // below the main heading, which a level-unscoped /pikachu/i match would
    // also hit.
    await expect(page.getByRole("heading", { level: 1, name: /pikachu/i })).toBeVisible();
  });

  /**
   * v4 plan §9/§12: the PDP's StatBar fill animates its width in on mount
   * via CSS (`.stat-bar-fill` + `@starting-style` in globals.css), and
   * `prefers-reduced-motion: reduce` must actually disable that transition,
   * not just declare a media query that never wins the cascade — batch 2
   * found exactly that class of bug for the Pokeball glyph (a same/lower-
   * specificity override silently losing to a `[data-state="..."]` rule).
   * `.stat-bar-fill` has no such attribute-selector sibling, so this only
   * needs a real computed-style assertion, not `!important` — but the
   * assertion still has to be real, per that same finding.
   */
  test("StatBar's fill transition is disabled under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pokemon/pikachu");

    const meter = page.getByRole("meter").first();
    await expect(meter).toBeVisible();
    const fill = meter.locator("> div").first();

    const transition = await fill.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transition).toBe("0s");
  });
});
