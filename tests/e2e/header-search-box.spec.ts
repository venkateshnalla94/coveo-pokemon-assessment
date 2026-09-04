import { expect, test } from "@playwright/test";

/**
 * Regression guard for the sticky-header change: AppHeader now shows its
 * own compact `<SearchBox>` on some routes (PDP, `/compare`) but
 * deliberately not on Home or `/search`, since both of those already have
 * their own dedicated search box elsewhere on the page. Two simultaneously-
 * mounted `buildSearchBox()` controllers never mirror each other's typed
 * text (each reads its own `engine.state.querySet[id]`, seeded once at
 * construction — confirmed against the installed @coveo/headless source),
 * so a second box anywhere would be a real, silently-diverging bug, not
 * just visual clutter. This suite asserts the actual invariant that matters
 * — exactly one combobox per route — everywhere, not just incidentally
 * (a11y-motion.spec.ts's Home keyboard-typeahead test happens to exercise
 * this on "/" today, but wasn't written to guard it and doesn't cover the
 * other three routes).
 *
 * Configured-only, same gate as search.spec.ts: these routes need a live
 * Coveo org actually returning results (PDP/`/compare` resolve a real
 * Pokemon; `/search` needs real results to render its own box).
 */
test.describe("header search box (configured)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    "needs a configured Coveo org (NEXT_PUBLIC_COVEO_ORGANIZATION_ID)",
  );

  const routes: Array<{ name: string; path: string }> = [
    { name: "Home", path: "/" },
    { name: "search results", path: "/search?q=pikachu" },
    { name: "Pokemon detail", path: "/pokemon/eevee" },
    { name: "compare", path: "/compare?names=Eevee,Pikachu" },
  ];

  for (const { name, path } of routes) {
    test(`${name} (${path}) has exactly one search box, never two`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("combobox")).toHaveCount(1);
    });
  }

  test("header stays pinned to the viewport top while scrolling on /search", async ({ page }) => {
    await page.goto("/search?q=pokemon");
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();

    await page.mouse.wheel(0, 2000);
    // A sticky header still reports y=0 relative to the viewport after
    // scrolling — a plain-flow header would have scrolled up and out.
    await expect
      .poll(async () => (await header.boundingBox())?.y)
      .toBe(0);
  });
});
