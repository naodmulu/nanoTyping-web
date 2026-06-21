# nanoTyping — Design & Architecture

This document is the interview story: what problem the app solves, how the rendering
pipeline works, and where the performance wins come from — with numbers you can
reproduce locally.

---

## Problem

A typing test renders every character of a long passage with per-keystroke state
(pending / correct / wrong) and a live caret. Naively mapping a 1,000-word passage
(~6,000 characters) to thousands of `<span>` nodes causes:

1. **Render jank** — React reconciles a huge tree on every keystroke.
2. **Scroll cost** — the browser lays out and paints far more DOM than is visible.
3. **Input lag late in a session** — an early O(n²) stats path made each keystroke
   scan the entire typed history (fixed in Phase 2; see below).

The core engineering bet: **only render what fits on screen**, measure real line
breaks at runtime, and keep the keystroke hot path O(1).

---

## Pipeline overview

```
fullText (6k+ chars)
    │
    ├─ buildWordBoundaries()          regex → [{start, end}, …]
    │
    ├─ hidden measurement node        full text, invisible, same styles
    │       └─ Range.getBoundingClientRect() per word → lineBoundaries[]
    │       └─ ResizeObserver on container → re-measure on resize
    │
    ├─ findWordIndexAtPosition()        binary search → active word index
    │
    ├─ getVisibleLineWindow()           ~6 visible lines → [visibleStart, visibleEnd]
    │
    └─ RenderText                       slice + map → ~hundreds of spans, not thousands
```

### ASCII: sliding window over the passage

```
Full passage (conceptual lines)
┌──────────────────────────────────────────────┐
│ line 0  the quick brown fox jumps over ...   │  ← not rendered
│ line 1  lazy dog and then some more words    │  ← not rendered
│ line 2  that wrap across the container ...   │  ═╗
│ line 3  █ caret here █ more text follows     │  ║ ~6-line visible window
│ line 4  continues on this line and the next  │  ║ (only this slice mounts)
│ line 5  until the window slides forward      │  ║
│ line 6  as the user types further down       │  ═╝
│ line 7  ...                                  │  ← not rendered
└──────────────────────────────────────────────┘
```

Before virtualization, a long test mounted **~6,000** character spans. With the
window, only the visible slice mounts — typically **~200–400** spans depending on
line length (~95% fewer nodes for a 1,000-word passage).

---

## 1. Sliding-window virtualization

**Files:** `app/layout/body/components/TypingBox.tsx`, `app/ui/RenderText.tsx`,
`app/utils/textWindow.ts`

`RenderText` receives `visibleStart` / `visibleEnd` character indices and only
maps that slice to DOM. `charStates` is still kept for coloring typed characters,
but characters outside the window are not mounted.

Until line measurement completes, a coarser **word window** (`WINDOW_WORD_COUNT = 20`)
is used as a fallback so the UI is usable immediately.

---

## 2. Runtime line measurement (DOM `Range`)

**File:** `TypingBox.tsx` (`useLayoutEffect`)

True line breaks depend on font, container width, and `word-break` — they cannot be
computed from character count alone. The app:

1. Renders the full passage in an **invisible measurement node** (`aria-hidden`,
   same font/size/padding as the visible box).
2. Iterates word boundaries and uses `document.createRange()` +
   `getBoundingClientRect()` to detect when `rect.top` changes (new line).
3. Builds `lineBoundaries: { startWordIndex, endWordIndex }[]`.
4. Attaches a **`ResizeObserver`** on the container so layout recomputes when the
   viewport or font metrics change.

`visibleLineCount` is derived from `container.clientHeight / lineHeight` so the
window always covers roughly what fits in the box.

---

## 3. Binary search for the active word

**File:** `app/utils/textWindow.ts` — `findWordIndexAtPosition()`

Given the caret's character index, we need the word (and line) it sits on.
`findWordIndexAtPosition` binary-searches the sorted `WordBoundary[]` in
**O(log n)** instead of scanning all words.

`getVisibleLineWindow` then centers the visible line window on the caret's line.

---

