// stats.ts
import { CharState } from './types';

export type WordCharMap = Record<number, CharState>;

export type TypingSample = {
    timestamp: number;
    correctChars: number;
    rawChars: number;
};

/* ---------------- core counters ---------------- */

// Character-by-character counting (new approach)
export function countCorrectCharsFromArray(charStates: CharState[]): number {
    return charStates.filter((c) => c.correct).length;
}

export function countRawCharsFromArray(charStates: CharState[]): number {
    return charStates.length;
}

export function countErrors(charStates: CharState[]): number {
    return charStates.filter((c) => !c.correct).length;
}

export function calculateAccuracy(charStates: CharState[]): number {
    if (charStates.length === 0) return 100;
    const correct = countCorrectCharsFromArray(charStates);
    return Math.round((correct / charStates.length) * 100);
}

// Legacy word-by-word counting (for backward compatibility)
export function countCorrectChars(
    typedMap: WordCharMap[],
    finalizedOnly = false,
    lastWordIndex?: number
) {
    let count = 0;

    typedMap.forEach((word, wordIndex) => {
        if (finalizedOnly && wordIndex === lastWordIndex) return;

        Object.values(word).forEach((c) => {
            if (c.correct) count++;
        });
    });

    return count;
}

export function countRawChars(typedMap: WordCharMap[]) {
    let count = 0;
    typedMap.forEach((word) => (count += Object.keys(word).length));
    return count;
}

/* ---------------- WPM math ---------------- */

export function calculateWPM(chars: number, elapsedMs: number) {
    if (elapsedMs <= 0) return 0;
    return Math.floor((chars / 5) / (elapsedMs / 60000));
}

/* ---------------- rolling window ---------------- */

export function calculateRollingWPM(
    samples: TypingSample[],
    windowMs = 3000
) {
    if (samples.length === 0) return 0;

    const now = samples[samples.length - 1].timestamp;
    const windowSamples = samples.filter(
        (s) => now - s.timestamp <= windowMs
    );

    if (windowSamples.length === 0) return 0;

    const first = windowSamples[0];
    const last = windowSamples[windowSamples.length - 1];

    const deltaChars = last.correctChars - first.correctChars;
    const deltaTime = last.timestamp - first.timestamp;

    return calculateWPM(deltaChars, deltaTime);
}
