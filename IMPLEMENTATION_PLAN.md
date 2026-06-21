# nanoTyping — Implementation Plan (Phases 1 & 2)

Detailed, step-by-step plan for the first two phases. Phases 3–5 (API,
Supabase persistence, docs/a11y) will be planned separately once these land.

**Working convention:** one PR per numbered step below, so the git history
shows a review-style workflow. Each PR must pass lint + typecheck + tests
before merge.

---

## Phase 1 — Credibility: tests, CI, cleanup

Goal: kill the "no tests / unfinished" first impression. After this phase the
project demonstrates testing, CI/CD, and a clean codebase.

### Step 1.1 — Extract testable logic out of `TypingBox.tsx`

`TypingBox.tsx` mixes pure algorithms with React. Extract the pure functions so
they can be unit-tested and the component slims down.

- Create `app/utils/textWindow.ts` and move these **unchanged** out of
  `TypingBox.tsx`, exporting each:
  - `buildWordBoundaries(text)`
  - `getVisibleWordWindow(text, boundaries, currentIndex, windowSize)`
  - `findWordIndexAtPosition(boundaries, index)`  ← binary search
  - `getVisibleLineWindow(boundaries, lineBoundaries, currentIndex, count)`
  - `countCompletedWords(text, index)`
  - Move the `WordBoundary` / `LineBoundary` / `LineLayout` types too.
- Update `TypingBox.tsx` to import them; delete the inlined copies.
- Verify build still works: `npm run build`.

Acceptance: app behaves identically, `TypingBox.tsx` no longer defines those
functions.

### Step 1.2 — Add the test toolchain

- Install dev deps:
  `vitest`, `@vitejs/plugin-react`, `jsdom`,
  `@testing-library/react`, `@testing-library/dom`,
  `@testing-library/jest-dom`, `@testing-library/user-event`.
- Add `vitest.config.ts` (jsdom environment, react plugin, setup file,
  `@` path alias matching `tsconfig.json`).
- Add `vitest.setup.ts` importing `@testing-library/jest-dom`.
- Add scripts to `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"coverage": "vitest run --coverage"`
  - `"typecheck": "tsc --noEmit"`
- Sanity test (`app/utils/__tests__/smoke.test.ts`) to confirm the runner works.

Acceptance: `npm test` runs and the smoke test passes.

### Step 1.3 — Unit tests for pure logic (highest ROI)

Create tests under `app/utils/__tests__/`:

- `stats.test.ts`
  - `calculateWPM`: normal case; `elapsedMs <= 0` → 0; floor behavior.
  - `calculateAccuracy`: empty array → 100; all correct → 100; mixed → rounded.
  - `countCorrectCharsFromArray` / `countRawCharsFromArray` / `countErrors`.
  - `calculateRollingWPM`: empty → 0; single sample → 0; multi-sample window
    math; respects `windowMs`.
- `textGenerator.test.ts`
  - `generateWordPassage(n)` returns exactly `n` space-separated words.
  - count larger than the bank still returns exactly `n` (cycle logic).
  - empty source throws "Word bank is empty.".
  - words are trimmed / no empty tokens.
- `textWindow.test.ts`
  - `buildWordBoundaries`: correct start/end offsets; handles leading/trailing
    spaces; empty string → `[]`.
  - `findWordIndexAtPosition`: binary search matches a linear-scan reference
    across many indices (property-style loop).
  - `getVisibleWordWindow`: window size clamped at start and end of text.
  - `countCompletedWords`: mid-word vs at-space boundary cases; empty text → 0.

Acceptance: meaningful coverage on `stats.ts`, `textGenerator.ts`,
`textWindow.ts`; all green.

### Step 1.4 — One integration test for `TypingBox`

- `app/layout/body/components/__tests__/TypingBox.test.tsx`:
  - Render with a small `words` config.
  - Stub `Math.random` (or inject a fixed passage) so the target text is
    deterministic.
  - Mock `scrollIntoView` and `ResizeObserver` (jsdom lacks them).
  - Dispatch keydown events typing the passage; assert WPM/accuracy/word-count
    update and that completing the passage opens the result modal.

