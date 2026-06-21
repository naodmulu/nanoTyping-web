// types.ts
export type CharState = {
    correct: boolean;
    typedChar: string;
    position: number; // absolute position in text
};

export type GameMode = 'words' | 'time' | 'quote';

export type GameConfig = {
    mode: GameMode;
    wordCount?: number; // for words mode: 10, 25, 50, 100
    timeLimit?: number; // for time mode: seconds
    punctuation: boolean;
    numbers: boolean;
};
