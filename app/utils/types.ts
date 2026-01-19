// types.ts
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