Acceptance: integration test passes deterministically (no flakiness).

### Step 1.5 — Dead-code & honesty cleanup

- Remove from `stats.ts`: `countCorrectChars`, `countRawChars`, `WordCharMap`
  usage (legacy word-by-word path).
- Remove `WordCharMap` from `types.ts` if unused after the above.
- `rollingWPM`: it is computed but never shown. Choose **one**:
  - (preferred) surface it as a live WPM readout in `TypingBox`, **or**
  - remove `rollingWPM` from `useTypingStats` and drop `calculateRollingWPM`.
  - *Decision needed — defaulting to "surface it" unless told otherwise, since
    a live WPM meter is a nice visible feature.*
- `GameMode`: remove `'quote' | 'custom'` (declared, never implemented) until
  actually built.
- Fix `notes.md` claims that overstate reality (e.g. IME support that isn't
  wired up) so docs match code.

Acceptance: no unused exports (`tsc --noEmit` clean, lint clean), no phantom
modes, docs honest.

### Step 1.6 — GitHub Actions CI

- `.github/workflows/ci.yml`, triggers on `push` + `pull_request`:
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
- Add a CI status badge to `README.md`.
- Document recommended branch protection (require CI green to merge) in README.

Acceptance: workflow runs green on a PR; failing tests block the merge.

---

## Phase 2 — Fix the O(n²) keystroke path

Goal: turn the performance weakness into the strongest "debug & optimize"
story. The cost is in `TypingBox.handleKeyDown`, which on every keystroke:
(a) refilters all `charStates` for the correct count, and
(b) appends to `samples` by recomputing counts from the whole array.

### Step 2.1 — Establish a baseline measurement

- Use the React Profiler / Performance panel; type a long (1,000-word) passage.
- Record commit duration / keystroke handler cost as session length grows.
- Save the before numbers (screenshot + figures) for `DESIGN.md` and the CV
  bullet.

### Step 2.2 — Replace per-keystroke refilters with running counters

- Track `correctCharsRef` and `rawCharsRef` (or fold into existing state) and
  update incrementally on keystroke/backspace instead of
  `charStates.filter(c => c.correct).length`.
- When building a new `samples` entry, read the running counters instead of
  recomputing from the full array.
- Ensure backspace correctly decrements counters and that reset/finish clear
  them.
- Keep `charStates` for rendering, but stop deriving aggregate counts from it on
  the hot path.

### Step 2.3 — Verify correctness + re-measure

- Re-run the Phase 1 tests (stats + integration) — counts must still match.
- Add a regression test: typing a known sequence with mistakes + backspaces
  yields the expected correct/raw/error counts.
- Re-profile; record the after numbers. Confirm per-keystroke cost is now flat
  (O(1)) rather than growing with session length.

Acceptance: identical stats output, flat per-keystroke cost, before/after
numbers captured.

---

## Definition of done (Phases 1 & 2)

- `npm run lint`, `npm run typecheck`, `npm test` all green locally and in CI.
- Pure logic extracted and unit-tested; one integration test on `TypingBox`.
- No dead code or phantom game modes; docs match implementation.
- Keystroke handler is O(1) per key, with documented before/after profiling.
- Each step landed as its own PR through the CI gate.

## Open decisions before coding

1. `rollingWPM`: surface as a live WPM meter (default) or delete it?
2. Keep word generation client-side for now (server move happens in Phase 3).

---

## Phase 3 — Backend API (`notes.md` realized)

Goal: cross the wire. Move passage generation server-side behind a real,
validated, cached HTTP endpoint so the project demonstrates "APIs" and
full-stack work instead of being a static frontend.

### Step 3.1 — Define the contract

