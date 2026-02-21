// testModes.ts
import { GameConfig, GameMode } from './types';

export const DEFAULT_WORD_COUNT = 25;
export const WORD_COUNT_OPTIONS = [10, 25, 50, 100] as const;
export const TIME_OPTIONS = [15, 30, 60, 120] as const;


export const DEFAULT_CONFIG: GameConfig = {
    mode: 'words',
    wordCount: DEFAULT_WORD_COUNT,
    punctuation: false,
    numbers: false,
};

export function createGameConfig(
    mode: GameMode,
    options?: Partial<GameConfig>
): GameConfig {
    return {
        ...DEFAULT_CONFIG,
        mode,
        ...options,
    };
}
