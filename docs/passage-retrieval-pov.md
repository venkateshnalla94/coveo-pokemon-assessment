# Point of view: Passage Retrieval vs. RGA

Written for the Bonus tier's stated floor: "understand the Passage Retrieval API and have a point of view on how you would use it in future use cases." This is the E4 deliverable tracked in `plan101.md` and `docs/handoff/`.

## What each API actually does

Both sit on top of the same indexed content (`Pokedex - Full`) and the same embeddings (Passage Retrieval and Semantic Encoder share content by requirement — see `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md`). The difference is what they hand back.

**Relevance Generative Answering (RGA)** takes a query, retrieves relevant content across the index, and returns one synthesized answer — a generated sentence or paragraph with citations back to source items. The app doesn't touch this directly; it's a Headless controller (`buildGeneratedAnswer`) surfaced by `GeneratedAnswer.tsx` on the search results view.

**Passage Retrieval (CPR)** takes a query and returns a ranked list of raw passage chunks — no synthesis. Each item carries `text` (crawled markdown), a `relevanceScore`, and the source `document`. Nothing interprets the text; that's left to whatever calls the API. This app's `POST /rest/search/v3/passages/retrieve` request also isn't shaped like an ordinary Search API v2 call — `pipeline` is silently ignored, `aq`/`cq` are silently ignored, and the actual scoping mechanism is `filter` (e.g. `@pokemonname=="Eevee"`), with `localization` required in the body. That schema mismatch is documented in ADR-0008 and cost a debugging session to find, because the console docs for CPR don't surface it — the request-shape reference is a separate page (docs.coveo.com/en/o86c8334).

## The tested contrast

Same style of question, same underlying content, two different APIs:

- **RGA, "how does Eevee evolve"** — a clean synthesized sentence citing `[1] Eevee`. One answer, ready to display as-is.
- **CPR, a similar question about Pikachu** — three raw chunks: an info table, a moves table, and an unrelated FAQ link. No sentence, no synthesis. Correctly *relevant* (all three passages are genuinely about Pikachu), but none of them individually answers the question — a downstream consumer has to read and interpret them.

This isn't a quality gap in CPR. It's the API keeping a decision — how to phrase the answer, what to include, what to omit — that RGA makes for you. CPR hands back evidence; RGA hands back a conclusion.

## Where each one fits

**RGA is the right default when the goal is "answer the user's question directly."** It's a search-results-page feature: one query in, one readable answer out, minimal integration work. Its cost is that you give up control over phrasing and source selection — you get what the model decided to synthesize, and if a customer's compliance posture requires citing exact source text rather than a paraphrase, RGA's output is one more hop removed from the original document than CPR's is.

**CPR is the right choice when something downstream needs to do its own reasoning over retrieved evidence, not just display an answer.** Three cases where that shows up in enterprise deployments:

1. **RAG pipelines feeding a different LLM or agent.** If the actual consumer is a customer-support copilot, an internal chatbot, or an agent doing multi-step reasoning, that consumer wants raw, scored passages to build its own prompt context — not a pre-written sentence it then has to unwrap or fight against. This is CPR's core use case, and it's why the API doesn't synthesize: synthesis is exactly the step the downstream system wants to own.
2. **Structured or tabular source content.** Pokemon stat tables and move lists are a small-scale example of a broader enterprise pattern — product spec sheets, pricing tables, compliance matrices — where a prose answer loses information a table preserves. CPR returning the raw table chunk (as it did for Pikachu) is arguably more useful there than a flattened RGA sentence would be, precisely because it doesn't collapse the structure.
3. **Auditability and precise sourcing.** Regulated or high-stakes domains (legal, healthcare, financial services) often need to show exactly what text a claim is based on, not a paraphrase of it. CPR's raw passages with per-chunk relevance scores are closer to an audit trail than a generated answer is.

## What this app builds on that distinction

`AskAboutPokemon.tsx` (mounted on the Pokemon detail page) deliberately uses CPR, not RGA, and deliberately doesn't try to make CPR's output *look* like an RGA answer. It shows numbered passages with relevance scores and renders the markdown as-is (including tables), scoped to the single Pokemon on the page via `filter`. That's the honest way to expose this API: RGA answers a question, CPR shows its work. Building a UI that hides CPR's chunk boundaries and relevance scores behind an "answer" framing would misrepresent what the API is actually doing — which is the mistake worth naming as a point of view, not just a UI preference.

## Summary

Reach for RGA when the product surface wants a finished answer and can tolerate giving up control over its exact wording. Reach for Passage Retrieval when something else — a pipeline, an agent, a compliance requirement, a UI that wants to show sourcing — needs the retrieved evidence itself, not someone else's summary of it. They're not competing implementations of "search with AI"; they hand off the same retrieval work at different points before or after the synthesis step.