## 4. Session timer (`requestAnimationFrame`)

**File:** `app/hooks/useSessionTimer.ts`

The timer does **not** use `setInterval`. It chains `requestAnimationFrame` ticks
so elapsed time updates in sync with the display refresh (~60 fps) without drift
from timer clamping.

- **Start:** `startTimeRef = performance.now()`, schedule `tick`.
- **Pause:** cancel rAF, freeze `elapsedMs`.
- **Resume:** `startTimeRef = performance.now() - elapsedMs` (offset math preserves
  elapsed time across pause/resume).
- **Finish / reset:** cancel rAF, clear refs.

`TypingBox` also auto-pauses after 15 s of inactivity.

---

## 5. Phase 2 — O(n²) → O(1) keystroke handling

**Files:** `app/utils/typingCounters.ts`, `app/hooks/useTypingStats.ts`,
`TypingBox.tsx`

### The bug

On every keystroke the old path did:

```ts
correctChars: charStates.filter((c) => c.correct).length + (isCorrect ? 1 : 0)
```

That scans **all** typed characters — O(n) per key → **O(n²)** over a session.
`useTypingStats` also re-derived aggregates from the full array on every rAF tick
(~60×/s while running).

### The fix

Keep a small running tally (`TypingCounts`) updated incrementally:

```ts
applyKeystroke(counts, isCorrect)   // raw += 1; correct += isCorrect ? 1 : 0
applyBackspace(counts, wasCorrect)  // decrement, clamped ≥ 0
```

`charStates` remains for **rendering only**; the hot path never scans it.

### Benchmark (reproduce: `npm run bench`)

File: `app/utils/__tests__/typingCounters.bench.ts`

| Session length (n) | Old: filter array | New: running counter | Speedup |
|--------------------|-------------------|----------------------|---------|
| 100                | ~2.4M ops/s       | ~17.7M ops/s         | **7.4×** |
| 1,000              | ~192K ops/s       | ~16.5M ops/s         | **86×** |
| 5,000              | ~49K ops/s        | ~15.9M ops/s         | **323×** |

**How to read it:** old throughput **falls** as n grows (signature of O(n) per
keystroke). New throughput stays **flat** (~16–18M ops/s) — O(1) regardless of
session length.

See `docs/PHASE2_PERF.md` for the full write-up and Vitest column definitions.

---

## Testing

| Area | File |
|------|------|
| Window / binary search | `app/utils/__tests__/textWindow.test.ts` |
| Running counters | `app/utils/__tests__/typingCounters.test.ts` |
| WPM / accuracy math | `app/utils/__tests__/stats.test.ts` |
| Text generation | `app/utils/__tests__/textGenerator.test.ts` |
| Integration (backspace + stats) | `app/layout/body/components/__tests__/TypingBox.test.tsx` |
| Perf regression | `app/utils/__tests__/typingCounters.bench.ts` |

Run: `npm test` · `npm run bench` · `npm run typecheck` · `npm run lint`

---

## Known limitations / future work

These are intentional deferrals for a minimal, desktop-first v1:

| Area | Status |
|------|--------|
| **IME / composition** | Keydown-only input — `compositionstart`/`end` not handled; CJK and other IME input may drop characters. |
| **Mobile / touch** | No hidden-input focus on tap; on-screen keyboards do not activate. Desktop keyboard works. |
| **Paste / selection** | Not supported (keydown-only model). |
| **Punctuation / numbers / quote modes** | UI stubs only (`disabled` in Options). |
| **Backend API** | Word list is static `app/data/words.json`; no `GET /api/words` yet. |
| **Persistence** | No session history (localStorage / Supabase deferred). |

Accessibility quick wins shipped: visible focus ring on the typing area and option
buttons, skip-to-main link, `prefers-reduced-motion` respected for caret scroll.

**Lighthouse accessibility (production build): 96/100** — one contrast warning on
muted gray helper text (`text-gray-500`). Reproduce:
`npm run build && npm run start` then
`npx lighthouse http://localhost:3000 --only-categories=accessibility`.
