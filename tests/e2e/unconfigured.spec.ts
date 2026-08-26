import { expect, test } from "@playwright/test";

/**
 * Smoke tests only — this asserts today's real, unconfigured-Coveo behavior
 * rather than a placeholder. This is real shipped behavior (fork/preview
 * builds without `.env.local` hit it, not just CI), so it's a permanent
 * suite, not a stand-in deleted once a Coveo org exists — see C7 in
 * docs/EXECUTION-PLAN.md. The configured golden path (actual search
 * results, facets, chips) lives in search.spec.ts, gated to skip until
 * NEXT_PUBLIC_COVEO_ORGANIZATION_ID is set. See docs/standards-adoption.md #12.
 */
test.describe("homepage", () => {
  test("has a title and always shows the search box, even when Coveo isn't configured", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Pokedex Search/);
    await expect(page.getByPlaceholder("Search for a Pokemon...")).toBeVisible();
    await expect(page.getByText("Coveo isn't configured yet")).not.toBeVisible();
  });

  test("surfaces a config-error popup only once the user tries to search", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("Search for a Pokemon...");
    await input.fill("pikachu");
    await input.press("Enter");

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("Coveo isn't configured yet")).toBeVisible();
    // Submitting doesn't navigate away while unconfigured.
    await expect(page).toHaveURL("/");
  });
});

test.describe("search results route", () => {
  test("renders without crashing and shows the config banner when Coveo isn't configured", async ({
    page,
  }) => {
    await page.goto("/search?q=pikachu");

    await expect(page).toHaveTitle(/Pokedex Search/);
    await expect(page.getByRole("link", { name: /Back to home/i })).toBeVisible();
    await expect(page.getByText("Coveo isn't configured yet")).toBeVisible();
  });

  test("also renders when reached directly without a q param", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByText("Coveo isn't configured yet")).toBeVisible();
  });
});

test.describe("pokemon detail route", () => {
  test("renders without crashing and links back to search", async ({ page }) => {
    await page.goto("/pokemon/pikachu");

    await expect(page.getByRole("link", { name: /Back to search/i })).toBeVisible();
    await expect(page.getByText("Coveo isn't configured yet")).toBeVisible();
  });
});
