import { bench, describe } from 'vitest';
import { applyKeystroke } from '../typingCounters';

// Demonstrates the Phase 2 fix: the old hot path recomputed the correct-char
// count by filtering the entire charStates array on every keystroke (O(n) per
// key => O(n^2) per session). The new path keeps a running counter (O(1) per
// key). These benchmarks measure the cost of producing the per-keystroke
// correct-count for a session of a given length.

type Char = { correct: boolean };

function buildCharStates(n: number): Char[] {
  // Deterministic mix: ~1 in 7 chars "incorrect".
  return Array.from({ length: n }, (_, i) => ({ correct: i % 7 !== 0 }));
}

// OLD approach: one keystroke at the end of an n-length session re-filters the
// whole array to derive the correct count.
function oldKeystrokeCost(charStates: Char[]): number {
  return charStates.filter((c) => c.correct).length;
}

// NEW approach: one keystroke updates the running counter in constant time.
function newKeystrokeCost(correctSoFar: number, isCorrect: boolean): number {
  return applyKeystroke({ correctChars: correctSoFar, rawChars: 0 }, isCorrect).correctChars;
}

for (const n of [100, 1000, 5000]) {
  describe(`per-keystroke cost at session length ${n}`, () => {
    const charStates = buildCharStates(n);

    bench(`old: filter whole array (O(n)) @ n=${n}`, () => {
      oldKeystrokeCost(charStates);
    });

    bench(`new: running counter (O(1)) @ n=${n}`, () => {
      newKeystrokeCost(n - 1, true);
    });
  });
}
