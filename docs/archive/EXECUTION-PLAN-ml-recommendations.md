# Execution Plan — ML Recommendations, ART, and the Similar/Recommended/Popular Decision

Status: **resolved.** Branch B was chosen (usage volume too low for CR to
be honest); ART was enabled and verified. See `docs/HANDOFF.md`'s
twentieth-session entry for the console changes made and the decision
record.

Scope: which Coveo ML capability (if any) backs three requested surfaces —
"Similar," "Recommended," and "Popular" Pokemon — plus a standalone
recommendation to enable Automatic Relevance Tuning (ART) regardless of that
decision. No code in this doc; it produces a console-configuration sequence
and an ADR. `docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md` builds the UI
once this doc's branch is chosen.

---

## 0. Why this doc exists

The app already uses four Coveo ML surfaces: Generated Answers (RGA), Passage
Retrieval, Query Suggestions (typeahead), and Automatic Facet Generation. Two
more were asked about explicitly: a "similar/recommended Pokemon" feature on
the PDP, and "other ML models" the org isn't using yet. Both questions
collapse into the same decision — which of Coveo's ML models, if any, are
worth adding given this specific org's real usage-analytics volume — so
they're handled together here instead of as two separate features guessed at
independently.

## 1. What Coveo actually offers here

Researched via WebSearch against docs.coveo.com this session; **re-verify by
fetching each page directly before acting on it**, per `CLAUDE.md`'s
docs-first rule — a search snippet is not the same as reading the live page.

### Content Recommendation (CR) — `docs.coveo.com/en/3387`, `/en/3399`, `/en/1886`

The correct fit for "Recommended" and "Popular." (Product Recommendations,
Coveo's other recommendation model family, is commerce-only and doesn't apply
to a content index like this one — ruled out, not overlooked.) CR learns from
click/view usage-analytics events across all users' past sessions and can
recommend either personalized-to-session items or, via its "popular items"
strategy and padding parameter, simply the most-viewed items overall — which
would cover "Popular" without a second model.

**The one number that decides everything here**: Coveo's own guidance is that
a usage-analytics dataset of roughly 10,000+ queries is typically where CR
recommendations become reliably relevant. Below that, a CR model still runs
and still returns *something*, but it's effectively guessing — which fails
this project's own no-fabricated-data posture in spirit even though the
mechanism is real Coveo ML and not literally invented data. A "Recommended
for you" section built on a cold-start model is worse than no section.

### Automatic Relevance Tuning (ART) — `docs.coveo.com/en/3384`, `/en/1013`, `/en/l1ca1038`

A different mechanism, and the one recommendation in this doc that isn't
gated on the analytics-volume question. ART learns from click-and-search
sequences that happen within the *same visit* (not cross-session history like
CR), and boosts the ranking score of roughly the five best results for a
given query. It's console-only — associates with the existing `Pokedex` query
pipeline, zero application code changes, fully reversible by disassociating
it. Coveo's own docs state that pairing ART with Query Suggestions (which
this org already has live for typeahead) "can significantly improve
relevance for end users performing manual queries" — i.e., it's designed to
complement exactly the capability already shipped, not replace it.

**Recommendation: enable ART regardless of the CR decision below.** It's
low-risk, needs less usage history than CR to start being useful (same-visit
click sequences accumulate faster than the cross-session data CR needs), and
directly improves the search results every other feature in this app is
built on top of.

### Query Suggestions — already live

Worth naming explicitly so this doc doesn't propose something redundant: the
QS model already live for typeahead factors in "popular trends" per its own
model card. Some of what "Popular" might mean is arguably already answered by
existing typeahead behavior — a reason to lean toward CR's "popular items"
strategy specifically for a *Pokemon* surface (which QS doesn't provide;
QS's popularity is about *queries*, not *items*) rather than assuming Popular
needs its own from-scratch model.

## 2. Open decision — blocks everything else in this doc

**Action**: pull up Analytics → Usage Analytics in the live Coveo admin
console (exact menu path to be confirmed against the live console — this
org's console has diverged from generic docs before, per
`docs/HANDOFF.md`'s "Documentation findings") and read the actual historical
query count.

**Branch A — usage volume is in or near CR's useful range.**
- Build "Similar," "Recommended," and "Popular" as CR-backed surfaces. Confirm
  against `docs.coveo.com/en/1886` (CR implementation overview) whether these
  need one CR model with different request parameters per surface, or
  separate models — don't assume without reading it.
- CR has its own REST endpoint, separate from both the Search API and Passage
  Retrieval — a new server route (`/api/recommendations`, modeled on
  `src/app/api/passages/route.ts`'s shape: `resolveServerCoveoConfig()` gate,
  rate-limit bucket, escaped-name filter) is needed regardless of model count.
- **Do not assume the API key privilege CR needs matches Passage Retrieval's
  `EXECUTE_QUERY` finding from ADR-0008.** That finding was itself a reversal
  of an earlier assumption (`ALLOW_CONTENT_PREVIEW` looked right and wasn't) —
  test CR against the live org directly and document whatever privilege
  actually works, the same way ADR-0008 did.

**Branch B — usage volume is too low for CR to be honest.**
- Ship "Similar" only, as a deterministic same-type/same-generation Search
  API query (fully speced in `docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`
  — no ML model, no cold-start risk, always has real data to show).
- Do not build "Recommended" or "Popular" as their own surfaces yet — document
  in the ADR below that CR is the intended future path once analytics
  accumulate, rather than silently dropping the ask.
- Still enable ART (§1) — it doesn't depend on this branch.

## 3. Before touching the console

For every console action either branch implies (creating/enabling ART,
creating a CR model, associating either with the `Pokedex` pipeline):

1. Fetch the specific docs.coveo.com page for that exact action directly.
2. Compare it against what the live console actually shows.
3. Log the page URL, why it was read, and whether it matched or diverged,
   under `docs/HANDOFF.md`'s "External docs.coveo.com pages read this
   session" section.
4. Only then give the console steps as an explicit numbered sequence
   (menu path → field/option → value).

## 4. Output of this doc

- `docs/adr/0014-recommendation-strategy.md` — written once the branch is
  chosen. Documents which branch, the actual analytics number that decided
  it, and (if Branch A) the actual API-key privilege CR needed.
- A `docs/HANDOFF.md` update recording the console changes made (ART
  enabled/associated; CR model created and associated, if Branch A) and the
  docs.coveo.com pages read.
- Unblocks `docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`, which is
  written to consume either branch's data shape identically.
