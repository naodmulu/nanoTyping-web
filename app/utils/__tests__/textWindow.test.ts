import { describe, expect, it } from 'vitest';
import {
  buildWordBoundaries,
  countCompletedWords,
  findWordIndexAtPosition,
  getVisibleWordWindow,
  type WordBoundary,
} from '../textWindow';

// Linear-scan reference for findWordIndexAtPosition: returns the word that
// contains `index`, or the word immediately before it.
function findWordIndexLinear(boundaries: WordBoundary[], index: number): number {
  if (boundaries.length === 0) return 0;
  const clamped = Math.max(0, index);
  let anchor = boundaries.length - 1;
  for (let i = 0; i < boundaries.length; i += 1) {
    const word = boundaries[i];
    if (clamped < word.start) {
      anchor = Math.max(0, i - 1);
      break;
    }
    if (clamped < word.end) {
      anchor = i;
      break;
    }
  }
  return anchor;
}

describe('buildWordBoundaries', () => {
  it('records correct start/end offsets for each word', () => {
    expect(buildWordBoundaries('hello world')).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ]);
  });

  it('ignores leading and trailing whitespace', () => {
    expect(buildWordBoundaries('  hi  there ')).toEqual([
      { start: 2, end: 4 },
      { start: 6, end: 11 },
    ]);
  });

  it('returns an empty array for an empty string', () => {
    expect(buildWordBoundaries('')).toEqual([]);
  });
});

describe('findWordIndexAtPosition', () => {
  it('returns 0 when there are no boundaries', () => {
    expect(findWordIndexAtPosition([], 5)).toBe(0);
  });

  it('matches the linear-scan reference across every index', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    const boundaries = buildWordBoundaries(text);

    for (let index = -2; index <= text.length + 2; index += 1) {
      expect(findWordIndexAtPosition(boundaries, index)).toBe(
        findWordIndexLinear(boundaries, index)
      );
    }
  });
});

describe('getVisibleWordWindow', () => {
  const text = 'one two three four five six seven eight';
  const boundaries = buildWordBoundaries(text);

  it('clamps the window at the start of the text', () => {
    const { visibleStart } = getVisibleWordWindow(text, boundaries, 0, 4);
    expect(visibleStart).toBe(0);
  });

  it('clamps the window at the end of the text', () => {
    const { visibleEnd } = getVisibleWordWindow(text, boundaries, text.length, 4);
    expect(visibleEnd).toBe(text.length);
  });

  it('returns a zeroed window for empty input', () => {
    expect(getVisibleWordWindow('', [], 0, 4)).toEqual({ visibleStart: 0, visibleEnd: 0 });
  });
});

describe('countCompletedWords', () => {
  const text = 'hello world foo';

  it('returns 0 for empty text', () => {
    expect(countCompletedWords('', 5)).toBe(0);
  });

  it('does not count a word still being typed (mid-word)', () => {
    // index 8 sits inside "world"
    expect(countCompletedWords(text, 8)).toBe(1);
  });

  it('counts a word once the cursor reaches the following space', () => {
    // index 11 is the space after "world"
    expect(countCompletedWords(text, 11)).toBe(2);
  });

  it('counts all words when the cursor is at the end', () => {
    expect(countCompletedWords(text, text.length)).toBe(3);
  });
});
