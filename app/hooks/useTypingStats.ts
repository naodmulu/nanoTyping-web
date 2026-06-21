// useTypingStats.ts
import { useMemo } from 'react';
import { calculateWPM } from '../utils/stats';
import {
    TypingCounts,
    countsToAccuracy,
    countsToErrors,
} from '../utils/typingCounters';

export function useTypingStats(counts: TypingCounts, elapsedMs: number) {
    return useMemo(() => {
        const { correctChars, rawChars } = counts;

        return {
            correctedWPM: calculateWPM(correctChars, elapsedMs),
            rawWPM: calculateWPM(rawChars, elapsedMs),
            finalizedWPM: calculateWPM(correctChars, elapsedMs),
            correctChars,
            rawChars,
            errors: countsToErrors(counts),
            accuracy: countsToAccuracy(counts),
        };
    }, [counts, elapsedMs]);
}
