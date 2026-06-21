// typingCounters.ts
//
// Running tallies for typed characters, updated in O(1) per keystroke instead
// of re-scanning the full charStates array on every key / render. `charStates`
// is still kept for rendering; these counters are the source of truth for the
// aggregate stats (WPM, accuracy, errors).

export type TypingCounts = {
    correctChars: number;
    rawChars: number;
};

export const EMPTY_COUNTS: TypingCounts = Object.freeze({
    correctChars: 0,
    rawChars: 0,
});

// One character typed: raw always grows; correct grows only on a match.
export function applyKeystroke(counts: TypingCounts, isCorrect: boolean): TypingCounts {
    return {
        correctChars: counts.correctChars + (isCorrect ? 1 : 0),
        rawChars: counts.rawChars + 1,
    };
}

// One character removed (backspace): undo whatever that character contributed.
// `removedWasCorrect` is read from the charState being dropped. Clamped at 0 so
// the counters can never go negative on an over-eager backspace.
export function applyBackspace(counts: TypingCounts, removedWasCorrect: boolean): TypingCounts {
    return {
        correctChars: Math.max(0, counts.correctChars - (removedWasCorrect ? 1 : 0)),
        rawChars: Math.max(0, counts.rawChars - 1),
    };
}

export function countsToErrors(counts: TypingCounts): number {
    return counts.rawChars - counts.correctChars;
}

export function countsToAccuracy(counts: TypingCounts): number {
    if (counts.rawChars === 0) return 100;
    return Math.round((counts.correctChars / counts.rawChars) * 100);
}
