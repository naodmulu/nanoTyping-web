import { describe, expect, it } from 'vitest';
import { calculateWPM } from '../stats';

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
