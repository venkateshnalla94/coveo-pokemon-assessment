# 0006: Split into two API keys — Custom purpose can no longer grant Execute queries or Analytics-Push

Status: Accepted

## Context

ADR-0005 specified a single `COVEO_API_KEY` carrying three privileges: Search – Execute queries, Analytics – Push, and Machine Learning – Allow content preview. Building that key in the actual admin console during Stage D (`docs/plan101.md` D1) showed this assumption no longer holds:

- The **Custom** key purpose's Privileges step (verified directly in the console, both by category listing and by inspecting the Analytics domain's dropdown) does not offer Execute queries as a Search domain row, and its Analytics data row's dropdown only offers `View` or `— (no access)` — no `Push`.
- The console's own "Security safeguards" banner states the reason: *"After an API key is created, its privileges cannot be modified, and certain privileges are now limited to predefined templates."* Execute queries and Analytics-Push are apparently now restricted to predefined key-purpose templates (e.g. "Anonymous search"), not assignable via Custom.
- A key created with the **Anonymous search** template does carry Execute queries and Analytics-Push — confirmed in-console — but that template also bundles **Search – Impersonate: Allowed**, a privilege this app has no use for (pokemondb content has no per-user permission model) and would not have chosen deliberately.
- ML – Allow content preview is not part of the Anonymous search template and is only grantable via Custom.

No single key can therefore carry exactly {Execute queries, Analytics-Push, Allow content preview} with nothing extra. This may be specific to this trial org's current console build rather than a documented, stable platform behavior — docs.coveo.com's generic privilege reference still describes Execute queries and Push as ordinary assignable privileges with no template restriction called out. Treat this ADR's premise as "true for this org as observed on 2026-08-26," not as a durable platform fact to cite in the Topic 1 deck without the console screenshot evidence behind it.

## Decision

Use two server-only keys instead of one:

- **`COVEO_API_KEY`** — created with the **Anonymous search** purpose. Carries Execute queries + Analytics-Push (+ the unwanted, unavoidable Impersonate). Used exclusively by `/api/token` to mint search tokens. RGA does not need a separate key here — RGA answers are returned as part of the normal search response once the model is associated to the `Pokedex` pipeline, so the token-minting key's Execute-queries privilege is sufficient.
- **`COVEO_ML_API_KEY`** — created with the **Custom** purpose, granting only ML – Allow content preview. Used exclusively by `/api/passages` for the Passage Retrieval call.

Implementation: `src/coveo/config.ts`'s `resolveServerCoveoConfig()` returns both `apiKey` and `mlApiKey` from `COVEO_API_KEY` / `COVEO_ML_API_KEY` respectively; `/api/token/route.ts` reads `apiKey`, `/api/passages/route.ts` reads `mlApiKey`.

Naming convention: `Pokedex - Content Preview` for the Custom key, keeping the `Pokedex - X` prefix already used for the two sources (`Pokedex - Test`, `Pokedex - Full`).

## Consequences

- `COVEO_API_KEY` carries Impersonate even though the app never exercises it — no code path ever sends a user identity to impersonate. This is an accepted, documented residual privilege, not a gap: the key is server-only (never `NEXT_PUBLIC_*`, per ADR-0005), so it isn't reachable from the browser either. Worth naming proactively in the Topic 1 deck's security section rather than waiting for it to be found.
- Two keys to track and rotate/expire instead of one. `COVEO_ML_API_KEY` (Custom purpose) requires an explicit expiration date at creation — set past the 2026-09-06 presentation deadline.
- If Passage Retrieval enablement never lands on the trial org, `COVEO_ML_API_KEY` still gets created (Custom doesn't gate on the extension being enabled) but `/api/passages` will surface Coveo's 403 unchanged, same fallback behavior ADR-0005 already accounts for.
- This narrows scope further than ADR-0005's original single-key design intended — arguably a better outcome for least-privilege than what was originally planned, even though it wasn't the goal going in.
