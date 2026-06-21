import { describe, expect, it } from 'vitest';
import { generateWordPassage } from '../textGenerator';

describe('generateWordPassage', () => {
  it('returns exactly n space-separated words', () => {
    const passage = generateWordPassage(25);
    expect(passage.split(' ')).toHaveLength(25);
  });

  it('returns exactly n words even when n exceeds the source bank (cycle logic)', () => {
    const source = ['alpha', 'beta', 'gamma'];
    const passage = generateWordPassage(7, source);
    const words = passage.split(' ');

    expect(words).toHaveLength(7);
    // every produced word comes from the small source bank
    expect(words.every((word) => source.includes(word))).toBe(true);
  });

  it('returns an empty string for a non-positive count', () => {
    expect(generateWordPassage(0)).toBe('');
  });

  it('throws when the word bank is empty', () => {
    expect(() => generateWordPassage(3, [])).toThrow('Word bank is empty.');
  });

  it('produces only trimmed, non-empty tokens', () => {
    const words = generateWordPassage(50).split(' ');
    expect(words.every((word) => word.length > 0 && word === word.trim())).toBe(true);
  });
});
