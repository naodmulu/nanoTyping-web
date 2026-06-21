import { describe, expect, it } from 'vitest';
import {
  calculateAccuracy,
  calculateRollingWPM,
  calculateWPM,
  countCorrectCharsFromArray,
  countErrors,
  countRawCharsFromArray,
  type TypingSample,
} from '../stats';
import type { CharState } from '../types';

function makeChars(pattern: boolean[]): CharState[] {
  return pattern.map((correct, position) => ({
    correct,
    typedChar: correct ? 'a' : 'b',
    position,
  }));
}

describe('calculateWPM', () => {
  it('computes words-per-minute from chars and elapsed time', () => {
    // 250 chars / 5 = 50 words in exactly one minute => 50 wpm
    expect(calculateWPM(250, 60_000)).toBe(50);
  });

  it('returns 0 when elapsed time is zero or negative', () => {
    expect(calculateWPM(100, 0)).toBe(0);
    expect(calculateWPM(100, -1)).toBe(0);
  });

  it('floors fractional results', () => {
    // 11 chars / 5 = 2.2 words in one minute => floored to 2
    expect(calculateWPM(11, 60_000)).toBe(2);
  });
});

describe('calculateAccuracy', () => {
  it('returns 100 for an empty array', () => {
    expect(calculateAccuracy([])).toBe(100);
  });

  it('returns 100 when every char is correct', () => {
    expect(calculateAccuracy(makeChars([true, true, true]))).toBe(100);
  });

  it('rounds a mixed result', () => {
    // 2 of 3 correct => 66.66% => rounds to 67
    expect(calculateAccuracy(makeChars([true, true, false]))).toBe(67);
  });
});

describe('char counters', () => {
  const chars = makeChars([true, false, true, true, false]);

  it('counts correct chars', () => {
    expect(countCorrectCharsFromArray(chars)).toBe(3);
  });

  it('counts raw chars (total length)', () => {
    expect(countRawCharsFromArray(chars)).toBe(5);
  });

  it('counts errors', () => {
    expect(countErrors(chars)).toBe(2);
  });
});

describe('calculateRollingWPM', () => {
  it('returns 0 for no samples', () => {
    expect(calculateRollingWPM([])).toBe(0);
  });

  it('returns 0 for a single sample (no delta)', () => {
    const samples: TypingSample[] = [
      { timestamp: 1_000, correctChars: 5, rawChars: 5 },
    ];
    expect(calculateRollingWPM(samples)).toBe(0);
  });

  it('computes wpm over the sample window', () => {
    const samples: TypingSample[] = [
      { timestamp: 0, correctChars: 0, rawChars: 0 },
      { timestamp: 1_000, correctChars: 5, rawChars: 5 },
      { timestamp: 2_000, correctChars: 10, rawChars: 10 },
      { timestamp: 3_000, correctChars: 15, rawChars: 15 },
    ];
    // delta 15 chars over 3s => calculateWPM(15, 3000) => 60
    expect(calculateRollingWPM(samples, 3_000)).toBe(60);
  });

  it('respects windowMs by dropping older samples', () => {
    const samples: TypingSample[] = [
      { timestamp: 0, correctChars: 0, rawChars: 0 },
      { timestamp: 5_000, correctChars: 100, rawChars: 100 },
    ];
    // default 3s window: only the last sample remains => no delta => 0
    expect(calculateRollingWPM(samples)).toBe(0);
    // 6s window: both samples => delta 100 over 5s => 240 wpm
    expect(calculateRollingWPM(samples, 6_000)).toBe(240);
  });
});
