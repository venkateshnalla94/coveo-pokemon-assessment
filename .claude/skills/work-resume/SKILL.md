---
name: work-resume
description: Resume pending project work for one bounded task per session — from docs/HANDOFF.md's "What's next," or from a specific execution-plan doc the user names. Plans, researches Coveo docs, implements, tests, updates HANDOFF.md and the plan doc, and hands back a ready-to-paste prompt for the next session. Use when the user says "resume work," "pick up where we left off," or points at a specific execution plan to run.
---

# Work resume

Runs one session's worth of project work end to end, then stops — deliberately, so
a session never tries to burn through the whole backlog and blow its context
budget. One task (or one user-approved batch) in, one clean handoff out, every
time. This is the mechanism behind the `docs/PROMPT-execute-*.md` pattern
already used in this repo (e.g. `docs/PROMPT-execute-responsive-ui.md`) —
this skill both consumes that pattern and produces the next one.

## 0. Pick the task source

- If the user's invocation names or points at a specific document (an
  execution plan under `docs/`, an ADR, anything under `docs/archive/`), read
  that document in full. Its own "Status"/scope section is the task list.
- Otherwise, read `docs/HANDOFF.md` top to bottom — the opening paragraph and
  the most recent session's "What's next" (or equivalent) are the source of
  truth for pending work. Do not go rummaging through git log or old plan
  docs for "other" pending work instead — HANDOFF.md is authoritative per
  `AGENTS.md`.
- Also read `CLAUDE.md` and `AGENTS.md` if this is a fresh session context —
  their process rules (no server layer, ADR-on-architectural-change, no
  fabricated data, docs-first for console actions) apply to whatever gets
  built here.

## 1. Scope to one task, out loud

State plainly what pending item(s) you found and propose exactly **one** task
(or, if the user already named a batch, that batch — don't silently expand
it) to execute this session. If HANDOFF.md lists several unrelated pending
items, pick the smallest coherent one and say why, rather than asking the
user to prioritize from scratch. Then ask, via AskUserQuestion, whether to
enter Plan Mode for this task before any research or code changes — this
mirrors `CLAUDE.md`'s "Working style" rule (reasoning on the table before
implementing) and gives the user a checkpoint before the session commits its
context budget to one direction.

## 2. Plan and research

In Plan Mode (or inline if the user declined plan mode for a small task):

- Do the design/approach analysis first — name the tradeoff or risk if the
  user's proposed approach (or the plan doc's) has one, per `CLAUDE.md`'s
  working style rule, before writing any code.
- For any step touching the Coveo admin console (source config, field
  mappings, IPEs, pipelines, ML model configuration), read the current
  docs.coveo.com page for that feature first — per `CLAUDE.md`'s docs-first
  rule. Do not answer from training-data memory of the console.
- Keep a running list as you go: each doc page read, why, and whether it
  matched or diverged from what you found live in the console. This becomes
  the HANDOFF.md log entry in step 5 — capture it now, don't reconstruct it
  from memory at the end.

## 3. Implement

Execute only the scoped task from step 1. If mid-implementation you find the
task is bigger than it looked, stop and re-scope with the user (per
AskUserQuestion) rather than quietly ballooning the session — that's the
exact failure mode this skill exists to prevent.

Follow existing repo conventions: reuse patterns over inventing new ones
(check `docs/adr/` and sibling components first), no server layer unless an
ADR already permits it, no fabricated Pokemon data.

## 4. Complete, test, review

- Run the relevant subset of `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run test:e2e` — whatever the change touches. Don't claim success from
  reading the diff alone; for any UI change, start `next dev` and check it in
  a real browser per `AGENTS.md`.
- If the change is a **functional change** (new behavior, a bug fix, a
  changed contract — not a pure style/doc change), write test cases covering
  it. `src/coveo/*` and `src/app/api/*/route.ts` are coverage-gated
  (`npm run test:coverage`, see `docs/standards-adoption.md` #12) — check
  that gate specifically if the change touches those paths.
- Self-review the diff (or run `/code-review` if the change is non-trivial)
  before calling it done.
- If this session made a new architectural decision, or reversed one, write
  the ADR under `docs/adr/` now — not as a follow-up.

## 5. Close out the paperwork

Do all four, in order, before ending the session:

1. **Update the execution plan doc** (the one from step 0, or create one if
   none existed) with what fraction of its scope is now done, and the doc
   pages read in step 2 (page, why, matched/diverged — same format as
   HANDOFF.md's existing "External docs.coveo.com pages read this session"
   sections). If the plan's scope is now fully shipped: update its Status
   header to "complete" with a note on what shipped and any deviations, move
   it to `docs/archive/`, and add one line to `docs/README.md`'s "Completed
   execution plans" list.
2. **Update `docs/HANDOFF.md`** with a new session entry, per `CLAUDE.md`'s
   process rule — this applies whenever org config, auth, or app-visible
   behavior changed, which most tasks from this skill will trigger. Match the
   existing file's voice: what was found, root cause (for bugs), what
   shipped, what was NOT verified (be honest about gaps — that's the file's
   established convention, not optional politeness).
3. **Log docs read** in HANDOFF.md's docs-read section for the session, even
   if step 5.2's entry already mentions some inline — keep the dedicated log
   section current so a future session can grep it.
4. **Write the next-session prompt.** Create (or overwrite)
   `docs/PROMPT-<short-task-slug>.md` following the exact pattern of
   `docs/PROMPT-execute-responsive-ui.md`: a short framing paragraph (what to
   read first, that it's a plain prompt doc since this repo has no
   `.claude/commands/`), then a pasteable block that names the next single
   task (or the next user-approved batch) — not the whole remaining backlog —
   telling the next session exactly what to read, what's already decided
   (don't re-litigate), and what "done" looks like. This is the mechanism
   that keeps each future session scoped to one task's worth of context
   instead of re-deriving everything from a sprawling backlog.

## Why this shape

The point isn't process for its own sake — it's that a session which tries
to "just finish the whole backlog" burns its context window re-reading
things, loses precision on later tasks, and produces a HANDOFF.md entry
nobody can trust. One scoped task, closed out completely with its own
paperwork and its own next-prompt, is cheaper end to end than a big session
that runs out of room halfway through.
