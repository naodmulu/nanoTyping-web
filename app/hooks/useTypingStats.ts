// useTypingStats.ts
import { useMemo } from 'react';
import {
    calculateWPM,
    calculateRollingWPM,
    TypingSample,
    countCorrectCharsFromArray,
    countRawCharsFromArray,
    countErrors,
    calculateAccuracy,
} from '../utils/stats';
import { CharState } from '../utils/types';

export function useTypingStats(
    charStates: CharState[],
    elapsedMs: number,
    samples: TypingSample[]
) {
    return useMemo(() => {
        const correctChars = countCorrectCharsFromArray(charStates);
        const rawChars = countRawCharsFromArray(charStates);
        const errors = countErrors(charStates);
        const accuracy = calculateAccuracy(charStates);

        return {
            correctedWPM: calculateWPM(correctChars, elapsedMs),
            rawWPM: calculateWPM(rawChars, elapsedMs),
            rollingWPM: calculateRollingWPM(samples),
            finalizedWPM: calculateWPM(correctChars, elapsedMs),
            correctChars,
            rawChars,
            errors,
            accuracy,
        };
    }, [charStates, elapsedMs, samples]);
}
