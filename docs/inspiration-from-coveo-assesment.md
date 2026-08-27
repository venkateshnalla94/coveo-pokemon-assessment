# Inspiration from coveo-assesment

A separate, more mature Coveo take-home project at `/Users/venalla/coveo-assesment` (same author, a commerce/catalog search app) has already worked through security hardening, an analytics abstraction, RGA behavior, markdown rendering of generative content, facets, and other standards. This doc mines it for patterns worth bringing into this Pokemon project — each entry names the source file over there, checks it against what this repo actually has today (not assumed), and gives a concrete next step. This is a recommendations list, not a status doc — `docs/HANDOFF.md` and `docs/plan101.md` stay the source of truth for what's actually built.

## Tier 1 — do soon, cheap, no real tradeoff

### 1. Git-hook secret scanning

Sibling repo: `scripts/secret-scan.mjs`, wired into `.githooks/pre-commit`. Regex-scans the staged diff for `COVEO_ACCESS_TOKEN`/`COVEO_PLATFORM_API_KEY`/`Authorization: Bearer ...`/PEM private-key blocks/generic 32+ char `api_key`/`token`/`secret` assignments. Placeholder-aware (`changeme`, `example`, etc. don't trip it). Installed automatically via `scripts/install-hooks.mjs` in the npm `prepare` lifecycle hook.

This repo's `scripts/install-hooks.mjs` (per `AGENTS.md`) currently only wires lint + typecheck into pre-commit — no secret scan, despite this project handling real Coveo API keys in `.env.local` throughout the session (`COVEO_API_KEY`, `COVEO_ML_API_KEY`, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`).

**Next step:** port a scaled-down version of `secret-scan.mjs` and add it as a step in this repo's existing pre-commit hook.

### 2. Markdown rendering for AskAboutPokemon's passage text

This directly answers the open question from earlier in this session about `src/components/AskAboutPokemon.tsx` rendering raw CPR passage text (`#`, `|`, `**` markdown syntax showing literally).

Sibling repo: `src/components/conversation/AgentMessage.tsx` uses `react-markdown` with only the `a` component overridden:

```tsx
const MARKDOWN_COMPONENTS: Components = {
  a: ({ children, ...props }) => (
    <a {...props} rel="noreferrer" target="_blank">{children}</a>
  ),
};
```

No `rehype-raw` plugin — raw HTML from indexed/generated content is never rendered, only markdown syntax is parsed. A minimal, safe default.

**Next step:** add `react-markdown` as a dependency, render `passage.text` in `AskAboutPokemon.tsx` through it with the same link-safety override, replacing the current raw `whitespace-pre-line` text dump.

**Caveat already confirmed live in this session:** pokemondb content is heavily tabular (stat tables, move lists, nav/footer), so clean markdown rendering fixes *readability*, not *relevance* — a "how does this evolve" question can still retrieve a moves table or sprite list as the "most relevant" chunk, because that's the shape the source content comes in. That's the retrieval-quality limitation already documented in `plan101.md`'s Stage D "known limitation" note (RGA/CPR only embed `body` in ~250-word chunks, and pokemondb pages aren't prose) — rendering doesn't fix it, and shouldn't be expected to.

### 3. CSP hardening parity

Sibling repo's CSP (`next.config.mjs`) adds `base-uri 'self'` and `form-action 'self'` on top of a header set otherwise already matching this repo's — confirmed directly: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(), camera=(), microphone=()` are already present in this repo's `next.config.ts`, byte-identical in intent. Not a gap — just two directives short.

**Next step:** add `base-uri 'self'` and `form-action 'self'` to `CONTENT_SECURITY_POLICY` in `next.config.ts` when D11 (already tracked in `plan101.md` — tightening the wildcard `connect-src` to the real org hostname) gets done. Same file, same pass, no reason to split it into two edits.

## Tier 2 — worth an explicit decision, not a blind port

### 4. RGA re-render on facet change

The user flagged this as something they'd worked on in the sibling repo. Investigated both sides before recommending anything:

**Sibling repo's behavior is deliberate, not a bug fix in the usual sense.** Its RGA panel (`src/components/generative/GenerativeAnswer.tsx`) is a hand-built component that fetches via a custom REST/SSE route, gated by a `useEffect` dependency array bound to `committedQuery` — explicitly *not* live facet state. The comment in `ProductDiscoveryExperience.tsx` states the reasoning directly: RGA/Trending are "isolated, non-product-search Coveo calls" that must "run once per search submission instead of once per keystroke" — and, by the same logic, not on every facet click either. This was tightened over several commits (`1fa3616e`, `b2324d31`, `16280656`) fixing over-firing and stale-response races, landing on: RGA answers stay pinned to the last committed query, facets don't trigger regeneration.

**This repo's `GeneratedAnswer.tsx` is architecturally different — the sibling's specific fix doesn't transfer.** It subscribes directly to Coveo Headless's native `buildGeneratedAnswer` controller on the shared `SearchEngine`, not a custom fetch effect:

```tsx
const [generatedAnswer] = useState(() => buildGeneratedAnswer(engine));
useEffect(() => generatedAnswer?.subscribe(() => setState(generatedAnswer.state)), [generatedAnswer]);
```

Whether the answer regenerates on a facet click is governed by Coveo's own controller logic tied to the engine's search-execution cycle — which facet changes do trigger, since facets and RGA share the same engine/pipeline here (unlike the sibling's fully separate custom provider).

**Next step:** don't port the sibling's fix — there's no equivalent effect array to constrain here. Instead, *verify* this repo's actual live behavior (does the Generated Answer box regenerate/flicker every time a Type or Generation facet is toggled?) and make an intentional, documented call either way — matching the sibling's ADR-driven style of deciding this on purpose, not leaving it as whatever Headless happens to do by default. If it does regenerate on every facet click and that's undesirable (extra RGA calls = extra cost on a paid feature, per `plan101.md`'s Stage D pricing awareness), that's worth its own ADR, same pattern as ADR-0008.

## Tier 3 — noted, deliberately not recommended for this project's scope

- **Analytics provider abstraction** (sibling's `src/features/analytics/analytics.tsx`, a clean `AnalyticsProvider` interface + `ConsoleAnalyticsProvider`/`CoveoAnalyticsProvider`/`NoopAnalyticsProvider`) — no analytics-tracking requirement exists for this project beyond Coveo's built-in Analytics-Push, already wired via the search key. Adding a tracking abstraction with no call sites that need it would be scope creep.
- **Typed feature-flag domain object + public/server runtime-config split** (sibling's `src/lib/runtime/runtime-config.ts`, `src/features/feature-flags/*`) — this repo's `resolveCoveoConfig()`/`resolveServerCoveoConfig()` (`src/coveo/config.ts`) already does the public/server key split that actually matters here. There's no multi-flag surface in this project to justify the sibling's heavier typed-domain-object pattern.
- **Facet UI patterns** (numeric range slider, star-rating control, active-filter chip bar) — sibling's facets are numeric/hierarchical (price, rating); this repo's `pokemontype`/`pokemongeneration` are both plain multi-value facets. Not applicable.
- **Answer banner typewriter/preview animation** — a UX nicety (bounded-duration reveal effect, capped preview string) worth a passing mention if there's spare polish time before the panel, not a real recommendation given nothing in the challenge's tiers asks for it.
- **`ConfigurationNotice`-style single-component consolidation** of this repo's `CoveoConfigBanner`/`ConfigRequiredDialog` into one variant-driven component — cosmetic, low value at this project's size (two small components, not a proliferating set).
