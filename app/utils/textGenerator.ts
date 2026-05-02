import wordBank from '@/app/data/words.json';
import { GameConfig } from '@/app/utils/types';

const DEFAULT_WORD_COUNT = 25;
const TIME_MODE_WORD_BUFFER_SIZE = 1000;

const SANITIZED_WORD_BANK = wordBank
  .map((word) => word.trim())
  .filter((word) => word.length > 0);

function shuffleWords(words: readonly string[]): string[] {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createRandomizedPassage(
  targetWordCount: number,
  sourceWords: readonly string[] = SANITIZED_WORD_BANK
): string {
  if (targetWordCount <= 0) {
    return '';
  }

  if (sourceWords.length === 0) {
    throw new Error('Word bank is empty.');
  }

  const collected: string[] = [];
  let remaining = targetWordCount;

  while (remaining > 0) {
    const cycle = shuffleWords(sourceWords);
    const wordsToTake = Math.min(remaining, cycle.length);

    collected.push(...cycle.slice(0, wordsToTake));
    remaining -= wordsToTake;
  }

  return collected.join(' ');
}

export function generateWordPassage(
  wordCount: number,
  sourceWords: readonly string[] = SANITIZED_WORD_BANK
): string {
  return createRandomizedPassage(wordCount, sourceWords);
}

export function generateTimePassage(
  sourceWords: readonly string[] = SANITIZED_WORD_BANK
): string {
  return createRandomizedPassage(TIME_MODE_WORD_BUFFER_SIZE, sourceWords);
}

export function generateText(
  config: Pick<GameConfig, 'mode' | 'wordCount' | 'punctuation' | 'numbers'>
): string {
  if (config.mode === 'time') {
    return generateTimePassage();
  }

  return generateWordPassage(config.wordCount ?? DEFAULT_WORD_COUNT);
}
