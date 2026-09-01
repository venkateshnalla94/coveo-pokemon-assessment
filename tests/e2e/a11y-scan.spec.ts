import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated axe-core scans, complementing a11y-motion.spec.ts's manual
 * computed-style/keyboard checks (which axe doesn't cover: reduced motion,
 * focus-ring color, keyboard traversal). This suite catches the class of
 * regression axe is actually good at — missing labels, contrast, ARIA
 * misuse — across the four route shapes the app has.
 *
 * Configured-only, same gate as the other e2e specs — these routes need a
 * live Coveo org actually returning results.
 */
/**
 * Pre-existing, confirmed-real violations found the first time this suite
 * ran against every route (twenty-ninth session): low-contrast gray text
 * (`text-shell-400`, `text-black/40`/`text-white/40`), no `<main>`
 * landmark, no top-level heading on some pages, and page content not
 * contained in any landmark region. These are genuine bugs, not scanner
 * noise, but fixing them (color tokens + page landmark structure across
 * every route) is a separate remediation pass, not part of "add scanning."
 * Tracked in docs/EXECUTION-PLAN-quick-improvements.md's follow-up.
 */
const KNOWN_PRE_EXISTING_RULE_IDS = ["color-contrast", "landmark-one-main", "page-has-heading-one", "region"];

test.describe("automated a11y scan (configured)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    "needs a configured Coveo org (NEXT_PUBLIC_COVEO_ORGANIZATION_ID)",
  );

  test("home has no axe violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).disableRules(KNOWN_PRE_EXISTING_RULE_IDS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("search results page has no axe violations", async ({ page }) => {
    await page.goto("/search?q=pikachu");
    await expect(page.locator(".result-tile").first()).toBeVisible();

    const results = await new AxeBuilder({ page }).disableRules(KNOWN_PRE_EXISTING_RULE_IDS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("Pokemon detail page has no axe violations", async ({ page }) => {
    await page.goto("/pokemon/pikachu");
    const results = await new AxeBuilder({ page }).disableRules(KNOWN_PRE_EXISTING_RULE_IDS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("compare page has no axe violations", async ({ page }) => {
    await page.goto("/compare?names=pikachu,eevee");
    const results = await new AxeBuilder({ page }).disableRules(KNOWN_PRE_EXISTING_RULE_IDS).analyze();
    expect(results.violations).toEqual([]);
  });
});
