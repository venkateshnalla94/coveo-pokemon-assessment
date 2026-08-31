# Topic 2: Escalation & Recovery

Scenario (per `Technical_Challenge_-_FDE.pdf`): a large customer's search platform is intermittently failing under peak traffic, reporting rapid business impact. ~20 minutes of content, room for Q&A. This is an operational-leadership exercise — judgment and communication, not code. Structure follows `.claude/skills/escalation-recovery-playbook`.

Note: the challenge's other source document (the .txt spec) instead asks for "identify an enterprise customer who could benefit from a similar Coveo solution." Both requirements exist in the two source documents; this file covers only the Escalation & Recovery variant. The enterprise-customer variant is a separate, not-yet-started deliverable — see the open item at the end of this file.

## 1. Root-cause analysis approach

Don't diagnose from the headline. "Peak traffic + intermittent" narrows the hypothesis space toward capacity/throttling, but naming that as *the* cause before pulling any data is exactly the move that weakens credibility with a technical panel — the goal here is showing the method, not guessing well.

**Phase 1 — establish impact, before touching a root cause.**

- Business: which experiences are affected (search only, RGA, recommendations)? What percentage of users? What's the revenue/conversion/customer-service impact?
- Technical: error rate, latency (p50/p95/p99), which APIs, which geography, which Search Hub, traffic profile, timestamps, and correlation with any recent deployment or configuration change.

**Phase 2 — establish the fault domain**, walking the request path layer by layer rather than guessing which one is broken: client → network/CDN/gateway → authentication → Search API → query pipeline → search/ML/GenAI services → content/index → customer integrations. At each layer, ask whether this is a Coveo-platform problem, a customer-implementation problem, an integration problem, a traffic/capacity problem, or a configuration problem — the same "platform vs. customer vs. capacity vs. config" split matters because the fix and who owns it differ completely between them.

This project's own build has a live, concrete instance of exactly this layered discipline: a "sort keeps breaking the page" symptom turned out to have two separate, independently-diagnosed causes at different layers — an `InvalidSortValueException` from an un-sortable field (a config-layer issue, fixed with a graceful fallback), and a `URLSearchParams.toString()` `+`-vs-`%20` encoding bug that corrupted *any* space-containing sort criterion or facet value on URL round-trip (an application-layer bug, found by reading Headless's own source rather than guessing). Both looked like the same symptom from the outside; neither fix alone would have fully resolved it. That's the same "don't stop at the first plausible layer" discipline this phase calls for.

## 2. Short-term remediation plan

Priority for a SEV1-type situation is not an elegant root-cause fix — it's restoring acceptable service while investigation continues. Options, chosen based on what Phase 1/2 evidence actually points to:

- Roll back a recent configuration or deployment change, if timestamps correlate.
- Temporarily disable expensive or non-essential functionality (an ML model, a heavy query pipeline stage) under load.
- Degrade gracefully: fall back from a generative experience to conventional search results rather than failing the whole request.
- Introduce controlled degradation, cache safe responses, reduce unnecessary requests, tune retry/backoff behavior, isolate the failing workflow, or redirect traffic — whichever combination the evidence actually supports.

The operating principle: protect the customer's critical journey while investigation continues. This is safe to do *before* full RCA is complete precisely because none of it is a permanent fix — it buys time without foreclosing the real diagnosis.

## 3. Communications to executives

Don't hand an executive the engineer's own language. Compare:

> "We're experiencing intermittent 429/5xx responses and elevated p99 latency from Search API calls, correlated with a traffic spike starting at 14:02 UTC..."

against what actually goes out:

> "Search availability is degraded during peak traffic and is affecting approximately X% of customer sessions. We've isolated the problem to [area] and deployed a mitigation that has reduced the error rate from X% to Y%. The platform is currently stable while engineering validates the underlying cause. Our next update will be at 3:30 PM."

Four things every executive update carries: what's broken, who's affected, what's being done right now, and when the next update lands. Full technical detail goes to engineers separately, not folded into the same message — that separation is itself the skill being demonstrated: moving between business context and deep technical execution without making either audience translate the other's language.

## 4. Plan to prevent recurrence

Tied directly to whatever Phase 1/2 actually found — not a generic "add more monitoring" ask disconnected from the incident.

**Immediate follow-ups**: a post-incident review naming the specific fault-domain layer(s) implicated, closing whatever alerting gap let the issue reach customer-visible impact before detection, and — if the root cause was capacity-related — an immediate look at current rate limits/quotas against actual peak-traffic patterns.

**Structural changes**: capacity planning ahead of known peak events (not reactive), load testing that specifically exercises the failure mode found, and — if the root cause turned out to be a customer-integration issue rather than a platform issue — a conversation with the customer about their own request patterns (caching, backoff behavior) rather than treating it as solely Coveo's fix to make.

Both tiers should map back to a named finding from section 1, not exist as boilerplate resilience asks that would apply to any incident regardless of what actually happened.

## Open item — not covered by this file

The challenge's other source document (`Pokemon Challenge (Pre-Sales) - 2026.txt`) specifies a different Topic 2: identify an enterprise customer from past or present experience who could benefit from a similar Coveo solution, and present the value proposition. That's a separate deliverable with no draft yet — worth opening the actual panel session by confirming which Topic 2 the panel wants, with both prepared, per `docs/archive/EXECUTION-PLAN.md`'s own noted resolution to this document conflict.
