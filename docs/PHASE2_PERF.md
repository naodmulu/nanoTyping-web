# Phase 2 — O(1) Keystroke Handling

A writeup of the performance fix in PR #2, the benchmark behind it, and how to
reproduce the numbers. Keep this around for the interview story / DESIGN.md.

---

## The problem: O(n²) per typing session

Every keystroke ran work that scaled with how much you'd *already* typed. Two
spots in `TypingBox.tsx` / `useTypingStats.ts`:

1. **Per-keystroke refilter.** On each key, building the stats sample did:

   ```ts
   correctChars: charStates.filter((c) => c.correct).length + (isCorrect ? 1 : 0)
   ```

   `charStates.filter(...)` walks the **entire** array of typed characters. After
   you've typed `n` characters, each new keystroke does `n` work → typing a full
   passage is `1 + 2 + 3 + … + n ≈ n²/2` operations. That's **O(n²)** over a
   session.

2. **Per-render re-derivation.** `useTypingStats` recomputed *all* aggregate
   counts (`correct`, `raw`, `errors`, `accuracy`) from the full `charStates`
   array on every render — and the requestAnimationFrame timer re-renders the
   component **~60 times per second** while running. So even between keystrokes,
   the app was doing O(n) array scans 60×/s.

3. **Unbounded sample buffer (bonus).** `setSamples(prev => [...prev, x])` copies
   a growing array on every keystroke — another O(n)-per-key cost, and the buffer
   never stopped growing.

For short tests you'd never notice. For a 1,000-word (~6,000 char) session it
means millions of needless operations and growing per-keystroke latency — exactly
the kind of jank that shows up as input lag late in a long test.

---

## The fix: running counters (O(1) per keystroke)

Instead of re-deriving counts from the array, keep a small running tally and
update it by ±1 as characters are typed or deleted.

New module — `app/utils/typingCounters.ts`:

```ts
applyKeystroke(counts, isCorrect)   // raw += 1; correct += isCorrect ? 1 : 0
applyBackspace(counts, wasCorrect)  // raw -= 1; correct -= wasCorrect ? 1 : 0  (clamped ≥ 0)
countsToErrors(counts)              // raw - correct
countsToAccuracy(counts)            // round(correct / raw * 100), or 100 if raw == 0
```

Changes:

- `TypingBox` holds a `counts` state and updates it incrementally on each
  keystroke / backspace. Backspace decrements based on the exact character being
  removed (looked up from `charStates`), clamped at 0.
- `useTypingStats` now reads the running `counts` — no array scans.
- The `samples` buffer is capped (`MAX_SAMPLES = 200`), so its append no longer
  grows with session length.
- `charStates` is still kept, but **only for rendering** — never read on the hot
  path.

Each keystroke is now a handful of constant-time additions: **O(1)**, regardless
of how long the session is.

---

## The benchmark

File: `app/utils/__tests__/typingCounters.bench.ts`. Run it with:

```bash
npm run bench
```

It compares the cost of producing the correct-char count for one keystroke at
the end of a session of length `n`, the old way vs the new way:

- **old**: `charStates.filter(c => c.correct).length`  (scans `n` items)
- **new**: `applyKeystroke(...)`                        (constant work)

### Results

| Session length (n) | Old: filter array | New: running counter | Speedup |
|--------------------|-------------------|----------------------|---------|
| 100                | 2,557,752 ops/s   | 18,729,790 ops/s     | 7.3×    |
| 1,000              | 219,546 ops/s     | 18,829,069 ops/s     | 85.8×   |
| 5,000              | 56,801 ops/s      | 19,673,902 ops/s     | 346×    |

*(Measured locally with Vitest; absolute numbers vary by machine, the trend
doesn't.)*

### How to read this — the proof is in the *trend*, not the raw numbers

- **Old** throughput **falls as n grows**: 2.56M → 219K → 56.8K ops/s. Multiply
  n by 10, throughput drops ~10×. Cost per keystroke is proportional to n → that
  is the signature of **O(n)** per keystroke (→ O(n²) per session).
- **New** throughput is **flat**: ~18–19M ops/s at every size. n has no effect on
  cost per keystroke → **O(1)**.

That flat line is the whole point: the optimized handler costs the same on
keystroke #5 and keystroke #5,000.

---

## What does "ops/s" mean?

**ops/s = operations per second** — how many times the benchmarked function ran
in one second. (Vitest labels this column `hz`, as in hertz = times per second.)

- **Higher ops/s = faster.** "18.7M ops/s" means the function completed ~18.7
  million times per second, i.e. each call took ~1/18,700,000 s ≈ **0.00005 ms**.
- It's just the inverse of time-per-call: `time per call = 1 / (ops per second)`.
  So 56,801 ops/s ≈ 0.0176 ms per call; 19.6M ops/s ≈ 0.00005 ms per call.

Other columns Vitest prints, briefly:

| Column   | Meaning                                                        |
|----------|---------------------------------------------------------------|
| `hz`     | operations per second (the headline number; higher = faster)  |
| `mean`   | average time per call, in milliseconds                         |
| `min`/`max` | fastest / slowest single call observed                      |
| `p75`/`p99` | 75th / 99th percentile time — "99% of calls were faster than this"; good for spotting occasional slow calls |
| `rme`    | relative margin of error (± %) — how noisy the measurement was; smaller is more trustworthy |
| `samples`| how many times it was run to gather the stats                  |

Why measure ops/s instead of timing one call? A single call is too fast and too
noisy to time accurately. Running it millions of times and reporting the rate
averages out the noise and gives a stable, comparable number.

---

## Tests guarding the change

- `app/utils/__tests__/typingCounters.test.ts` — unit tests for the counters,
  including clamping at 0 and a sequence regression that replays
  keystrokes + backspaces and checks the running counters match a brute-force
  tally.
- `app/layout/body/components/__tests__/TypingBox.test.tsx` — an integration test
  where a wrong character is corrected with backspace and the final result is a
  clean 7/7, proving the counters decrement correctly through the real component.

Result: 46 tests pass (was 35 before Phase 2).
