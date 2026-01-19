// stats.ts
export type CharState = {
    correct: boolean;
    typedChar: string;
};

export type WordCharMap = Record<number, CharState>;

export type TypingSample = {
    timestamp: number;
    correctChars: number;
    rawChars: number;
};

/* ---------------- core counters ---------------- */

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
