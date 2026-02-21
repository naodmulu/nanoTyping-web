// types.ts
export type CharState = {
    correct: boolean;
    typedChar: string;
    position: number; // absolute position in text
};

// Keep WordCharMap for backward compatibility during migration
export type WordCharMap = Record<number, CharState>;

export type TypingSample = {
    timestamp: number;
    correctChars: number;
    rawChars: number;
};

export type GameMode = 'words' | 'time' | 'quote' | 'custom';

export type GameConfig = {
    mode: GameMode;
    wordCount?: number; // for words mode: 10, 25, 50, 100
    timeLimit?: number; // for time mode: seconds
    punctuation: boolean;
    numbers: boolean;
};
