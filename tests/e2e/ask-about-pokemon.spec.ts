import { expect, test } from "@playwright/test";
import { CONTENT } from "@/content/pokedex";

/**
 * Bonus-tier "Ask about this Pokemon" (Passage Retrieval) golden path —
 * skipped entirely unless NEXT_PUBLIC_COVEO_ORGANIZATION_ID is set, same gate
 * as search.spec.ts. AskAboutPokemon only mounts once the detail page has
 * resolved a real item (see the `item &&` block in
 * src/app/pokemon/[name]/page.tsx), so there's no meaningful unconfigured
 * variant to cover here the way unconfigured.spec.ts covers the rest of the
 * app. The question text and expected passage count ("how does this evolve"
 * on Eevee returning exactly 3 scoped passages) match already-verified live
 * behavior — see the Stage E section of docs/HANDOFF.md — not a guess at a
 * new query.
 */
test.describe("ask about this Pokemon (configured)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    "needs a configured Coveo org (NEXT_PUBLIC_COVEO_ORGANIZATION_ID)",
  );

  test("returns scoped passages with relevance scores for a real question", async ({ page }) => {
    // Regression guard: every passage in a response is scoped to the same
    // document (filter: '@pokemonname=="..."'), so multiple passages share
    // one document.primaryid — a naive key={document.primaryid} on the list
    // produces a real React duplicate-key warning here, caught live via a
    // manual walkthrough of this exact flow on Charizard.
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/pokemon/eevee");

    const input = page.getByPlaceholder(/how does eevee evolve/i);
    await input.fill("how does this evolve");
    await input.press("Enter");

    // Direct children only — a passage's rendered markdown can itself contain
    // list markup (e.g. an evolution-methods bullet list), which would also
    // match a bare getByRole("listitem") and inflate the count.
    const passages = page.locator('[aria-label="Passages"] > li');
    await expect(passages).toHaveCount(3);
    for (const passage of await passages.all()) {
      await expect(passage.getByText(/Relevance: \d+(\.\d+)?%/)).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
  });

  test("disables the Ask button until a question is typed", async ({ page }) => {
    await page.goto("/pokemon/eevee");

    const input = page.getByPlaceholder(/how does eevee evolve/i);
    const askButton = page.getByRole("button", { name: CONTENT.pdp.askButtonLabel });

    await expect(askButton).toBeDisabled();

    await input.fill("how does this evolve");
    await expect(askButton).toBeEnabled();

    await input.fill("   ");
    await expect(askButton).toBeDisabled();
  });
});
