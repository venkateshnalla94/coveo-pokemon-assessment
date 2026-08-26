---
name: technical-deepdive-doc
description: Template and structure for the Topic 1 panel presentation — the technical deep dive on the Coveo configuration built. Use when drafting or reviewing presentation/topic1-technical-deepdive.md.
---

# Technical deep dive doc

Audience is Coveo experts. This is not a demo — it's a walkthrough of what was built and why, plus what was learned. Structure:

## 1. What was built (Essential + Intermediate)

- Source/crawler configuration: inclusion/exclusion scope, extraction approach (link to `docs/coveo-source-spec.md`).
- Frontend: framework choice (Headless SDK + Next.js), facets (Type, Generation), result rendering (image), hosting (GitHub + Vercel).

## 2. Why this architecture

For each non-obvious decision, state the alternatives considered and why this one won. At minimum cover:
- Headless vs. Atomic — why Headless was chosen (full control over UI/state vs. faster setup with less customization).
- Web crawler vs. Push API for indexing — why crawling was chosen (or not).
- Next.js vs. plain React/Vite — routing needs (Pokemon Detail Page), deployment fit with Vercel.

## 3. Advanced / Bonus status

For each optional item (RGA, Query Suggest, Detail Page, Passage Retrieval):
- If built: what it does and one thing learned building it.
- If skipped: an explicit, stated reason (time, scope, access blocker) — an unexplained gap reads worse than a justified skip.

## 4. What was learned

Genuine takeaways from the build — something that was surprising, a Coveo concept that clicked, a tradeoff that only became clear hands-on. This is what separates "I followed the checklist" from "I understand the platform."

## Delivery notes

~20 minutes of content, leaving room for Q&A from a technical panel. Expect deep-dive questions on the architecture decisions in section 2 — be ready to defend them, not just recite them.
