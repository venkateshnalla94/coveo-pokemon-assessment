import { expect, test } from "@playwright/test";

/**
 * Two contracts flagged as untested in `docs/EXECUTION-PLAN-v2.3-frontend.md`
 * §8 ("once v2.2 lands") and never actually added: Compare selection
 * surviving navigation (`docs/adr/0009-client-only-comparison-state.md`'s
 * whole reason to exist), and a deep-linked facet URL restoring search state
 * on a cold load (`SearchUrlSync.tsx`'s URL -> state direction). Both need a
 * live Coveo source, same as `search.spec.ts`.
 */
test.describe("state persistence (configured)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    "needs a configured Coveo org (NEXT_PUBLIC_COVEO_ORGANIZATION_ID)",
  );

  test("compare selection survives navigating away and back", async ({ page }) => {
    await page.goto("/search?q=pikachu");

    const card = page.getByRole("listitem").filter({ hasText: "Pikachu" }).first();
    await expect(card).toBeVisible();
    await card.getByRole("checkbox").check();

    const tray = page.getByRole("list", { name: "Selected for comparison" });
    await expect(tray).toBeVisible();
    await expect(tray.getByText("Pikachu")).toBeVisible();

    // Real navigation to the PDP, not just a state check in place — the
    // tray is mounted once in the root layout (ADR-0009), so it should
    // stay populated across a route change.
    await card.getByRole("link", { name: /pikachu/i }).click();
    await expect(page).toHaveURL(/\/pokemon\/Pikachu/);
    await expect(page.getByRole("list", { name: "Selected for comparison" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Selected for comparison" }).getByText("Pikachu")).toBeVisible();

    // Back to the search results the selection started on.
    await page.goBack();
    await expect(page).toHaveURL(/\/search\?q=pikachu/);
    await expect(page.getByRole("list", { name: "Selected for comparison" }).getByText("Pikachu")).toBeVisible();
    await expect(card.getByRole("checkbox")).toBeChecked();
  });

  test("a deep-linked facet URL restores its selection on a cold load", async ({ page }) => {
    // pokemonabilities isn't Automatic Facet Generation (docs/adr/0011), so
    // its presence doesn't depend on AFG's async, query-dependent selection
    // the way the type facet's does — a stable target for a cold-load test.
    await page.goto("/search?f-pokemonabilities=Static");

    const checkbox = page.getByRole("checkbox", { name: /static/i });
    await expect(checkbox).toBeChecked();
    await expect(page.getByRole("list", { name: "Search results" })).toBeVisible();
  });
});
