// useTypingStats.ts
import { useMemo } from 'react';
import { calculateWPM, calculateRollingWPM, TypingSample } from '../utils/stats';
import {
    TypingCounts,
    countsToAccuracy,
    countsToErrors,
} from '../utils/typingCounters';

export function useTypingStats(
    counts: TypingCounts,
    elapsedMs: number,
    samples: TypingSample[]
) {
    return useMemo(() => {
        const { correctChars, rawChars } = counts;

        return {
            correctedWPM: calculateWPM(correctChars, elapsedMs),
            rawWPM: calculateWPM(rawChars, elapsedMs),
            rollingWPM: calculateRollingWPM(samples),
            finalizedWPM: calculateWPM(correctChars, elapsedMs),
            correctChars,
            rawChars,
            errors: countsToErrors(counts),
            accuracy: countsToAccuracy(counts),
        };
    }, [counts, elapsedMs, samples]);
}
