# The Reliable Frontend — A Portable Engineering Playbook

Patterns pulled out of one Next.js + external-API project and stripped of anything project-specific. Every pattern is named by the problem it solves, not by the vendor it happened to be solving it for — swap in your own service and the shape holds.

## Contents

1. [Repo & commit hygiene](#1-repo--commit-hygiene)
2. [Environment & config loading](#2-environment--config-loading)
3. [Feature flags](#3-feature-flags)
4. [Security boundary](#4-security-boundary)
5. [Rate limiting](#5-rate-limiting)
6. [Client state & handoff](#6-client-state--handoff)
7. [Timeouts & resilience](#7-timeouts--resilience)
8. [Error typing & logging](#8-error-typing--logging)
9. [Isolating logic from UI](#9-isolating-logic-from-ui)
10. [Mapper boundary](#10-mapper-boundary)
11. [Types & interfaces](#11-types--interfaces)
12. [Unit & e2e testing](#12-unit--e2e-testing)
13. [Documentation](#13-documentation)
14. [Lessons from the log](#14-lessons-from-the-log)

---

## 1. Repo & commit hygiene

Git hooks live in a tracked `.githooks/` directory, not `.git/hooks/` (which never leaves a clone). A one-line install script points Git at them.

```js
// scripts/install-hooks.mjs
if (existsSync(".git")) {
  spawnSync("git", ["config", "core.hooksPath", ".githooks"]);
}
// package.json: "postinstall": "node scripts/install-hooks.mjs"
```

- **pre-commit** — runs a fast subset (lint, typecheck, changed-file tests) so feedback stays under a few seconds.
- **commit-msg** — enforces Conventional Commits (`feat|fix|docs|refactor|chore|test(scope): summary`), with an explicit exemption for merge and revert commits so the hook never blocks a rollback.
- **pre-push** — runs the fuller gate (full test suite, build) since this cost is paid once per push, not once per commit.

**Why a script instead of husky/lefthook:** zero extra dependency, zero config file to keep in sync with a library's major version. A 15-line Node script that shells out is easier to read in a review than a framework's hook resolution order.

## 2. Environment & config loading

Runtime config is resolved by **one function**, not read ad hoc with `process.env.X` scattered through the codebase. That function takes the environment map as a parameter (defaulting to `process.env`) rather than closing over it globally — which is what makes it unit-testable without a subprocess.

```ts
function resolveRuntimeConfig({ environment = process.env } = {}) {
  return {
    environment: normalizeEnvironment(environment.NODE_ENV),
    featureFlags: resolveFeatureFlags({ defaults, environment }),
    api: {
      // only *presence* booleans and non-secret fields cross into
      // the object that a client component might serialize
      keyConfigured: Boolean(environment.SERVICE_API_KEY),
      endpoint: environment.SERVICE_ENDPOINT,
    },
  };
}
```

**Public config** — one resolver returns only what's safe to reach a client component or get JSON-serialized into a response — presence flags, not secret values. A test asserts `JSON.stringify(config)` never contains a known secret string.

**Server-only config** — a second, separately-named resolver (`resolveServerOnlyRuntimeConfig`) returns actual secrets and is imported only by server-side route handlers — never by anything that also imports client components.

Naming convention over a hardcoded allowlist: any variable prefixed for client exposure (Next.js's `NEXT_PUBLIC_*`, Vite's `VITE_*`) is bundled into client code at **build** time — CI must set it as a build-time env var, not only a runtime secret, or it silently resolves to `undefined` in the shipped bundle.

## 3. Feature flags

Flags are a typed, nested interface with a frozen default object — not loose booleans passed around as function arguments.

```ts
interface FeatureFlags {
  answers: { enabled: boolean; streaming: boolean; citations: boolean };
  chat: { enabled: boolean };
}

const defaultFlags: Readonly<FeatureFlags> = Object.freeze({ /* ... */ });

function resolveFeatureFlags({ defaults, environment }) {
  return mergeFeatureFlags(defaults, environment); // deep merge, deterministic precedence
}
```

Env-to-flag parsing rejects ambiguity instead of coercing it: `"true"/"1"/"yes"/"on"` → `true`, `"false"/"0"/"no"/"off"` → `false`, anything else (typos, empty string) is treated as *absent* and falls through to the default rather than silently becoming truthy via `Boolean("false")`. The parser and the merge function are two of the most heavily unit-tested modules in the project — flags gate behavior the rest of the test suite depends on, so their resolution logic earns disproportionate coverage.

## 4. Security boundary

### Response headers, set once

A single cross-cutting `headers()` function in the framework config applies to every route — not per-route middleware that's easy to forget on a new endpoint.

```ts
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self' https://api.yourvendor.com",
  "frame-ancestors 'none'",
].join("; ");
// + X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
//   Referrer-Policy: strict-origin-when-cross-origin,
//   Permissions-Policy: geolocation=(), camera=(), microphone=()
```

> **Comment the exceptions, don't just add them.** `'unsafe-eval'` is dev-only because the bundler's fast-refresh needs it — gated behind an environment check, with the reason written next to the line so the next person doesn't "fix" it by removing the gate. Every CSP exception should carry a one-line reason inline, since a bare exception invites deletion by someone who doesn't know why it's there, or permanent acceptance by someone who's afraid to touch it.

### Secret redaction at the error/log boundary

Rather than trusting every call site to avoid logging a token, the error-normalization and logger functions **themselves** strip anything that looks like one, by key name and by value shape:

```ts
function sanitizeMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([k]) => !/token|authorization|api[-_]?key|secret|password/i.test(k))
      .map(([k, v]) => [k, sanitizeValue(v)])
  );
}
function sanitizeValue(v) {
  return typeof v === "string" && /bearer\s+|token|api[-_]?key/i.test(v)
    ? "[redacted]" : v;
}
```

This runs centrally in the logger and the error-to-application-error mapper, so every call site gets it for free instead of remembering to redact.

## 5. Rate limiting

An in-memory sliding window keyed by client IP, applied to every route that calls a paid or privileged upstream. Small enough to read in one sitting and to unit test deterministically:

```ts
const windows = new Map<string, number[]>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (windows.get(key) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) { windows.set(key, timestamps); return true; }
  timestamps.push(now);
  windows.set(key, timestamps);
  return false;
}
```

> **Known limit, stated up front.** An in-memory `Map` only limits per-instance. The module says so in a comment at the top: fine for a single-instance deployment, needs a shared store (Redis, etc.) the moment there's more than one server process. Stating the boundary explicitly is cheaper than someone rediscovering it under a multi-instance traffic spike.

Client IP extraction takes the *first* entry of `x-forwarded-for` (the original client, not an intermediate proxy) and falls back to a literal `"local"` key when the header is absent — never throws, since a missing header shouldn't fail the request.

## 6. Client state & handoff

This project has no server session store — auth is a short-lived, purpose-scoped token minted per browser session (§4/§7), not a cookie-backed session with a timeout to manage. The closer analogue to "session" state is a same-origin tab handoff: a detail page opened in a new tab needs data the list page already has, without a second network round trip.

```ts
// list page, before opening the detail tab
sessionStorage.setItem(`detail:${item.id}`, JSON.stringify(item));

// detail page — server-rendered result is authoritative;
// sessionStorage is only a same-origin, same-tab-group fallback
const fallback = readFromSessionStorage(id); // never throws; missing → undefined
```

Two things make this safe rather than fragile: the detail page's *primary* data path is still a real server-side lookup by id (so a shared link works for a visitor with empty storage), and every read/write is wrapped so a full or disabled storage (private browsing) degrades to "no cached data" instead of crashing the page.

## 7. Timeouts & resilience

Worth naming plainly: this codebase does not implement exponential-backoff retry against its upstream API. What it does instead:

- **Hard upstream timeout** — `fetch(url, { signal: AbortSignal.timeout(10_000) })` on every server-to-vendor call, so a hung upstream can't hang the request indefinitely.
- **Endpoint fallback, not retry** — where a vendor exposes more than one valid endpoint shape for the same operation, the route tries them in order and stops at the first non-404 — a fallback across *alternatives*, not a retry of the *same* call.
- **User-triggered retry** — failed UI states render a "Try again" action that re-runs the same request on click. The retry is explicit and visible, not a silent background loop the user can't see or cancel.
- **Test-suite retry ≠ app retry** — Playwright is configured with `retries: 2` in CI only, to absorb shared-runner flakiness — commented as exactly that, so it isn't mistaken for masking a real regression (a genuine bug still fails every attempt).

If your project's upstream is flaky enough to need automatic retry-with-backoff, that's a deliberate addition on top of this — decide the retry budget and idempotency story explicitly rather than reaching for a generic wrapper.

## 8. Error typing & logging

Every error, whatever its origin, gets normalized through one function into a small closed set of codes before it reaches UI or logs:

```ts
type ApplicationErrorCode =
  | "NETWORK" | "CONFIGURATION" | "AUTHENTICATION"
  | "PROVIDER" | "TIMEOUT" | "VALIDATION" | "UNKNOWN";

interface ApplicationError {
  code: ApplicationErrorCode;
  message: string;      // developer-facing, may be technical
  userMessage: string;  // shown in UI, always safe and actionable
  recoverable: boolean; // drives whether a retry action renders
}

function toApplicationError(error: unknown): ApplicationError { /* ... */ }
```

Splitting `message` from `userMessage` at the type level (not by convention) makes it structurally impossible for a raw stack trace or upstream error body to leak into a toast — the field that reaches JSX literally cannot hold that value unless someone writes it there on purpose. The logger calls the same normalizer before writing an entry, so log lines and UI copy stay consistent without duplicating the classification logic.

## 9. Isolating logic from UI

Ownership is drawn as three explicit lanes and every piece of state is assigned to exactly one:

| Lane | Owns | Never does |
| --- | --- | --- |
| Server | Anything needing a credential that must not reach the browser: token minting, privileged API calls, rate limiting, security headers. | Hold UI state, import client components. |
| Domain SDK / engine | The vendor SDK's own controller state — query, facets, pagination — when one exists. Treated as a black box, not re-implemented. | Get reached into for ad hoc mutation; only its published API is called. |
| UI (framework state) | Short-lived interaction state that doesn't belong to the engine: drawer open/closed, a comparison shortlist, which render state (loading/empty/error) is active. | Own anything that must survive a refresh or a second tab reliably — that's the server's or the engine's job. |

The practical test for "does this belong in a component": if deleting the component and keeping the function still lets you unit-test the behavior, it's business logic and belongs in `lib/` or `features/*/services`, not inside a `.tsx` file. Components stay thin — they call a hook or a service function and render the result's discriminated-union state.

## 10. Mapper boundary

The UI never renders a raw vendor payload. Exactly one function per upstream shape converts it into a local, UI-owned model — and that function is the only place either shape's structure is known simultaneously.

```ts
// raw vendor record → local domain model, one direction, one place
function mapRawRecordToItem(raw: VendorRecord): Item {
  return {
    id: raw.id,
    title: raw.title,
    tags: normalizeMultiValue(raw.tags), // vendor sends ";"-joined or array — normalize once
  };
}
```

**Why this earns its own file:** when the vendor changes a field name or response shape, exactly one file changes. Every component downstream keeps compiling against the local type. Structural typing against "whatever shape the SDK returns" (no import of the vendor's types into the mapper) also means a local model can be a superset — richer detail views can add optional fields a list view's payload never had, and a list item still satisfies the detail type by having those fields simply absent.

## 11. Types & interfaces

- **Discriminated unions for workflow state** — `{ status: "idle" | "loading" | "success" | "empty" | "error"; ... }` instead of independent booleans (`isLoading`, `hasError`, `data`) that can drift into impossible combinations.
- **Readonly + frozen defaults** for anything treated as configuration, so a downstream `merge` can never accidentally mutate the shared default object.
- **Interfaces at provider boundaries** — a `Provider` interface (e.g. `generate(query): Promise<Answer | null>`) lets a mock/test implementation and the live vendor-backed implementation be swapped without touching any consumer.
- **No `any` at a parse boundary** — untrusted JSON is typed `unknown` and narrowed with explicit guards, never cast.

`strict: true` in `tsconfig.json` is treated as non-negotiable; a type error is a build failure, not a warning to triage later.

## 12. Unit & e2e testing

**Unit / component — Vitest.** Covers pure logic (mappers, flag resolution, error normalization) and component render-state behavior. Coverage is scoped to an explicit `include` list of files that carry real logic, with an **80% statements/branches/functions/lines** gate on that list — not a blanket repo-wide number that punishes trivial files and rewards deleting hard-to-test ones.

**End-to-end — Playwright.** Drives the real app against a real (or sandbox) upstream, not a mock server — the thing most worth catching (an SDK controller wired wrong, a real API contract mismatch) only shows up against the genuine dependency. Covers the golden path, empty state, and an unknown-id/error state per major flow, plus keyboard nav, responsive breakpoints, and automated accessibility checks (axe, failing the build on serious/critical violations).

### What's deliberately not unit-tested

A vendor SDK's internal controller/store is *not* deep-mocked in unit tests. The team's own reasoning, generalized: mocking a black-box controller's internals convincingly enough to catch real bugs would just mean re-implementing the controller as a mock — at which point the test verifies the mock, not the integration. That boundary is pushed to Playwright instead, against the genuine controller. Decide this line consciously per dependency rather than mocking everything by default.

```ts
// vitest.config.ts — narrow, honest coverage scope
coverage: {
  include: [ /* every file that holds real logic, named explicitly */ ],
  thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
}
```

## 13. Documentation

Two documentation modes, kept deliberately separate because they answer different questions:

| Mode | Answers | Written when |
| --- | --- | --- |
| Architecture snapshot | "What does the system look like *right now*?" | Regenerated after any change to routing, data flow, or an integration boundary — rewritten as current state, never as a diff or changelog against the last version. |
| Decision records (ADRs) | "Why does it look this way, and what did we choose *not* to do?" | Once, at the decision — append-only. A superseded decision gets a new record with `Status: Superseded`, the old one is never edited to look retroactively wrong. |

An architecture snapshot that also tries to be a running history rots the moment someone reads it after three more changes land — readers can no longer tell current fact from historical note. Keeping "what's true now" and "why we chose it" in physically separate files is what makes the snapshot trustworthy enough to read instead of re-deriving from source on every question.

## 14. Lessons from the log

Patterns visible in the fix/refactor history that are worth carrying forward as habits, not just this project's scar tissue:

- **A CSP exception written for dev mode will eventually run in prod unless it's gated in code, not just in a comment.** One fix scoped `'unsafe-eval'` to `NODE_ENV !== "production"` after it had been open unconditionally — the bundler needs it locally, nothing does in a production build.
- **Degrade to a handled error state, never let a missing integration config crash the page.** A content page crashed outright when its upstream config was absent; the fix made "unconfigured" a rendered state like any other, not an unhandled exception.
- **Every privileged route needs its own rate limit and timeout — adding a new server route means adding both, not inheriting them implicitly.** A route that called an upstream directly shipped without either, then got both added in the same fix once traffic exposed the gap.
- **CI flakiness and real regressions need visibly different fixes.** Retries were added to the e2e job for shared-runner contention (commented as exactly that); a genuinely flaky assertion was fixed at the source (waiting for real DOM settlement) instead of papering over it with the same retry.
- **A merge/revert commit shouldn't be held to the same message format as authored work.** The commit-msg hook grew an explicit exemption for merge and revert commits rather than forcing every rollback through a manufactured Conventional Commit summary.
- **When a feature's data source moves from client-fetched to server-rendered, update the docs and tests in the same change, not after.** A detail page's move to server rendering landed together with its architecture snapshot refresh and its e2e coverage for direct-URL linkability and refresh survival — not as a follow-up commit days later.

---

*Generalized from one project's implementation. Names, thresholds, and specific headers are illustrative — port the shape, not the literals.*
