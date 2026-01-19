// useTypingStats.ts
import { useMemo } from 'react';
import {
    WordCharMap,
    countCorrectChars,
    countRawChars,
    calculateWPM,
    calculateRollingWPM,
    TypingSample,
} from '../utils/stats';

export function useTypingStats(
    typedMap: WordCharMap[],
    elapsedMs: number,
    currentWordIndex: number,
    samples: TypingSample[]
) {
    return useMemo(() => {
        const correctChars = countCorrectChars(typedMap);
        const rawChars = countRawChars(typedMap);

        return {
            correctedWPM: calculateWPM(correctChars, elapsedMs),
            rawWPM: calculateWPM(rawChars, elapsedMs),
            rollingWPM: calculateRollingWPM(samples),
            finalizedWPM: calculateWPM(
                countCorrectChars(typedMap, true, currentWordIndex),
                elapsedMs
            ),
            correctChars,
        };
    }, [typedMap, elapsedMs, currentWordIndex, samples]);
}
