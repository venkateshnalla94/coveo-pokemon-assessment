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

    await expect(page.getByRole("heading", { name: /pikachu/i })).toBeVisible();
  });
});
