import { describe, expect, it } from 'vitest';
import {
  EMPTY_COUNTS,
  applyBackspace,
  applyKeystroke,
  countsToAccuracy,
  countsToErrors,
  type TypingCounts,
} from '../typingCounters';

describe('applyKeystroke', () => {
  it('increments raw and correct on a correct char', () => {
    expect(applyKeystroke(EMPTY_COUNTS, true)).toEqual({ correctChars: 1, rawChars: 1 });
  });

  it('increments only raw on an incorrect char', () => {
    expect(applyKeystroke(EMPTY_COUNTS, false)).toEqual({ correctChars: 0, rawChars: 1 });
  });

  it('does not mutate the input', () => {
    const before: TypingCounts = { correctChars: 2, rawChars: 3 };
    applyKeystroke(before, true);
    expect(before).toEqual({ correctChars: 2, rawChars: 3 });
  });
});

describe('applyBackspace', () => {
  it('decrements raw and correct when removing a correct char', () => {
    expect(applyBackspace({ correctChars: 3, rawChars: 5 }, true)).toEqual({
      correctChars: 2,
      rawChars: 4,
    });
  });

  it('decrements only raw when removing an incorrect char', () => {
    expect(applyBackspace({ correctChars: 3, rawChars: 5 }, false)).toEqual({
      correctChars: 3,
      rawChars: 4,
    });
  });

  it('clamps at zero and never goes negative', () => {
    expect(applyBackspace(EMPTY_COUNTS, true)).toEqual({ correctChars: 0, rawChars: 0 });
    expect(applyBackspace({ correctChars: 0, rawChars: 1 }, true)).toEqual({
      correctChars: 0,
      rawChars: 0,
    });
  });
});

describe('counts derivations', () => {
  it('countsToErrors is raw minus correct', () => {
    expect(countsToErrors({ correctChars: 8, rawChars: 10 })).toBe(2);
    expect(countsToErrors(EMPTY_COUNTS)).toBe(0);
  });

  it('countsToAccuracy returns 100 for no input', () => {
    expect(countsToAccuracy(EMPTY_COUNTS)).toBe(100);
  });

  it('countsToAccuracy rounds the ratio', () => {
    // 2 of 3 => 66.66 => 67
    expect(countsToAccuracy({ correctChars: 2, rawChars: 3 })).toBe(67);
    expect(countsToAccuracy({ correctChars: 10, rawChars: 10 })).toBe(100);
  });
});

describe('counters match a brute-force scan (sequence regression)', () => {
  // Drives a known sequence of keystrokes + backspaces and checks the running
  // counters equal a from-scratch tally of the surviving char states.
  it('agrees with the reference after mistakes and backspaces', () => {
    type Char = { correct: boolean };
    const stack: Char[] = [];
    let counts = EMPTY_COUNTS;

    // type: c c x  (two correct, one wrong)
    for (const correct of [true, true, false]) {
      stack.push({ correct });
      counts = applyKeystroke(counts, correct);
    }
    // backspace the wrong char, then the second correct char
    for (let i = 0; i < 2; i += 1) {
      const removed = stack.pop()!;
      counts = applyBackspace(counts, removed.correct);
    }
    // type two more correct chars
    for (const correct of [true, true]) {
      stack.push({ correct });
      counts = applyKeystroke(counts, correct);
    }

    const reference: TypingCounts = {
      correctChars: stack.filter((c) => c.correct).length,
      rawChars: stack.length,
    };
    expect(counts).toEqual(reference);
    // sanity: 1 (surviving first) + 2 new = 3 correct, 3 raw
    expect(counts).toEqual({ correctChars: 3, rawChars: 3 });
  });
});