- `GET /api/words?mode={words|time}&count={n}&punctuation={bool}&numbers={bool}`
- Response: `{ text: string, wordCount: number, mode: GameMode }`.
- Errors return JSON `{ error }` with proper status (400 invalid params).
- Document the contract at the top of the route file and in README.

### Step 3.2 — Implement the route handler

- Create `app/api/words/route.ts` (App Router route handler).
- Reuse the existing generators in `app/utils/textGenerator.ts`
  (`generateWordPassage`, `generateTimePassage`) server-side — do **not**
  duplicate the logic.
- Validate/parse query params with a small schema (zod, or a hand-rolled
  validator) before generation. Clamp `count` to a sane max (e.g. 1000) to
  prevent abuse.
- Set `Cache-Control` headers; word lists are static so responses are cacheable
  at the edge. Note: passages are randomized, so cache per-param-set with a
  short TTL or mark `no-store` if freshness matters — default: short
  `s-maxage` with `stale-while-revalidate`.

### Step 3.3 — Wire the client to the API with graceful fallback

- In `TypingBox.tsx`, replace direct `generateText(config)` calls with a fetch
  to `/api/words`, keyed off `config`.
- Add loading + error states (the box already starts empty; show a subtle
  loading affordance).
- Keep the local generator as a **fallback** if the fetch fails, so the app
  never hard-breaks offline. This also keeps the existing unit tests valid.
- For time mode's mid-session expansion, fetch additional words from the API
  instead of calling `generateWordPassage` inline (fallback to local on error).

### Step 3.4 — Tests for the route

- `app/api/words/__tests__/route.test.ts`:
  - valid params → correct word count + shape.
  - invalid `mode` / non-numeric `count` / out-of-range `count` → 400.
  - `count` clamped at the max.
- Update the `TypingBox` integration test to mock `fetch` (return a fixed
  passage) so it stays deterministic and offline.

Acceptance: endpoint validated + cached, client consumes it with fallback,
tests green, CI still passing.

---

## Phase 4 — Persistence + results history (Supabase/Postgres)

Goal: turn the demo into a product. Persist completed sessions and show
progress over time. Uses Supabase Postgres via Vercel — real cloud data layer.

### Step 4.1 — localStorage first (ship value immediately, no infra)

- On session finish, save a record `{ id, wpm, rawWpm, accuracy, mode,
  wordCount, timeMs, errors, createdAt }` to localStorage.
- Add a small history hook `app/hooks/useSessionHistory.ts` (read/append/clear).
- Build a history view: a list of recent runs + a simple sparkline/line chart
  of WPM over time (lightweight inline SVG or a tiny chart lib).
- Unit-test the history hook (append, cap length, clear) with a mocked storage.

### Step 4.2 — Provision Supabase

