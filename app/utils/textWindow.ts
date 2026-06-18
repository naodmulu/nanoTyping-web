export type WordBoundary = {
    start: number;
    end: number;
};

export type LineBoundary = {
    startWordIndex: number;
    endWordIndex: number;
};

export type LineLayout = {
    lineBoundaries: LineBoundary[];
    visibleLineCount: number;
};

export function buildWordBoundaries(text: string): WordBoundary[] {
    const boundaries: WordBoundary[] = [];
    const wordPattern = /\S+/g;

    let match: RegExpExecArray | null;
    while ((match = wordPattern.exec(text)) !== null) {
        boundaries.push({
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return boundaries;
}

export function getVisibleWordWindow(
    text: string,
    boundaries: WordBoundary[],
    currentIndex: number,
    wordWindowSize: number
) {
    if (text.length === 0 || boundaries.length === 0) {
        return { visibleStart: 0, visibleEnd: 0 };
    }

    const clampedIndex = Math.max(0, Math.min(currentIndex, text.length));
    let anchorWordIndex = boundaries.length - 1;
    // NOTE: If performace becomes an issue, change algorithm to binary search
    // Find the word that contains the current index or is immediately before it
    for (let index = 0; index < boundaries.length; index += 1) {
        const word = boundaries[index];

        if (clampedIndex < word.start) {
            anchorWordIndex = Math.max(0, index - 1);
            break;
        }

        if (clampedIndex < word.end) {
            anchorWordIndex = index;
            break;
        }
    }

    const halfWindow = Math.floor(wordWindowSize / 2);
    let startWordIndex = Math.max(0, anchorWordIndex - halfWindow);
    let endWordIndex = Math.min(boundaries.length, startWordIndex + wordWindowSize);

    if (endWordIndex - startWordIndex < wordWindowSize) {
        startWordIndex = Math.max(0, endWordIndex - wordWindowSize);
    }

    return {
        visibleStart: boundaries[startWordIndex].start,
        visibleEnd: boundaries[endWordIndex - 1].end,
    };
}

export function findWordIndexAtPosition(boundaries: WordBoundary[], index: number): number {
    if (boundaries.length === 0) {
        return 0;
    }

    const clampedIndex = Math.max(0, index);
    let left = 0;
    let right = boundaries.length - 1;
    let anchorWordIndex = boundaries.length - 1;

    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        const word = boundaries[mid];

        if (clampedIndex < word.start) {
            anchorWordIndex = Math.max(0, mid - 1);
            right = mid - 1;
        } else if (clampedIndex >= word.end) {
            left = mid + 1;
        } else {
            anchorWordIndex = mid;
            break;
        }
    }

    return anchorWordIndex;
}

export function getVisibleLineWindow(
    boundaries: WordBoundary[],
    lineBoundaries: LineBoundary[],
    currentIndex: number,
    visibleLineCount: number
) {
    if (boundaries.length === 0 || lineBoundaries.length === 0) {
        return { visibleStart: 0, visibleEnd: 0 };
    }

    const currentWordIndex = findWordIndexAtPosition(boundaries, currentIndex);
    let anchorLineIndex = lineBoundaries.length - 1;

    for (let index = 0; index < lineBoundaries.length; index += 1) {
        const line = lineBoundaries[index];

        if (currentWordIndex < line.startWordIndex) {
            anchorLineIndex = Math.max(0, index - 1);
            break;
        }

        if (currentWordIndex <= line.endWordIndex) {
            anchorLineIndex = index;
            break;
        }
    }

    const lineWindowSize = Math.max(1, visibleLineCount);
    const halfWindow = Math.floor(lineWindowSize / 2);
    let startLineIndex = Math.max(0, anchorLineIndex - halfWindow);
    let endLineIndex = Math.min(lineBoundaries.length, startLineIndex + lineWindowSize);

    if (endLineIndex - startLineIndex < lineWindowSize) {
        startLineIndex = Math.max(0, endLineIndex - lineWindowSize);
    }

    const startWordIndex = lineBoundaries[startLineIndex].startWordIndex;
    const endWordIndex = lineBoundaries[endLineIndex - 1].endWordIndex;

    return {
        visibleStart: boundaries[startWordIndex].start,
        visibleEnd: boundaries[endWordIndex].end,
    };
}

export function countCompletedWords(text: string, index: number): number {
    if (text.length === 0) {
        return 0;
    }

    const clampedIndex = Math.max(0, Math.min(index, text.length));
    const typedText = text.slice(0, clampedIndex);
    const words = typedText.split(/\s+/).filter((word) => word.length > 0);

    if (clampedIndex < text.length && text[clampedIndex] !== ' ') {
        return Math.max(0, words.length - 1);
    }

    return words.length;
}
