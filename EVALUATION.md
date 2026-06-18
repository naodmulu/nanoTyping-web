# nanoTyping — CV / Mid-Level Readiness Evaluation

> Honest, hiring-manager-perspective review of the project and a roadmap for
> making it a competitive Mid-Level Software Engineer portfolio piece.

## What this project currently is

A solo, frontend-only Monkeytype clone: ~1,400 lines of TypeScript/React on
Next.js 14 (App Router) + Tailwind. No backend (the API in `notes.md` is
unstarted), no database, no auth, no persistence, no tests. Word source is a
static `words.json`. Deployed on Vercel's default pipeline.

**Verdict:** As built, this is a solid junior/portfolio piece, not yet a
convincing mid-level anchor project. It belongs on the CV, but if it is the
*strongest* item for a 1–3 year role it will underwhelm. The core has real
engineering in it, and the gaps are fixable.

---

## 1. Is it strong enough for mid-level?

On its own, not yet. Mid-level JDs list "designing, testing, shipping,"
"CI/CD, cloud, APIs," and "code reviews." This project demonstrates *design and
shipping* but has zero tests, no real API, no collaboration signal, and
incomplete features. A reviewer skims it in 60 seconds and sees: nice typing UI,
no backend, no tests — that reads junior. What rescues it is one genuinely
non-trivial thing (the rendering pipeline). Lean into that.

## 2. Skills that align with the JD

- Designing & implementing features — game modes, stats, timer, result modal
- TypeScript — properly typed throughout, discriminated config types
- Performance optimization — the sliding-window virtualization is real
- Debugging — the rendering fix is a legitimate war story
- Cloud deploy — Vercel (table-stakes, near-zero signal)
- Refactoring — git history shows iterative refactors

## 3. What actually impresses

The `TypingBox.tsx` rendering pipeline. It is not just `.map`-ing characters:

- Builds word boundaries via regex, then computes a **visible window** so only
  ~6 lines render instead of thousands of `<span>`s (virtualization).
- Measures real line breaks with DOM `Range.getBoundingClientRect()` against a
  hidden measurement node, recomputed via `ResizeObserver`.
- Uses a **binary search** (`findWordIndexAtPosition`) to locate the cursor line.
- Drives the timer with `requestAnimationFrame` + pause/resume offset math, and
  memoizes char rendering.

That is above-junior frontend reasoning. That is the interview story. Everything
else (Tailwind layout, modal, options menu) is generic.

## 4. Gaps vs. mid-level expectations

- **No tests at all.** Single biggest red flag. WPM math, accuracy,
  word-boundary, and window logic are pure functions begging for unit tests.
- **No backend / API.** `notes.md` planned `GET /api/words`, caching, rate
  limiting — none built. Mid-level full-stack wants to see you cross the wire.
- **No persistence.** No history, no localStorage, no DB. Feels like a demo.
- **Incomplete features shipped.** Unchecked modes in `notes.md`; `GameMode`
  declares `'quote' | 'custom'` that are not implemented; `rollingWPM` is
  computed but never displayed; legacy `WordCharMap` / `countCorrectChars` is
  dead code.
- **A real perf bug undercutting the perf story.** On every keystroke the code
  does `charStates.filter(c => c.correct)` *and* rebuilds the entire `samples`
  array immutably — O(n²) over a session. Ironic in the one project pitched on
  performance.
- **No CI beyond Vercel's default.** No GitHub Actions, no lint/test gate, no
  type-check-on-PR.
- **Solo, so no code-review/collaboration signal.** PR-based workflow + a
  written design doc helps.
- **Accessibility / edge cases.** `select-none`, keydown-only input (no IME
  despite `notes.md` claiming it), no mobile/touch.

## 5. How to describe it on a CV

Lead with the engineering, quantify, name the technique:

> **nanoTyping — Typing-speed web app** · *Next.js 14, TypeScript, Tailwind, Vercel*
> - Built a real-time typing test with character-by-character feedback, live
>   WPM/accuracy, and multiple game modes (timed, word-count).
> - Eliminated render jank on long passages by implementing a sliding-window
>   virtualization layer, rendering only the ~6 visible lines instead of the
>   full 1,000-word DOM tree — cutting rendered nodes by ~95%.
> - Computed true line boundaries at runtime using DOM `Range` measurement +
>   `ResizeObserver`, with a binary search to track the active line in O(log n).
> - Drove timing/stats with a `requestAnimationFrame` session timer supporting
>   pause/resume and inactivity auto-pause.

Every bullet must survive an interview. Measure the ~95% claim (React Profiler
before/after) so it is defensible.

## 6. What would make it genuinely competitive

Ordered by impact; each closes a specific JD gap:

1. **Add a test suite** (Vitest + React Testing Library). Unit-test `stats.ts`,
   `textGenerator.ts`, and the window functions; one integration test on
   `TypingBox`. Highest single impact — kills the biggest red flag.
2. **Build the actual API** from `notes.md`: `GET /api/words` via Next route
   handlers, with caching and input validation. Real full-stack + "APIs."
3. **Add persistence + results history**: store sessions (localStorage first,
   then Postgres/Supabase via Vercel) with a stats-over-time chart.
4. **Add GitHub Actions CI**: lint + type-check + test on every PR, branch
   protection. Real CI/CD, not just auto-deploy.
5. **Fix the O(n²) keystroke path** and write it up. Converts a weakness into
   the best "debug & optimize" story.
6. **Clean dead code** (`WordCharMap`, unused `rollingWPM`, phantom
   `quote`/`custom` modes) and finish or remove half-built modes.
7. **Write a short DESIGN.md** explaining the virtualization approach with a
   diagram. Signals communication + technical discussions.

**Minimum to flip the first impression** (junior demo → engineer who tests and
ships): items 1, 4, and 6 — roughly a weekend. Add 2 and 3 and it becomes a
legitimately strong mid-level full-stack piece.
