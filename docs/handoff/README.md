# docs/handoff/ — how this directory works

Replaces the old single `docs/HANDOFF.md` (1,500+ lines and growing every
session). Split into four pieces so a normal session reads a small amount of
current state instead of the whole build history:

- **`STATE.md`** — evergreen current state: Org details, What's done, What's
  next (priority order), Documentation findings, Traps, Reference docs. Read
  this every session. Edited in place as facts change — it is not a log, so
  it never grows unbounded.
- **`LATEST.md`** — the in-progress batch of session log entries, newest
  first, same voice as the old HANDOFF.md sections (what was found, root
  cause, what shipped, what wasn't verified). Read this every session too —
  it holds at most 10 entries.
- **`INDEX.md`** — one row per session ordinal, mapping it to the file that
  holds it (`LATEST.md` or an `archive/*.md`). Use it to resolve any "session
  N" reference (from `DESIGN.md`, an ADR, etc.) without scanning archives.
- **`archive/sessions-NNN-NNN.md`** — closed-out batches of 10 sessions each,
  in the same newest-first order they were written. Only open one of these
  when a task specifically needs history that far back — look up the right
  file in `INDEX.md` first, don't read an archive top to bottom "just in
  case."

## Session close-out (per `CLAUDE.md`'s process rules)

1. Append the new session's entry to the top of `LATEST.md`'s log (after its
   header block, before the previous newest entry).
2. Update `STATE.md` in place for anything that changed: Org details, What's
   done, What's next, new Traps, new Reference docs entries.
3. If `LATEST.md` now holds 10 session entries, rotate it:
   - Move its entries verbatim into a new `archive/sessions-NNN-NNN.md`
     (reuse the intro paragraph style of the existing archive files).
   - Add a row to `INDEX.md` for each of those 10 sessions, pointing at the
     new archive file.
   - Reset `LATEST.md` back to its empty template (see the HTML comment at
     its bottom for the exact placeholder).

## Why 10-session batches

Small enough that `LATEST.md` stays cheap to read every session, large
enough that rotation isn't a per-session chore. Not a hard rule — if a
batch's entries are unusually long, rotate a little early rather than
forcing exactly 10.