- Create a Supabase project; capture `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (server-only) / anon key as needed.
- Add env vars to `.env.local` (gitignored) and to Vercel project settings.
- Schema: `sessions` table — `id uuid pk`, `wpm int`, `raw_wpm int`,
  `accuracy int`, `mode text`, `word_count int`, `time_ms int`, `errors int`,
  `created_at timestamptz default now()`, optional `user_id` for later auth.
- Add a SQL migration file under `supabase/migrations/` and enable RLS
  (permissive policy now; tighten when auth lands).

### Step 4.3 — Server routes for sessions

- `app/api/sessions/route.ts`:
  - `POST` — validate body, insert a session, return the created row.
  - `GET` — return recent sessions (paginated/limited), newest first.
- Use the Supabase server client (`@supabase/supabase-js`) with the service key
  inside the route handler only — never expose the service key to the client.
- Validate input with the same schema approach as Phase 3.

### Step 4.4 — Sync client to the backend

- On finish: write to Supabase via `POST /api/sessions`; keep localStorage as an
  offline cache / optimistic fallback.
- History view reads from `GET /api/sessions`, falling back to localStorage on
  error.
- Tests: route handler validation + insert/read (mock the Supabase client);
  history view renders fetched rows.

### Step 4.5 — (Deferred hook) auth readiness

- Leave `user_id` nullable now; note in README that Supabase Auth can later
  scope history per user. Do not build auth in this phase.

Acceptance: completed runs persist to Postgres, history view shows progress
over time with offline fallback, secrets server-side only, CI green.

---

## Definition of done (Phases 3 & 4)

- `/api/words` and `/api/sessions` validated, cached where appropriate, tested.
- Client consumes both with graceful offline fallback to local generation /
  localStorage.
- Sessions persist to Supabase Postgres; history view charts WPM over time.
- Service keys are server-only; env vars documented and set in Vercel.
- Each step landed as its own PR through the CI gate.

## Open decisions (Phases 3 & 4)

1. Caching policy for `/api/words`: short `s-maxage` + SWR (default) vs
   `no-store` since passages are random.
2. Chart: tiny inline SVG sparkline (default, zero deps) vs a chart library.
3. Auth: deferred — history is anonymous/global for now (default).

---

## Phase 5 — Polish & documentation

Goal: make the engineering legible to a reviewer and close the accessibility /
edge-case gaps that interviewers poke at. This is what converts a working app
into something that signals "communicates and finishes."

### Step 5.1 — DESIGN.md (the interview story, written down)

- Create `DESIGN.md` explaining the rendering pipeline that is the project's
  strongest signal:
  - Problem: rendering a full long passage as thousands of `<span>`s janks.
  - Sliding-window virtualization: only ~6 visible lines render.
  - Runtime line measurement via DOM `Range.getBoundingClientRect()` against a
    hidden measurement node, recomputed with `ResizeObserver`.
  - Binary search (`findWordIndexAtPosition`) to locate the active line.
  - `requestAnimationFrame` session timer with pause/resume offset math.
  - The Phase 2 O(n²)→O(1) keystroke fix, **with before/after profiling
    numbers** captured in Step 2.1/2.3.
- Include a simple ASCII/markdown diagram of the window over the full text.
- Reference the actual files (`app/utils/textWindow.ts`, `TypingBox.tsx`,
  `useSessionTimer.ts`) so it is verifiable.

### Step 5.2 — Accessibility & input edge cases

- IME / composition: handle `compositionstart`/`compositionend` (or switch the
  hot path to a hidden input) so the keydown-only model does not drop
  multi-byte input. Reconcile with the `notes.md` IME claim from Step 1.5.
- Mobile / touch: focus a hidden input on tap so on-screen keyboards trigger;
  verify the box is usable on a phone viewport.
- Keyboard/focus: ensure the typing box is reachable and has a visible focus
  state; audit `select-none` / `tabIndex` usage.
- Reduced motion: respect `prefers-reduced-motion` for the smooth
  `scrollIntoView` (jump instead of smooth when set).
- Quick automated pass (axe or Lighthouse a11y) and note the score.

### Step 5.3 — README rewrite

- Replace the boilerplate create-next-app README with:
  - One-line pitch + live Vercel link + screenshot/GIF.
  - Feature list (modes, live stats, history).
  - Architecture summary linking to `DESIGN.md`.
  - Tech stack, local setup, env vars (Supabase), how to run tests.
  - CI badge (from Step 1.6) and a short "Testing" section.
- Keep it CV-aligned: lead with the engineering, not the framework.

### Step 5.4 — Final cleanup pass

- Remove any remaining boilerplate (default Next.js assets/copy not used).
- Confirm `notes.md` reflects shipped reality, or fold it into README and
  delete it.
- Run lint + typecheck + tests + a production build one last time.

Acceptance: DESIGN.md explains the architecture with real numbers; app is
keyboard/mobile/IME-usable with a clean a11y pass; README is recruiter-ready;
build is clean.

---

## Definition of done (Phase 5)

- `DESIGN.md` documents the virtualization pipeline + before/after perf numbers.
- IME, mobile/touch, focus, and reduced-motion handled; a11y score recorded.
- README rewritten and CV-aligned with a live link and screenshot.
- No boilerplate left; final lint/typecheck/test/build all green.
